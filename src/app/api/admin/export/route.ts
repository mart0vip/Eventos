import { NextResponse } from "next/server";

// FASE 3: Export CSV/XLSX al sistema legacy — scaffolded, not implemented in Fase 1.
// The admin panel's "Exportar" tab reuses the existing src/lib/csv.ts utility
// client-side in the meantime; this route is reserved for the daily
// legacy-format XLSX export (see src/lib/export.ts).
export async function GET() {
  return NextResponse.json({ error: "not_implemented", phase: "FASE 3" }, { status: 501 });
}
