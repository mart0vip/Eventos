import { NextResponse } from "next/server";
import { listOpenCompetitions } from "@/lib/db/queries/competitions";

/** GET /api/competitions — public listing of every `open` competition, soonest first. */
export async function GET() {
  const competitions = await listOpenCompetitions();
  return NextResponse.json(competitions);
}
