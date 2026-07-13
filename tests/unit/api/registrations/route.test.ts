import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/binomios", () => ({ findOrCreateBinomio: vi.fn() }));
vi.mock("@/lib/db/queries/registrations", () => ({
  createRegistrationWithHold: vi.fn(),
  setRegistrationPreferenceId: vi.fn(),
}));
vi.mock("@/lib/db/queries/events", () => ({ getEventCheckoutContext: vi.fn() }));
vi.mock("@/lib/db/queries/waitlist", () => ({ addToWaitlist: vi.fn() }));
vi.mock("@/lib/mercadopago", () => ({ createCheckoutPreference: vi.fn() }));

import { POST } from "@/app/api/registrations/route";
import { findOrCreateBinomio } from "@/lib/db/queries/binomios";
import {
  createRegistrationWithHold,
  setRegistrationPreferenceId,
} from "@/lib/db/queries/registrations";
import { getEventCheckoutContext } from "@/lib/db/queries/events";
import { addToWaitlist } from "@/lib/db/queries/waitlist";
import { createCheckoutPreference } from "@/lib/mercadopago";

const validBody = {
  eventId: "123e4567-e89b-12d3-a456-426614174000",
  participantName: "Juan Pérez",
  participantEmail: "juan@test.local",
  horseName: "Relámpago",
  boxRequested: true,
};

function buildRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/registrations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findOrCreateBinomio).mockResolvedValue({
    id: "binomio-1",
    participantName: "Juan Pérez",
    participantEmail: "juan@test.local",
    horseName: "Relámpago",
    licenseNumber: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  });
});

describe("POST /api/registrations", () => {
  it("returns 400 invalid_json for unparseable JSON", async () => {
    const request = new NextRequest("http://localhost:3000/api/registrations", {
      method: "POST",
      body: "{not json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_json");
  });

  it("returns 400 invalid_body for a body that fails schema validation", async () => {
    const response = await POST(buildRequest({ ...validBody, participantEmail: "not-an-email" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_body");
  });

  it("returns 404 event_not_found when the prueba doesn't exist", async () => {
    vi.mocked(createRegistrationWithHold).mockResolvedValue({ error: "not_found" });
    const response = await POST(buildRequest(validBody));
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("event_not_found");
  });

  it("returns 409 already_registered on a duplicate registration", async () => {
    vi.mocked(createRegistrationWithHold).mockResolvedValue({ error: "duplicate" });
    const response = await POST(buildRequest(validBody));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("already_registered");
  });

  it("returns 200 waitlisted and adds the binomio to the waitlist when the prueba is full", async () => {
    vi.mocked(createRegistrationWithHold).mockResolvedValue({ error: "no_slots" });
    vi.mocked(addToWaitlist).mockResolvedValue({
      id: "waitlist-1",
      eventId: validBody.eventId,
      binomioId: "binomio-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      notifiedAt: null,
    });

    const response = await POST(buildRequest(validBody));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("waitlisted");
    expect(json.waitlistId).toBe("waitlist-1");
  });

  it("returns 201 with the checkout URL on a successful hold", async () => {
    vi.mocked(createRegistrationWithHold).mockResolvedValue({
      registrationId: "reg-1",
      holdExpiresAt: "2026-01-01T00:15:00.000Z",
    });
    vi.mocked(getEventCheckoutContext).mockResolvedValue({
      eventId: validBody.eventId,
      eventName: "Prueba 1",
      priceArs: 1000000,
      competitionTitle: "Concurso Test",
      competitionDateFrom: "2026-09-05",
      boxPriceArs: 500000,
    });
    vi.mocked(createCheckoutPreference).mockResolvedValue({
      preferenceId: "pref-1",
      checkoutUrl: "https://mercadopago.test/checkout/pref-1",
    });

    const response = await POST(buildRequest(validBody));
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.registrationId).toBe("reg-1");
    expect(json.checkoutUrl).toBe("https://mercadopago.test/checkout/pref-1");
    expect(setRegistrationPreferenceId).toHaveBeenCalledWith("reg-1", "pref-1");
  });

  it("returns 404 event_not_found when checkout context lookup fails after a successful hold", async () => {
    vi.mocked(createRegistrationWithHold).mockResolvedValue({
      registrationId: "reg-1",
      holdExpiresAt: "2026-01-01T00:15:00.000Z",
    });
    vi.mocked(getEventCheckoutContext).mockResolvedValue(null);

    const response = await POST(buildRequest(validBody));
    expect(response.status).toBe(404);
  });

  it("returns 502 payment_provider_error when Mercado Pago preference creation throws, keeping the hold", async () => {
    vi.mocked(createRegistrationWithHold).mockResolvedValue({
      registrationId: "reg-1",
      holdExpiresAt: "2026-01-01T00:15:00.000Z",
    });
    vi.mocked(getEventCheckoutContext).mockResolvedValue({
      eventId: validBody.eventId,
      eventName: "Prueba 1",
      priceArs: 1000000,
      competitionTitle: "Concurso Test",
      competitionDateFrom: "2026-09-05",
      boxPriceArs: 500000,
    });
    vi.mocked(createCheckoutPreference).mockRejectedValue(new Error("MP down"));

    const response = await POST(buildRequest(validBody));
    expect(response.status).toBe(502);
    const json = await response.json();
    expect(json.error).toBe("payment_provider_error");
    expect(json.registrationId).toBe("reg-1");
  });
});
