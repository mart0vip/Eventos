import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  Payment,
  Preference,
  WebhookSignatureValidator,
} from "mercadopago";

function getConfig(): MercadoPagoConfig {
  return new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
}

/**
 * Creates a Mercado Pago Checkout Pro preference for a registration (prueba fee
 * plus an optional box-reservation line item) and returns the checkout URL the
 * frontend redirects the rider to. The commission is paid by the rider
 * (`marketplace_fee: 0`) per the club's requirement — do not change this.
 */
export async function createCheckoutPreference(params: {
  registrationId: string;
  eventName: string;
  competitionTitle: string;
  participantEmail: string;
  priceArs: number; // centavos
  boxPriceArs: number; // centavos, 0 si no reservó box
  horseName: string;
  participantName: string;
}): Promise<{ preferenceId: string; checkoutUrl: string }> {
  const preference = new Preference(getConfig());

  const items = [
    {
      id: params.registrationId,
      title: `${params.competitionTitle} — ${params.eventName}`,
      description: `Binomio: ${params.participantName} / ${params.horseName}`,
      quantity: 1,
      unit_price: params.priceArs / 100,
      currency_id: "ARS" as const,
    },
  ];

  if (params.boxPriceArs > 0) {
    items.push({
      id: `${params.registrationId}-box`,
      title: "Reserva de box",
      description: `Box para ${params.horseName}`,
      quantity: 1,
      unit_price: params.boxPriceArs / 100,
      currency_id: "ARS" as const,
    });
  }

  const result = await preference.create({
    body: {
      items,
      payer: {
        name: params.participantName,
        email: params.participantEmail,
      },
      external_reference: params.registrationId,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/inscripcion/gracias?id=${params.registrationId}`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/inscripcion/error?id=${params.registrationId}`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/inscripcion/pendiente?id=${params.registrationId}`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
      statement_descriptor: "CLUB HIPICO",
      // La comisión la paga el jinete — el club recibe el monto neto de MP.
      marketplace_fee: 0,
      expires: true,
      expiration_date_to: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  });

  if (!result.id || !result.init_point) {
    throw new Error("Mercado Pago no devolvió id/init_point para la preferencia creada");
  }

  return { preferenceId: result.id, checkoutUrl: result.init_point };
}

/** Fetches a payment's current status/details from Mercado Pago by id. */
export async function getPayment(paymentId: string) {
  const payment = new Payment(getConfig());
  return payment.get({ id: paymentId });
}

export type WebhookVerificationResult = { valid: true } | { valid: false; reason: string };

/**
 * Verifies that an incoming webhook request actually originated from Mercado
 * Pago, using the SDK's own `WebhookSignatureValidator` (HMAC-SHA256 over the
 * `id:{data.id};request-id:{x-request-id};ts:{ts};` manifest, constant-time
 * comparison) rather than a hand-rolled implementation. A 300-second tolerance
 * window is applied against the header's timestamp to mitigate replay attacks,
 * per Mercado Pago's own recommendation.
 */
export function verifyWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): WebhookVerificationResult {
  try {
    WebhookSignatureValidator.validate({
      xSignature: params.xSignature,
      xRequestId: params.xRequestId,
      dataId: params.dataId,
      secret: process.env.MP_WEBHOOK_SECRET!,
      toleranceSeconds: 300,
    });
    return { valid: true };
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      return { valid: false, reason: err.reason };
    }
    throw err;
  }
}
