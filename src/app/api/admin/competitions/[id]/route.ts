import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth/admin-secret";
import { updateCompetitionStatusSchema } from "@/lib/validation/admin";
import { getCompetitionById, updateCompetitionStatus } from "@/lib/db/queries/competitions";
import { CompetitionStatus } from "@/types/competition";

/**
 * Legal status transitions. draft→open→closed→cancelled is meant to be a
 * one-way gate (the sorteo can only run once a competition is `closed`, per
 * spec constraint #8) — not spelled out explicitly in the source spec, but
 * implied by that gate, so backward/illegal jumps are rejected here.
 */
const LEGAL_TRANSITIONS: Record<CompetitionStatus, CompetitionStatus[]> = {
  draft: ["open", "cancelled"],
  open: ["closed", "cancelled"],
  closed: ["cancelled"],
  cancelled: [],
};

/** PATCH /api/admin/competitions/[id] — transitions a competition's status. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const json = await request.json().catch(() => null);
  if (json === null) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateCompetitionStatusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const competition = await getCompetitionById(id);
  if (!competition) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const nextStatus = parsed.data.status;
  if (!LEGAL_TRANSITIONS[competition.status].includes(nextStatus)) {
    return NextResponse.json(
      { error: "illegal_transition", from: competition.status, to: nextStatus },
      { status: 400 }
    );
  }

  const updated = await updateCompetitionStatus(id, nextStatus);
  return NextResponse.json(updated);
}
