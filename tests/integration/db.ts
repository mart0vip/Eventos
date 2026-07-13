import { getPool } from "@/lib/db/client";

/**
 * Truncates every app table (everything except the migration ledger) and resets
 * identity sequences, so each integration test starts from a clean, predictable
 * database without re-running migrations. Call from a `beforeEach`.
 */
export async function resetDb(): Promise<void> {
  const pool = getPool();
  const { rows } = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = 'public' AND tablename != 'schema_migrations'`
  );
  if (rows.length === 0) return;

  const tables = rows.map((r) => `"${r.tablename}"`).join(", ");
  await pool.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}

/** Closes the shared pg.Pool — call once in a global `afterAll` per test file. */
export async function closeDbPool(): Promise<void> {
  await getPool().end();
}
