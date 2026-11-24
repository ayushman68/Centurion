import type { PoolClient } from "pg";
import Decimal from "decimal.js";
import { db, transaction } from "./db";
import { AppError } from "./http";
import { calculateRisk } from "./risk";
import type { z } from "zod";
import type {
  portfolioInput,
  holdingInput,
  markInput,
  orderInput,
  memberInput,
} from "./validation";

export async function authorize(
  client: Pick<PoolClient, "query">,
  id: string,
  userId: string,
  write = false,
  owner = false,
) {
  const { rows } = await client.query(
    "SELECT p.*,m.role FROM portfolios p JOIN members m ON m.portfolio_id=p.id WHERE p.id=$1 AND m.user_id=$2",
    [id, userId],
  );
  if (!rows.length)
    throw new AppError(404, "NOT_FOUND", "Portfolio not found.");
  if (
    (write && rows[0].role === "viewer") ||
    (owner && rows[0].role !== "owner")
  )
    throw new AppError(
      403,
      "FORBIDDEN",
      "Your role does not allow this action.",
    );
  return rows[0];
}
async function lock(
  client: PoolClient,
  id: string,
  userId: string,
  owner = false,
) {
  await client.query("SELECT id FROM portfolios WHERE id=$1 FOR UPDATE", [id]);
  return authorize(client, id, userId, true, owner);
}
async function audit(
  client: PoolClient,
  id: string,
  userId: string,
  action: string,
  detail: unknown,
) {
  await client.query(
    "INSERT INTO audit_events(portfolio_id,actor_id,action,detail) VALUES($1,$2,$3,$4)",
    [id, userId, action, JSON.stringify(detail)],
  );
}
export async function createPortfolio(
  userId: string,
  input: z.infer<typeof portfolioInput>,
) {
  return transaction(async (c) => {
    const { rows } = await c.query(
      "INSERT INTO portfolios(name,cash,is_demo) VALUES($1,$2,$3) RETURNING *",
      [input.name, input.demo ? 250000 : input.cash, input.demo],
    );
    const p = rows[0];
    await c.query("INSERT INTO members VALUES($1,$2,'owner')", [p.id, userId]);
    if (input.demo) {
      for (const h of [
        ["AAPL", 1200, 185.5, 175, 0.0182],
        ["MSFT", 800, 420.25, 400, 0.0164],
        ["NVDA", 1500, 125, 110, 0.0345],
        ["SPY", 600, 505, 495, 0.0112],
      ]) {
        await c.query(
          "INSERT INTO holdings(portfolio_id,symbol,quantity,price,cost,volatility) VALUES($1,$2,$3,$4,$5,$6)",
          [p.id, ...h],
        );
      }
    }
    await audit(c, p.id, userId, "PORTFOLIO_CREATED", {
      name: input.name,
      mode: "paper",
      demo: input.demo,
    });
    return p;
  });
}
export async function detail(userId: string, id: string) {
  return transaction(async (c) => {
    // A single repeatable-read snapshot keeps balances, holdings and risk consistent during execution.
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const portfolio = await authorize(c, id, userId);
    const holdings = (
      await c.query(
        "SELECT * FROM holdings WHERE portfolio_id=$1 AND quantity>0 ORDER BY symbol",
        [id],
      )
    ).rows;
    return {
      portfolio,
      holdings,
      risk: calculateRisk(holdings, Number(portfolio.cash)),
      asOf: new Date().toISOString(),
    };
  });
}
export async function addHolding(
  userId: string,
  id: string,
  input: z.infer<typeof holdingInput>,
) {
  return transaction(async (c) => {
    const p = await lock(c, id, userId);
    const amount = new Decimal(input.quantity)
      .mul(input.price)
      .toDecimalPlaces(4);
    if (amount.lte(0) || amount.gt(p.cash))
      throw new AppError(
        409,
        "INSUFFICIENT_CASH",
        "Not enough paper cash for this allocation.",
      );
    if (
      (
        await c.query(
          "SELECT id FROM holdings WHERE portfolio_id=$1 AND symbol=$2",
          [id, input.symbol],
        )
      ).rowCount
    )
      throw new AppError(
        409,
        "DUPLICATE_SYMBOL",
        "This symbol already exists. Use a different symbol.",
      );
    if (
      Number(
        (
          await c.query("SELECT count(*) FROM holdings WHERE portfolio_id=$1", [
            id,
          ])
        ).rows[0].count,
      ) >= 100
    )
      throw new AppError(
        409,
        "HOLDING_LIMIT",
        "A portfolio supports up to 100 positions.",
      );
    await c.query(
      "INSERT INTO holdings(portfolio_id,symbol,quantity,cost,price,volatility) VALUES($1,$2,$3,$4,$4,$5)",
      [id, input.symbol, input.quantity, input.price, input.volatility],
    );
    await c.query("UPDATE portfolios SET cash=cash-$2 WHERE id=$1", [
      id,
      amount.toString(),
    ]);
    await audit(c, id, userId, "POSITION_ADDED", {
      ...input,
      cashUsed: amount.toString(),
    });
    return { symbol: input.symbol };
  });
}
export async function markHolding(
  userId: string,
  id: string,
  input: z.infer<typeof markInput>,
) {
  return transaction(async (c) => {
    await lock(c, id, userId);
    const r = await c.query(
      "UPDATE holdings SET price=$3,volatility=$4,marked_at=now() WHERE portfolio_id=$1 AND id=$2 RETURNING symbol",
      [id, input.holdingId, input.price, input.volatility],
    );
    if (!r.rowCount)
      throw new AppError(404, "NOT_FOUND", "Position not found.");
    await audit(c, id, userId, "PRICE_MARKED", {
      ...input,
      symbol: r.rows[0].symbol,
      source: "manual",
    });
    return r.rows[0];
  });
}
export async function executeOrder(
  userId: string,
  id: string,
  input: z.infer<typeof orderInput>,
) {
  return transaction(async (c) => {
    await lock(c, id, userId);
    const previous = await c.query(
      "SELECT * FROM orders WHERE portfolio_id=$1 AND idempotency_key=$2",
      [id, input.idempotencyKey],
    );
    if (previous.rowCount) {
      const o = previous.rows[0];
      if (
        o.holding_id !== input.holdingId ||
        !new Decimal(o.quantity).eq(input.quantity)
      )
        throw new AppError(
          409,
          "IDEMPOTENCY_CONFLICT",
          "This request key was already used for a different order.",
        );
      return o;
    }
    const { rows } = await c.query(
      "SELECT * FROM holdings WHERE id=$1 AND portfolio_id=$2 FOR UPDATE",
      [input.holdingId, id],
    );
    const h = rows[0];
    if (!h) throw new AppError(404, "NOT_FOUND", "Position not found.");
    if (new Decimal(input.quantity).gt(h.quantity))
      throw new AppError(
        409,
        "INSUFFICIENT_QUANTITY",
        "Quantity exceeds the available position.",
      );
    const proceeds = new Decimal(input.quantity)
      .mul(h.price)
      .toDecimalPlaces(4);
    if (proceeds.lte(0))
      throw new AppError(
        422,
        "MIN_NOTIONAL",
        "Order value must be at least $0.0001.",
      );
    const order = (
      await c.query(
        "INSERT INTO orders(portfolio_id,holding_id,actor_id,quantity,price,proceeds,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        [
          id,
          h.id,
          userId,
          input.quantity,
          h.price,
          proceeds.toString(),
          input.idempotencyKey,
        ],
      )
    ).rows[0];
    await c.query("UPDATE holdings SET quantity=quantity-$2 WHERE id=$1", [
      h.id,
      input.quantity,
    ]);
    await c.query("UPDATE portfolios SET cash=cash+$2 WHERE id=$1", [
      id,
      proceeds.toString(),
    ]);
    await audit(c, id, userId, "PAPER_SELL_EXECUTED", {
      orderId: order.id,
      symbol: h.symbol,
      quantity: input.quantity,
      price: h.price,
      proceeds: proceeds.toString(),
    });
    return order;
  });
}
export async function setRiskLimit(
  userId: string,
  id: string,
  riskLimit: number,
) {
  return transaction(async (c) => {
    await lock(c, id, userId);
    await c.query("UPDATE portfolios SET risk_limit=$2 WHERE id=$1", [
      id,
      riskLimit,
    ]);
    await audit(c, id, userId, "RISK_LIMIT_CHANGED", { riskLimit });
    return { riskLimit };
  });
}
export async function setMember(
  userId: string,
  id: string,
  input: z.infer<typeof memberInput>,
) {
  return transaction(async (c) => {
    await lock(c, id, userId, true);
    const { rows } = await c.query(
      'SELECT id FROM "user" WHERE lower(email)=lower($1)',
      [input.email],
    );
    if (!rows.length)
      throw new AppError(
        404,
        "USER_NOT_FOUND",
        "Ask this person to create a Centurion account first.",
      );
    const existing = await c.query(
      "SELECT role FROM members WHERE portfolio_id=$1 AND user_id=$2",
      [id, rows[0].id],
    );
    if (existing.rows[0]?.role === "owner")
      throw new AppError(
        409,
        "OWNER_ROLE",
        "The owner role cannot be changed.",
      );
    await c.query(
      "INSERT INTO members(portfolio_id,user_id,role) VALUES($1,$2,$3) ON CONFLICT(portfolio_id,user_id) DO UPDATE SET role=EXCLUDED.role",
      [id, rows[0].id, input.role],
    );
    await audit(c, id, userId, "ACCESS_CHANGED", {
      userId: rows[0].id,
      role: input.role,
    });
    return { role: input.role };
  });
}
export async function removeMember(
  userId: string,
  id: string,
  memberId: string,
) {
  return transaction(async (c) => {
    await lock(c, id, userId, true);
    const r = await c.query(
      "DELETE FROM members WHERE portfolio_id=$1 AND user_id=$2 AND role!='owner' RETURNING user_id",
      [id, memberId],
    );
    if (!r.rowCount)
      throw new AppError(404, "NOT_FOUND", "Removable member not found.");
    await audit(c, id, userId, "ACCESS_REMOVED", { userId: memberId });
    return { removed: true };
  });
}
export async function listHistory(
  userId: string,
  id: string,
  kind: "orders" | "audit",
  page: number,
  limit: number,
) {
  await authorize(db, id, userId);
  const table = kind === "orders" ? "orders" : "audit_events";
  const rows = (
    await db.query(
      `SELECT t.*${kind === "orders" ? ",h.symbol" : ",u.name AS actor_name"} FROM ${table} t ${kind === "orders" ? "JOIN holdings h ON h.id=t.holding_id" : 'JOIN "user" u ON u.id=t.actor_id'} WHERE t.portfolio_id=$1 ORDER BY t.created_at DESC,t.id DESC LIMIT $2 OFFSET $3`,
      [id, limit + 1, (page - 1) * limit],
    )
  ).rows;
  return { items: rows.slice(0, limit), hasMore: rows.length > limit, page };
}
