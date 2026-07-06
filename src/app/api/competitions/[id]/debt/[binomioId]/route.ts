import { NextResponse } from "next/server";
import { getDebtForBinomio } from "@/lib/db/queries/registrations";

/**
 * GET /api/competitions/[id]/debt/[binomioId]
 *
 * Deliberately public (no `x-admin-secret`) — this is listed outside the
 * "rutas de administración" section of the source spec, read here as an
 * intentional rider-facing debt lookup (Fase 1 has no rider auth system to
 * gate it behind). The binomio id is a non-enumerable UUID, so this is an
 * accepted "security through obscurity of the URL" posture for Fase 1, not an
 * oversight — see docs/fase1-setup.md.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; binomioId: string }> }
) {
  const { id, binomioId } = await params;
  const debt = await getDebtForBinomio(id, binomioId);
  if (!debt) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(debt);
}
