import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth/admin-secret";
import { listConfirmedRegistrationsForCompetition } from "@/lib/db/queries/registrations";

/**
 * GET /api/admin/competitions/[id]/registrations — full list of confirmed
 * inscriptos for a competition, used by the admin "Inscriptos" tab and the
 * CSV export.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const rows = await listConfirmedRegistrationsForCompetition(id);

  return NextResponse.json(
    rows.map((row) => ({
      // binomioId isn't in the spec's literal response shape for this route,
      // but is needed by the admin Deuda tab to look up a specific binomio's
      // debt (GET /api/competitions/[id]/debt/[binomioId]) without a separate
      // "list binomios" endpoint — additive, doesn't remove any spec'd field.
      binomioId: row.binomioId,
      eventName: row.eventName,
      dayLabel: row.dayLabel,
      participantName: row.participantName,
      participantEmail: row.participantEmail,
      horseName: row.horseName,
      licenseNumber: row.licenseNumber,
      boxRequested: row.boxRequested,
      drawOrder: row.drawOrder,
      confirmedAt: row.confirmedAt,
    }))
  );
}
