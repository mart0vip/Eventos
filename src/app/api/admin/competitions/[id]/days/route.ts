import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth/admin-secret";
import { addDaySchema } from "@/lib/validation/admin";
import { addDayToCompetition } from "@/lib/db/queries/competitions";

/** POST /api/admin/competitions/[id]/days — adds a day to an existing anteprograma. */
export async function POST(
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

  const parsed = addDaySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const day = await addDayToCompetition(id, parsed.data);
  return NextResponse.json(day, { status: 201 });
}
