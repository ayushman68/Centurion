import { Pool, type PoolClient } from "pg";
const globalDb = globalThis as unknown as { pool?: Pool };
export const db =
  globalDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
  });
if (process.env.NODE_ENV !== "production") globalDb.pool = db;
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
