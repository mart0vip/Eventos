/**
 * Idempotent `CREATE DATABASE eventos_test` on the local docker-compose Postgres,
 * connecting via the default `eventos` database (you can't CREATE DATABASE while
 * connected to the database you're creating, and eventos_test may not exist yet).
 * Run via `npm run db:test:create`, wired to .env.test for the target DB name.
 */
import { Client } from "pg";

async function createTestDb(): Promise<void> {
  const testUrl = new URL(process.env.DATABASE_URL ?? "");
  const dbName = testUrl.pathname.replace(/^\//, "");

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/eventos";

  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`created database ${dbName}`);
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: string }).code === "42P04") {
      console.log(`database ${dbName} already exists, skipping`);
    } else {
      throw err;
    }
  } finally {
    await client.end();
  }
}

createTestDb().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
