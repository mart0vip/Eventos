import ExcelJS from "exceljs";
import { listConfirmedRegistrationsForDay } from "./db/queries/registrations";

/**
 * Fase 3 — daily XLSX export for the club's legacy desktop system (Visual
 * FoxPro / Access / Delphi, file-based integration only). One sheet with one
 * row per confirmed registration of the requested day, using the column
 * layout from the source spec:
 *
 *   Prueba | Categoría | Orden Sorteo | Jinete | Caballo | Licencia | Box
 *   | Email | Monto | ID Pago MP
 *
 * "Monto" is expressed in pesos (not centavos) because the legacy system's
 * import wizard expects plain currency values. The exact legacy column naming
 * hasn't been validated against the club's import wizard yet — adjust the
 * header strings below after the pending session with the club (see
 * docs/fase2-4-setup.md).
 *
 * Returns `null` when the day has no confirmed registrations, so the endpoint
 * can answer 404 instead of shipping an empty planilla.
 */
export async function generateDailyExport(
  competitionId: string,
  date: string
): Promise<{ buffer: Buffer; rowCount: number } | null> {
  const rows = await listConfirmedRegistrationsForDay(competitionId, date);
  if (rows.length === 0) return null;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(date);

  sheet.columns = [
    { header: "Prueba", key: "prueba", width: 28 },
    { header: "Categoría", key: "categoria", width: 18 },
    { header: "Orden Sorteo", key: "orden", width: 14 },
    { header: "Jinete", key: "jinete", width: 26 },
    { header: "Caballo", key: "caballo", width: 22 },
    { header: "Licencia", key: "licencia", width: 14 },
    { header: "Box", key: "box", width: 8 },
    { header: "Email", key: "email", width: 30 },
    { header: "Monto", key: "monto", width: 12 },
    { header: "ID Pago MP", key: "mpPago", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow({
      prueba: row.eventName,
      categoria: row.category,
      orden: row.drawOrder ?? "",
      jinete: row.participantName,
      caballo: row.horseName,
      licencia: row.licenseNumber ?? "",
      box: row.boxRequested ? "Sí" : "No",
      email: row.participantEmail,
      monto: row.totalArs / 100,
      mpPago: row.mpPaymentId ?? "",
    });
  }
  sheet.getColumn("monto").numFmt = "#,##0.00";

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return { buffer, rowCount: rows.length };
}
