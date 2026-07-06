import { NextRequest, NextResponse } from "next/server";
import { getPayment, parseExternalReference, verifyWebhookSignature } from "@/lib/mercadopago";
import {
  cancelRegistrationAndReleaseSlot,
  confirmRegistration,
  getRegistrationById,
} from "@/lib/db/queries/registrations";
import { getEventCheckoutContext } from "@/lib/db/queries/events";
import { getBinomioById } from "@/lib/db/queries/binomios";
import { getNextWaitlisted, markNotified } from "@/lib/db/queries/waitlist";
import { getDebtWithMember, markDebtPaid } from "@/lib/db/queries/members";
import { insertPaymentEvent } from "@/lib/db/queries/paymentEvents";
import { sendConfirmationEmail, sendMemberDebtReceiptEmail } from "@/lib/email";
import { debtConceptLabel } from "@/lib/debtConcepts";

/**
 * POST /api/webhooks/mercadopago
 *
 * The single source of truth for confirming a registration — the frontend
 * never marks anything confirmed itself. Always responds 200 once the
 * signature has been checked, since Mercado Pago retries on any non-2xx
 * response; failures past that point are logged server-side rather than
 * surfaced via the HTTP status, per the source spec.
 */
export async function POST(request: NextRequest) {
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const dataIdFromQuery = request.nextUrl.searchParams.get("data.id");
  const typeFromQuery =
    request.nextUrl.searchParams.get("type") ?? request.nextUrl.searchParams.get("topic");

  const body = await request.json().catch(() => null);
  const dataId: string | undefined = body?.data?.id ?? dataIdFromQuery ?? undefined;
  const type: string | undefined = body?.type ?? typeFromQuery ?? undefined;

  const verification = verifyWebhookSignature({
    xSignature,
    xRequestId,
    dataId: dataId ?? null,
  });

  if (!verification.valid) {
    console.error("Mercado Pago webhook signature rejected", {
      reason: verification.reason,
      xRequestId,
    });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (type !== "payment" || !dataId) {
    // Not a payment notification (e.g. merchant_order) — acknowledge, ignore.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const payment = await getPayment(dataId);
    const externalReference = payment.external_reference;

    if (!externalReference) {
      console.error("Mercado Pago payment has no external_reference", { dataId });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const parsed = parseExternalReference(externalReference);

    if (parsed.kind === "member_debt") {
      await processMemberDebtPayment(parsed.debtId, payment);
    } else if (payment.status === "approved") {
      await confirmRegistration(parsed.registrationId, String(payment.id));
      await insertPaymentEvent({
        source: "registration",
        sourceId: parsed.registrationId,
        amountArs: Math.round((payment.transaction_amount ?? 0) * 100),
        mpPaymentId: String(payment.id),
      });
      await sendConfirmationReceipt(parsed.registrationId, payment);
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      const released = await cancelRegistrationAndReleaseSlot(parsed.registrationId);
      if (released) {
        await notifyNextWaitlisted(parsed.registrationId);
      }
    }
  } catch (err) {
    console.error("Error processing Mercado Pago webhook", err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * Fase 2 branch of the webhook: marks the socio's debt paid, records the
 * payment in the Fase 4 ledger, and emails the receipt. A rejected/cancelled
 * payment needs no action — unlike registrations there's no held slot to
 * release; the debt simply stays pending and the socio can retry. The
 * `markDebtPaid` guard makes webhook retries idempotent (email + ledger only
 * run on the first approved notification).
 */
async function processMemberDebtPayment(
  debtId: string,
  payment: { id?: number | string; status?: string; transaction_amount?: number }
): Promise<void> {
  if (payment.status !== "approved") return;

  const firstConfirmation = await markDebtPaid(debtId, String(payment.id));
  if (!firstConfirmation) return;

  await insertPaymentEvent({
    source: "member_debt",
    sourceId: debtId,
    amountArs: Math.round((payment.transaction_amount ?? 0) * 100),
    mpPaymentId: String(payment.id),
  });

  const found = await getDebtWithMember(debtId);
  if (!found) return;

  await sendMemberDebtReceiptEmail({
    to: found.member.email,
    memberName: found.member.name,
    memberNumber: found.member.memberNumber,
    conceptLabel: debtConceptLabel(found.debt.concept),
    dueDate: found.debt.dueDate,
    amountPaidArs: Math.round((payment.transaction_amount ?? 0) * 100),
    mpPaymentId: String(payment.id ?? ""),
  });
}

async function sendConfirmationReceipt(
  registrationId: string,
  payment: { id?: number | string; transaction_amount?: number }
): Promise<void> {
  const registration = await getRegistrationById(registrationId);
  if (!registration) return;

  const [context, binomio] = await Promise.all([
    getEventCheckoutContext(registration.eventId),
    getBinomioById(registration.binomioId),
  ]);
  if (!context || !binomio) return;

  await sendConfirmationEmail({
    to: binomio.participantEmail,
    participantName: binomio.participantName,
    horseName: binomio.horseName,
    competitionTitle: context.competitionTitle,
    competitionDate: context.competitionDateFrom,
    eventName: context.eventName,
    drawOrder: registration.drawOrder,
    boxRequested: registration.boxRequested,
    amountPaidArs: Math.round((payment.transaction_amount ?? 0) * 100),
    mpPaymentId: String(payment.id ?? ""),
  });
}

/**
 * Fase 1 has no dedicated waitlist-notification email template (only the
 * confirmation receipt is specified) — marking `notified_at` is the documented
 * behavior for now; wiring an actual notification email is left for a future
 * phase once that copy is specified.
 */
async function notifyNextWaitlisted(cancelledRegistrationId: string): Promise<void> {
  const registration = await getRegistrationById(cancelledRegistrationId);
  if (!registration) return;
  const next = await getNextWaitlisted(registration.eventId);
  if (!next) return;
  await markNotified(next.id);
}
