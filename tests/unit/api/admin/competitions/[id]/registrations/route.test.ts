import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/registrations", () => ({
  listConfirmedRegistrationsForCompetition: vi.fn(),
}));

import { GET } from "@/app/api/admin/competitions/[id]/registrations/route";
import { listConfirmedRegistrationsForCompetition } from "@/lib/db/queries/registrations";

const ADMIN_HEADERS = { "x-admin-secret": "test-admin-secret" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/competitions/[id]/registrations", () => {
  it("rejects without a valid admin secret", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/admin/competitions/comp-1/registrations", {
        headers: {},
      }),
      { params: Promise.resolve({ id: "comp-1" }) }
    );
    expect(response.status).toBe(401);
  });

  it("includes binomioId even though it's not in the spec's literal response shape", async () => {
    vi.mocked(listConfirmedRegistrationsForCompetition).mockResolvedValue([
      {
        registrationId: "reg-1",
        eventId: "event-1",
        eventName: "Prueba 1",
        category: "Salto 1.10m",
        priceArs: 1000000,
        dayId: "day-1",
        dayLabel: "Día 1",
        boxRequested: true,
        drawOrder: 1,
        confirmedAt: "2026-01-01T00:00:00.000Z",
        binomioId: "binomio-1",
        participantName: "Juan Pérez",
        participantEmail: "juan@test.local",
        horseName: "Relámpago",
        licenseNumber: null,
      },
    ]);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/admin/competitions/comp-1/registrations", {
        headers: ADMIN_HEADERS,
      }),
      { params: Promise.resolve({ id: "comp-1" }) }
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json[0].binomioId).toBe("binomio-1");
    expect(json[0].participantName).toBe("Juan Pérez");
  });
});
