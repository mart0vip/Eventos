import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth/admin-secret";
import { createCompetitionSchema } from "@/lib/validation/admin";
import {
  createCompetitionWithDaysAndEvents,
  listAllCompetitions,
} from "@/lib/db/queries/competitions";

/**
 * GET /api/admin/competitions — lists every competition regardless of status,
 * for the admin "Anteprograma" tab (which needs to manage drafts too).
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  const competitions = await listAllCompetitions();
  return NextResponse.json(competitions);
}

/**
 * POST /api/admin/competitions — creates a competition together with its full
 * anteprograma (days and pruebas nested in one request), in a single
 * transaction.
 */
export async function POST(request: NextRequest) {
  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  const json = await request.json().catch(() => null);
  if (json === null) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createCompetitionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const competition = await createCompetitionWithDaysAndEvents(parsed.data);
  return NextResponse.json(competition, { status: 201 });
}
