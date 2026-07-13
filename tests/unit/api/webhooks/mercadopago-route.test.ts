import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/mercadopago", () => ({
  getPayment: vi.fn(),
  parseExternalReference: vi.fn(),
  verifyWebhookSignature: vi.fn(),
}));
vi.mock("@/lib/db/queries/registrations", () => ({
  cancelRegistrationAndReleaseSlot: vi.fn(),
  confirmRegistration: vi.fn(),
  getRegistrationById: vi.fn(),
}));
vi.mock("@/lib/db/queries/events", () => ({
  getEventCheckoutContext: vi.fn(),
}));
vi.mock("@/lib/db/queries/binomios", () => ({
  getBinomioById: vi.fn(),
}));
vi.mock("@/lib/db/queries/waitlist", () => ({
  getNextWaitlisted: vi.fn(),
  markNotified: vi.fn(),
}));
vi.mock("@/lib/db/queries/members", () => ({
  getDebtWithMember: vi.fn(),
  markDebtPaid: vi.fn(),
}));
vi.mock("@/lib/db/queries/paymentEvents", () => ({
  insertPaymentEvent: vi.fn(),
}));
vi.mock("@/lib/email", () => ({
  sendConfirmationEmail: vi.fn(),
  sendMemberDebtReceiptEmail: vi.fn(),
}));

import { POST } from "@/app/api/webhooks/mercadopago/route";
import {
  getPayment,
  parseExternalReference,
  verifyWebhookSignature,
} from "@/lib/mercadopago";
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

function buildRequest(params: {
  body?: unknown;
  xSignature?: string | null;
  xRequestId?: string | null;
}): NextRequest {
  const headers = new Headers();
  if (params.xSignature !== null) headers.set("x-signature", params.xSignature ?? "ts=1,v1=abc");
  if (params.xRequestId !== null) headers.set("x-request-id", params.xRequestId ?? "req-1");
  return new NextRequest("http://localhost:3000/api/webhooks/mercadopago", {
    method: "POST",
    headers,
    body: JSON.stringify(params.body ?? { type: "payment", data: { id: "mp-1" } }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(verifyWebhookSignature).mockReturnValue({ valid: true });
});

describe("POST /api/webhooks/mercadopago — signature verification", () => {
  it("returns 200 without touching the DB when the signature is invalid", async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue({
      valid: false,
      reason: "SignatureMismatch",
    });

    const response = await POST(buildRequest({}));

    expect(response.status).toBe(200);
    expect(getPayment).not.toHaveBeenCalled();
  });

  it("returns 200 and ignores non-payment notification types", async () => {
    const response = await POST(
      buildRequest({ body: { type: "merchant_order", data: { id: "mp-1" } } })
    );

    expect(response.status).toBe(200);
    expect(getPayment).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/mercadopago — registration branch", () => {
  it("confirms the registration, records the payment event, and sends the receipt on approved", async () => {
    vi.mocked(parseExternalReference).mockReturnValue({
      kind: "registration",
      registrationId: "reg-1",
    });
    vi.mocked(getPayment).mockResolvedValue({
      id: 999,
      status: "approved",
      external_reference: "reg-1",
      transaction_amount: 10000,
    } as never);
    vi.mocked(getRegistrationById).mockResolvedValue({
      id: "reg-1",
      eventId: "event-1",
      binomioId: "binomio-1",
      boxRequested: false,
      drawOrder: null,
      status: "confirmed",
      holdExpiresAt: null,
      mpPreferenceId: null,
      mpPaymentId: "999",
      createdAt: "2026-01-01T00:00:00.000Z",
      confirmedAt: "2026-01-01T00:00:00.000Z",
    });
    vi.mocked(getEventCheckoutContext).mockResolvedValue({
      eventId: "event-1",
      eventName: "Prueba 1",
      priceArs: 10000,
      competitionTitle: "Concurso Test",
      competitionDateFrom: "2026-09-05",
      boxPriceArs: 0,
    });
    vi.mocked(getBinomioById).mockResolvedValue({
      id: "binomio-1",
      participantName: "Juan Pérez",
      participantEmail: "juan@test.local",
      horseName: "Relámpago",
      licenseNumber: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const response = await POST(buildRequest({}));

    expect(response.status).toBe(200);
    expect(confirmRegistration).toHaveBeenCalledWith("reg-1", "999");
    expect(insertPaymentEvent).toHaveBeenCalledWith({
      source: "registration",
      sourceId: "reg-1",
      amountArs: 1000000,
      mpPaymentId: "999",
    });
    expect(sendConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "juan@test.local", horseName: "Relámpago" })
    );
  });

  it("releases the slot and notifies the next waitlisted binomio on rejected", async () => {
    vi.mocked(parseExternalReference).mockReturnValue({
      kind: "registration",
      registrationId: "reg-1",
    });
    vi.mocked(getPayment).mockResolvedValue({
      id: 999,
      status: "rejected",
      external_reference: "reg-1",
    } as never);
    vi.mocked(cancelRegistrationAndReleaseSlot).mockResolvedValue(true);
    vi.mocked(getRegistrationById).mockResolvedValue({
      id: "reg-1",
      eventId: "event-1",
      binomioId: "binomio-1",
      boxRequested: false,
      drawOrder: null,
      status: "cancelled",
      holdExpiresAt: null,
      mpPreferenceId: null,
      mpPaymentId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      confirmedAt: null,
    });
    vi.mocked(getNextWaitlisted).mockResolvedValue({
      id: "waitlist-1",
      eventId: "event-1",
      binomioId: "binomio-2",
      createdAt: "2026-01-01T00:00:00.000Z",
      notifiedAt: null,
    });

    const response = await POST(buildRequest({}));

    expect(response.status).toBe(200);
    expect(cancelRegistrationAndReleaseSlot).toHaveBeenCalledWith("reg-1");
    expect(markNotified).toHaveBeenCalledWith("waitlist-1");
  });

  it("does not notify the waitlist when the release was a no-op (already cancelled)", async () => {
    vi.mocked(parseExternalReference).mockReturnValue({
      kind: "registration",
      registrationId: "reg-1",
    });
    vi.mocked(getPayment).mockResolvedValue({
      id: 999,
      status: "cancelled",
      external_reference: "reg-1",
    } as never);
    vi.mocked(cancelRegistrationAndReleaseSlot).mockResolvedValue(false);

    const response = await POST(buildRequest({}));

    expect(response.status).toBe(200);
    expect(getNextWaitlisted).not.toHaveBeenCalled();
    expect(markNotified).not.toHaveBeenCalled();
  });

  it("still returns 200 when an internal error is thrown while processing", async () => {
    vi.mocked(parseExternalReference).mockReturnValue({
      kind: "registration",
      registrationId: "reg-1",
    });
    vi.mocked(getPayment).mockRejectedValue(new Error("Mercado Pago API is down"));

    const response = await POST(buildRequest({}));

    expect(response.status).toBe(200);
  });
});

describe("POST /api/webhooks/mercadopago — member_debt branch", () => {
  it("marks the debt paid, records the payment event, and sends the receipt on approved", async () => {
    vi.mocked(parseExternalReference).mockReturnValue({
      kind: "member_debt",
      debtId: "debt-1",
    });
    vi.mocked(getPayment).mockResolvedValue({
      id: 888,
      status: "approved",
      external_reference: "member_debt:debt-1",
      transaction_amount: 5000,
    } as never);
    vi.mocked(markDebtPaid).mockResolvedValue(true);
    vi.mocked(getDebtWithMember).mockResolvedValue({
      debt: {
        id: "debt-1",
        memberId: "member-1",
        concept: "cuota",
        amountArs: 500000,
        dueDate: "2026-02-01",
        paidAt: "2026-01-15T00:00:00.000Z",
        mpPreferenceId: null,
        mpPaymentId: "888",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      member: {
        id: "member-1",
        name: "María Gómez",
        email: "maria@test.local",
        memberNumber: "SOC-001",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    const response = await POST(buildRequest({}));

    expect(response.status).toBe(200);
    expect(markDebtPaid).toHaveBeenCalledWith("debt-1", "888");
    expect(insertPaymentEvent).toHaveBeenCalledWith({
      source: "member_debt",
      sourceId: "debt-1",
      amountArs: 500000,
      mpPaymentId: "888",
    });
    expect(sendMemberDebtReceiptEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "maria@test.local", memberNumber: "SOC-001" })
    );
  });

  it("is idempotent — a retried webhook for an already-paid debt sends no duplicate email or ledger entry", async () => {
    vi.mocked(parseExternalReference).mockReturnValue({
      kind: "member_debt",
      debtId: "debt-1",
    });
    vi.mocked(getPayment).mockResolvedValue({
      id: 888,
      status: "approved",
      external_reference: "member_debt:debt-1",
      transaction_amount: 5000,
    } as never);
    vi.mocked(markDebtPaid).mockResolvedValue(false); // already paid — guard returned false

    const response = await POST(buildRequest({}));

    expect(response.status).toBe(200);
    expect(insertPaymentEvent).not.toHaveBeenCalled();
    expect(sendMemberDebtReceiptEmail).not.toHaveBeenCalled();
  });

  it("takes no action on a rejected member-debt payment (no slot to release)", async () => {
    vi.mocked(parseExternalReference).mockReturnValue({
      kind: "member_debt",
      debtId: "debt-1",
    });
    vi.mocked(getPayment).mockResolvedValue({
      id: 888,
      status: "rejected",
      external_reference: "member_debt:debt-1",
    } as never);

    const response = await POST(buildRequest({}));

    expect(response.status).toBe(200);
    expect(markDebtPaid).not.toHaveBeenCalled();
  });
});
