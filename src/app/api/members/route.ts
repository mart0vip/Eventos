import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth/admin-secret";
import { createMemberSchema } from "@/lib/validation/members";
import { createMember, listMembersWithPendingTotal } from "@/lib/db/queries/members";

/**
 * GET /api/members
 *
 * Lists every socio with their pending-debt total. Admin-gated even though the
 * path sits outside /api/admin (it was scaffolded here in Fase 1): the list
 * exposes names and emails of all members, so it must not be public.
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  return NextResponse.json(await listMembersWithPendingTotal());
}

/**
 * POST /api/members
 *
 * Alta de socio (admin). Returns 409 when the email or member number is
 * already taken.
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  const json = await request.json().catch(() => null);
  if (json === null) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createMemberSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const result = await createMember(parsed.data);
  if ("error" in result) {
    return NextResponse.json({ error: "member_exists" }, { status: 409 });
  }
  return NextResponse.json(result.member, { status: 201 });
}
