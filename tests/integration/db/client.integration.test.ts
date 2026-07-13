import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getPool } from "@/lib/db/client";
import { closeDbPool, resetDb } from "../db";
import { createCompetition } from "../fixtures";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDbPool();
});

describe("DATE column parsing (client.ts type parser)", () => {
  it("returns DATE columns as plain YYYY-MM-DD strings, not JS Date objects", async () => {
    const competitionId = await createCompetition({
      dateFrom: "2026-01-15",
      dateTo: "2026-01-16",
    });

    const pool = getPool();
    const { rows } = await pool.query("SELECT date_from, date_to FROM competitions WHERE id = $1", [
      competitionId,
    ]);

    // node-postgres auto-converts DATE (OID 1082) to a JS Date at local midnight by
    // default, which then serializes as a UTC timestamp shifted by the server's
    // timezone offset — silently rendering the *previous* day in timezones behind
    // UTC. client.ts disables that auto-parse; assert it stayed a plain string.
    expect(typeof rows[0].date_from).toBe("string");
    expect(rows[0].date_from).toBe("2026-01-15");
    expect(typeof rows[0].date_to).toBe("string");
    expect(rows[0].date_to).toBe("2026-01-16");
  });

  it("round-trips a date near a UTC day boundary without shifting", async () => {
    // Date-only strings whose local-midnight interpretation, if converted to a JS
    // Date and re-serialized in a UTC-behind timezone, would show the wrong day —
    // this is exactly the bug class the custom type parser guards against.
    const competitionId = await createCompetition({
      dateFrom: "2026-12-31",
      dateTo: "2027-01-01",
    });

    const pool = getPool();
    const { rows } = await pool.query("SELECT date_from, date_to FROM competitions WHERE id = $1", [
      competitionId,
    ]);

    expect(rows[0].date_from).toBe("2026-12-31");
    expect(rows[0].date_to).toBe("2027-01-01");
  });
});
