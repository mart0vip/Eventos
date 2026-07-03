import { NextResponse } from "next/server";
import { getRegistrationById } from "@/lib/db/queries/registrations";
import { getEventCheckoutContext } from "@/lib/db/queries/events";
import { getBinomioById } from "@/lib/db/queries/binomios";

/**
 * GET /api/registrations/[id] — current status of a registration, polled by the
 * frontend on the post-payment "gracias" page while waiting for the Mercado
 * Pago webhook to confirm it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const registration = await getRegistrationById(id);
  if (!registration) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [context, binomio] = await Promise.all([
    getEventCheckoutContext(registration.eventId),
    getBinomioById(registration.binomioId),
  ]);

  return NextResponse.json({
    status: registration.status,
    eventName: context?.eventName ?? null,
    competitionTitle: context?.competitionTitle ?? null,
    participantName: binomio?.participantName ?? null,
    horseName: binomio?.horseName ?? null,
    confirmedAt: registration.confirmedAt,
  });
}
