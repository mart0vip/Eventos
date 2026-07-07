import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth/admin-secret";
import { createDebtsSchema } from "@/lib/validation/members";
import { createMemberDebts, getMemberWithDebts } from "@/lib/db/queries/members";

/**
 * GET /api/members/[id]/debts
 *
 * Deliberately public — this feeds the socio's permanent portal link
 * `/socios/[id]`. Fase 2 keeps the same access posture as Fase 1's debt
 * lookup: no member auth system exists, and the member id is a non-enumerable
 * UUID, so the URL itself is the credential (documented in docs/fase2-4-setup.md).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const member = await getMemberWithDebts(id);
  if (!member) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(member);
}

/**
 * POST /api/members/[id]/debts
 *
 * Carga de deudas del socio (admin). Accepts `{ debts: [...] }` with one or
 * many records so a whole period can be loaded in a single transactional
 * request.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const member = await getMemberWithDebts(id);
  if (!member) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  if (json === null) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createDebtsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const created = await createMemberDebts(id, parsed.data.debts);
  return NextResponse.json({ debts: created }, { status: 201 });
}
