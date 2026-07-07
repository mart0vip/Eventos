import { getPool } from "../client";

/**
 * Records a generated legacy export in the `export_logs` audit table (Fase 3),
 * so the club can verify which planillas were produced and when.
 */
export async function insertExportLog(params: {
  exportDate: string;
  fileName: string;
  rowCount: number;
  exportedBy: "cron" | "manual";
}): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO export_logs (export_date, file_name, row_count, exported_by)
     VALUES ($1, $2, $3, $4)`,
    [params.exportDate, params.fileName, params.rowCount, params.exportedBy]
  );
}
