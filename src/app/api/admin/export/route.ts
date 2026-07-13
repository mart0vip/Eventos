import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSecret } from "@/lib/auth/admin-secret";
import { generateDailyExport } from "@/lib/export";
import { insertExportLog } from "@/lib/db/queries/exportLogs";

const exportParamsSchema = z.object({
  competitionId: z.uuid(),
  date: z.iso.date(),
});

/**
 * GET /api/admin/export?competitionId=...&date=YYYY-MM-DD
 *
 * Fase 3: generates the daily legacy-format XLSX (see src/lib/export.ts) and
 * streams it as a download, logging the generation in `export_logs`. Returns
 * 404 `no_rows` when the day has no confirmed registrations.
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  const parsed = exportParamsSchema.safeParse({
    competitionId: request.nextUrl.searchParams.get("competitionId"),
    date: request.nextUrl.searchParams.get("date"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_params", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { competitionId, date } = parsed.data;

  const result = await generateDailyExport(competitionId, date);
  if (!result) {
    return NextResponse.json({ error: "no_rows" }, { status: 404 });
  }

  const fileName = `planilla-${date}.xlsx`;
  await insertExportLog({
    exportDate: date,
    fileName,
    rowCount: result.rowCount,
    exportedBy: "manual",
  });

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
