import { Pool, types } from "pg";

// node-postgres auto-converts DATE columns (OID 1082) into JS Date objects by
// default, coercing the date-only value to local midnight. Serializing that
// object later (e.g. via JSON.stringify/NextResponse.json) then renders it as
// a full UTC ISO timestamp shifted by the server's timezone offset — the same
// date-only timezone bug already fixed elsewhere in this codebase via
// parseISO(). Disabling the auto-parse here keeps DATE columns (date_from,
// date_to, day_date, due_date) as plain "YYYY-MM-DD" strings, matching the
// domain types' documented contract.
types.setTypeParser(1082, (value) => value);

let pool: Pool;

/** Returns the app's singleton Postgres connection pool, creating it on first use. */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}
