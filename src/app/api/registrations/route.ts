import { NextRequest, NextResponse } from "next/server";
import { createRegistrationSchema } from "@/lib/validation/registration";
import { findOrCreateBinomio } from "@/lib/db/queries/binomios";
import {
  createRegistrationWithHold,
  setRegistrationPreferenceId,
} from "@/lib/db/queries/registrations";
import { getEventCheckoutContext } from "@/lib/db/queries/events";
import { addToWaitlist } from "@/lib/db/queries/waitlist";
import { createCheckoutPreference } from "@/lib/mercadopago";

/**
 * POST /api/registrations
 *
 * Public registration flow: validates the body, resolves (or creates) the
 * binomio, attempts to hold a slot transactionally, and — if a slot was held —
 * creates a Mercado Pago Checkout Pro preference and returns its URL. The
 * frontend never marks a registration confirmed itself; that only happens via
 * the Mercado Pago webhook.
 *
 * Fase 1 treats the waitlist as always enabled: the source spec references a
 * `waitlist_enabled` toggle for the "no slots" branch, but no such column
 * exists anywhere in the schema, so a full prueba always falls through to the
 * waitlist rather than returning a hard 409.
 */
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  if (json === null) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createRegistrationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const body = parsed.data;

  const binomio = await findOrCreateBinomio({
    participantName: body.participantName,
    participantEmail: body.participantEmail,
    horseName: body.horseName,
    licenseNumber: body.licenseNumber,
  });

  const holdResult = await createRegistrationWithHold({
    eventId: body.eventId,
    binomioId: binomio.id,
    boxRequested: body.boxRequested,
  });

  if ("error" in holdResult) {
    if (holdResult.error === "not_found") {
      return NextResponse.json({ error: "event_not_found" }, { status: 404 });
    }
    if (holdResult.error === "duplicate") {
      return NextResponse.json({ error: "already_registered" }, { status: 409 });
    }
    const waitlistEntry = await addToWaitlist(body.eventId, binomio.id);
    return NextResponse.json(
      { status: "waitlisted", waitlistId: waitlistEntry.id },
      { status: 200 }
    );
  }

  const context = await getEventCheckoutContext(body.eventId);
  if (!context) {
    return NextResponse.json({ error: "event_not_found" }, { status: 404 });
  }

  const boxPriceArs = body.boxRequested ? context.boxPriceArs : 0;

  try {
    const preference = await createCheckoutPreference({
      registrationId: holdResult.registrationId,
      eventName: context.eventName,
      competitionTitle: context.competitionTitle,
      participantEmail: body.participantEmail,
      priceArs: context.priceArs,
      boxPriceArs,
      horseName: body.horseName,
      participantName: body.participantName,
    });
    await setRegistrationPreferenceId(holdResult.registrationId, preference.preferenceId);

    return NextResponse.json(
      {
        registrationId: holdResult.registrationId,
        checkoutUrl: preference.checkoutUrl,
        holdsUntil: holdResult.holdExpiresAt,
      },
      { status: 201 }
    );
  } catch (err) {
    // Expected in local/dev environments without real Mercado Pago credentials —
    // the slot is still held (and will auto-release via the cron if unpaid), so
    // this is a partial-success response, not a hard failure of the hold itself.
    console.error("Mercado Pago preference creation failed", err);
    return NextResponse.json(
      {
        error: "payment_provider_error",
        registrationId: holdResult.registrationId,
        holdsUntil: holdResult.holdExpiresAt,
      },
      { status: 502 }
    );
  }
}
