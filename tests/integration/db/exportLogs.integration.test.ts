import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getPool } from "@/lib/db/client";
import { closeDbPool, resetDb } from "../db";
import { insertExportLog } from "@/lib/db/queries/exportLogs";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDbPool();
});

describe("insertExportLog", () => {
  it("records the export audit row", async () => {
    await insertExportLog({
      exportDate: "2026-09-05",
      fileName: "concurso_2026-09-05.xlsx",
      rowCount: 12,
      exportedBy: "manual",
    });

    const pool = getPool();
    const { rows } = await pool.query("SELECT * FROM export_logs");
    expect(rows).toHaveLength(1);
    expect(rows[0].file_name).toBe("concurso_2026-09-05.xlsx");
    expect(rows[0].row_count).toBe(12);
    expect(rows[0].exported_by).toBe("manual");
  });
});
