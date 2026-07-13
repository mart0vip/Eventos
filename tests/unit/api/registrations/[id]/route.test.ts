import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/queries/registrations", () => ({ getRegistrationById: vi.fn() }));
vi.mock("@/lib/db/queries/events", () => ({ getEventCheckoutContext: vi.fn() }));
vi.mock("@/lib/db/queries/binomios", () => ({ getBinomioById: vi.fn() }));

import { GET } from "@/app/api/registrations/[id]/route";
import { getRegistrationById } from "@/lib/db/queries/registrations";
import { getEventCheckoutContext } from "@/lib/db/queries/events";
import { getBinomioById } from "@/lib/db/queries/binomios";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/registrations/[id]", () => {
  it("returns 404 for a non-existent registration", async () => {
    vi.mocked(getRegistrationById).mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/registrations/reg-1"), {
      params: Promise.resolve({ id: "reg-1" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns the registration status joined with event/binomio context", async () => {
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
      confirmedAt: "2026-01-01T00:05:00.000Z",
    });
    vi.mocked(getEventCheckoutContext).mockResolvedValue({
      eventId: "event-1",
      eventName: "Prueba 1",
      priceArs: 1000000,
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

    const response = await GET(new Request("http://localhost/api/registrations/reg-1"), {
      params: Promise.resolve({ id: "reg-1" }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("confirmed");
    expect(json.eventName).toBe("Prueba 1");
    expect(json.participantName).toBe("Juan Pérez");
  });

  it("falls back to null context fields when the event/binomio lookups fail", async () => {
    vi.mocked(getRegistrationById).mockResolvedValue({
      id: "reg-1",
      eventId: "event-1",
      binomioId: "binomio-1",
      boxRequested: false,
      drawOrder: null,
      status: "pending_payment",
      holdExpiresAt: "2026-01-01T00:15:00.000Z",
      mpPreferenceId: "pref-1",
      mpPaymentId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      confirmedAt: null,
    });
    vi.mocked(getEventCheckoutContext).mockResolvedValue(null);
    vi.mocked(getBinomioById).mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/registrations/reg-1"), {
      params: Promise.resolve({ id: "reg-1" }),
    });
    const json = await response.json();
    expect(json.eventName).toBeNull();
    expect(json.participantName).toBeNull();
  });
});
