import { readdirSync, readFileSync } from "fs";
import path from "path";
import { getPool } from "./client";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

/**
 * Applies every `.sql` file in `migrations/` that hasn't been recorded yet in the
 * `schema_migrations` ledger table, in lexical filename order, each inside its own
 * transaction. Safe to run repeatedly — already-applied files are skipped, so this
 * is the idempotent entry point wired to `npm run db:migrate`.
 */
async function migrate(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows: appliedRows } = await pool.query<{ filename: string }>(
    "SELECT filename FROM schema_migrations"
  );
  const applied = new Set(appliedRows.map((r) => r.filename));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip  ${file} (already applied)`);
      continue;
    }

    const sql = readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`apply ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
