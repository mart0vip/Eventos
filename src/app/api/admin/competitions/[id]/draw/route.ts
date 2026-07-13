import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth/admin-secret";
import { getCompetitionById } from "@/lib/db/queries/competitions";
import {
  ConfirmedRegistrationRow,
  bulkSetDrawOrder,
  listConfirmedRegistrationsForCompetition,
} from "@/lib/db/queries/registrations";
import { markDrawDone } from "@/lib/db/queries/events";

/**
 * POST /api/admin/competitions/[id]/draw
 *
 * Runs the sorteo for every prueba in a competition that hasn't been drawn yet:
 * shuffles each prueba's confirmed registrations (Fisher-Yates) and assigns
 * draw_order 1..n. Only runnable once the competition is `closed` (constraint
 * #8). Already-drawn pruebas (`draw_done = true`) are skipped, so calling this
 * again after adding a new prueba only draws the new one.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  const competition = await getCompetitionById(id);
  if (!competition) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (competition.status !== "closed") {
    return NextResponse.json({ error: "competition_not_closed" }, { status: 400 });
  }

  const eligibleEventIds = new Set(
    competition.days.flatMap((day) => day.pruebas.filter((p) => !p.drawDone).map((p) => p.id))
  );

  const confirmed = await listConfirmedRegistrationsForCompetition(id);
  const byEvent = new Map<string, ConfirmedRegistrationRow[]>();
  for (const row of confirmed) {
    if (!eligibleEventIds.has(row.eventId)) continue;
    const list = byEvent.get(row.eventId) ?? [];
    list.push(row);
    byEvent.set(row.eventId, list);
  }

  const allAssignments: { registrationId: string; drawOrder: number }[] = [];
  const results: {
    eventId: string;
    eventName: string;
    order: { binomioName: string; horseName: string; drawOrder: number }[];
  }[] = [];

  for (const [eventId, rows] of byEvent) {
    const shuffled = fisherYatesShuffle(rows);
    const order = shuffled.map((row, index) => ({
      binomioName: row.participantName,
      horseName: row.horseName,
      drawOrder: index + 1,
    }));
    shuffled.forEach((row, index) => {
      allAssignments.push({ registrationId: row.registrationId, drawOrder: index + 1 });
    });
    results.push({ eventId, eventName: rows[0].eventName, order });
    await markDrawDone(eventId);
  }

  await bulkSetDrawOrder(allAssignments);

  return NextResponse.json({ results });
}

function fisherYatesShuffle<T>(input: T[]): T[] {
  const array = [...input];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
