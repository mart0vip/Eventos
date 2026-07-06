import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth/admin-secret";
import { addEventSchema } from "@/lib/validation/admin";
import { addEventToDay } from "@/lib/db/queries/events";

/** POST /api/admin/days/[dayId]/events — adds a prueba to a day. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dayId: string }> }
) {
  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  const { dayId } = await params;

  const json = await request.json().catch(() => null);
  if (json === null) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = addEventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const prueba = await addEventToDay(dayId, parsed.data);
  return NextResponse.json(prueba, { status: 201 });
}
