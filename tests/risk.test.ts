import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateRisk } from "../src/lib/risk";
import {
  holdingInput,
  orderInput,
  portfolioInput,
} from "../src/lib/validation";
test("cash-only portfolio has zero market risk", () => {
  const r = calculateRisk([], 1000);
  assert.equal(r.nav, 1000);
  assert.equal(r.var99, 0);
  assert.equal(r.es975, 0);
});
test("single position VaR and ES use the correct confidence factors", () => {
  const r = calculateRisk(
    [{ quantity: 100, price: 10, cost: 8, volatility: 0.02 }],
    500,
  );
  assert.equal(r.nav, 1500);
  assert.ok(Math.abs(r.var99 - 46.52695748) < 1e-6);
  assert.ok(Math.abs(r.es975 - 46.75605584) < 1e-6);
  assert.equal(r.pnl, 200);
  assert.equal(r.shockLoss, -100);
});
test("two positions include pairwise covariance", () => {
  const r = calculateRisk(
    [
      { quantity: 100, price: 10, cost: 10, volatility: 0.02 },
      { quantity: 100, price: 10, cost: 10, volatility: 0.02 },
    ],
    0,
  );
  assert.ok(Math.abs(r.var99 - 2.326347874 * Math.sqrt(1080)) < 1e-6);
});
test("selling exposure into cash preserves NAV and reduces model risk", () => {
  const before = calculateRisk(
    [{ quantity: 100, price: 10, cost: 10, volatility: 0.02 }],
    0,
  );
  const after = calculateRisk(
    [{ quantity: 50, price: 10, cost: 10, volatility: 0.02 }],
    500,
  );
  assert.equal(before.nav, after.nav);
  assert.equal(before.var99 / 2, after.var99);
});
test("server validation rejects negative, nonfinite and excessive inputs", () => {
  for (const quantity of [-1, 0, Infinity, NaN, 1000001])
    assert.equal(
      holdingInput.safeParse({
        symbol: "AAPL",
        quantity,
        price: 10,
        volatility: 0.02,
      }).success,
      false,
    );
  assert.equal(
    portfolioInput.safeParse({ name: "x", cash: -5 }).success,
    false,
  );
  assert.equal(
    orderInput.safeParse({
      holdingId: "not-uuid",
      quantity: 1,
      idempotencyKey: "x",
    }).success,
    false,
  );
});
test("validation rejects extra fields and normalizes ticker symbols", () => {
  assert.equal(
    holdingInput.parse({
      symbol: " aapl ",
      quantity: 1,
      price: 10,
      volatility: 0.02,
    }).symbol,
    "AAPL",
  );
  assert.equal(
    portfolioInput.safeParse({ name: "Test", cash: 1000, role: "owner" })
      .success,
    false,
  );
});
