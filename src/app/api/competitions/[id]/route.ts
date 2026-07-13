import { NextResponse } from "next/server";
import { getCompetitionById } from "@/lib/db/queries/competitions";

/** GET /api/competitions/[id] — full anteprograma: days → pruebas with current slots. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const competition = await getCompetitionById(id);
  if (!competition) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(competition);
}
