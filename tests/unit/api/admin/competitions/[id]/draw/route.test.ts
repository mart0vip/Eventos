import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/competitions", () => ({ getCompetitionById: vi.fn() }));
vi.mock("@/lib/db/queries/registrations", () => ({
  bulkSetDrawOrder: vi.fn(),
  listConfirmedRegistrationsForCompetition: vi.fn(),
}));
vi.mock("@/lib/db/queries/events", () => ({ markDrawDone: vi.fn() }));

import { POST } from "@/app/api/admin/competitions/[id]/draw/route";
import { getCompetitionById } from "@/lib/db/queries/competitions";
import {
  bulkSetDrawOrder,
  listConfirmedRegistrationsForCompetition,
} from "@/lib/db/queries/registrations";
import { markDrawDone } from "@/lib/db/queries/events";

const ADMIN_HEADERS = { "x-admin-secret": "test-admin-secret" };

function buildRequest(headers: Record<string, string> = ADMIN_HEADERS) {
  return new NextRequest("http://localhost:3000/api/admin/competitions/comp-1/draw", {
    method: "POST",
    headers,
  });
}

function competitionWithPruebas(pruebas: { id: string; drawDone: boolean }[], status = "closed") {
  return {
    id: "comp-1",
    title: "Concurso",
    dateFrom: "2026-09-05",
    dateTo: "2026-09-06",
    location: "CHA",
    description: null,
    status: status as "draft" | "open" | "closed" | "cancelled",
    boxPriceArs: 500000,
    createdAt: "2026-01-01T00:00:00.000Z",
    days: [
      {
        id: "day-1",
        competitionId: "comp-1",
        dayDate: "2026-09-05",
        dayLabel: "Día 1",
        sortOrder: 0,
        pruebas: pruebas.map((p) => ({
          id: p.id,
          dayId: "day-1",
          name: "Prueba",
          category: "Salto 1.10m",
          priceArs: 1000000,
          totalSlots: 10,
          availableSlots: 8,
          drawDone: p.drawDone,
          createdAt: "2026-01-01T00:00:00.000Z",
        })),
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/competitions/[id]/draw", () => {
  it("rejects without a valid admin secret", async () => {
    const response = await POST(buildRequest({}), { params: Promise.resolve({ id: "comp-1" }) });
    expect(response.status).toBe(401);
  });

  it("returns 404 for a non-existent competition", async () => {
    vi.mocked(getCompetitionById).mockResolvedValue(null);
    const response = await POST(buildRequest(), { params: Promise.resolve({ id: "comp-1" }) });
    expect(response.status).toBe(404);
  });

  it("returns 400 competition_not_closed when the competition isn't closed", async () => {
    vi.mocked(getCompetitionById).mockResolvedValue(competitionWithPruebas([], "open"));
    const response = await POST(buildRequest(), { params: Promise.resolve({ id: "comp-1" }) });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("competition_not_closed");
  });

  it("assigns draw_order 1..n to every confirmed registration of an undrawn prueba", async () => {
    vi.mocked(getCompetitionById).mockResolvedValue(
      competitionWithPruebas([{ id: "event-1", drawDone: false }])
    );
    vi.mocked(listConfirmedRegistrationsForCompetition).mockResolvedValue([
      {
        registrationId: "reg-1",
        eventId: "event-1",
        eventName: "Prueba",
        category: "Salto 1.10m",
        priceArs: 1000000,
        dayId: "day-1",
        dayLabel: "Día 1",
        boxRequested: false,
        drawOrder: null,
        confirmedAt: "2026-01-01T00:00:00.000Z",
        binomioId: "binomio-1",
        participantName: "Juan Pérez",
        participantEmail: "juan@test.local",
        horseName: "Relámpago",
        licenseNumber: null,
      },
      {
        registrationId: "reg-2",
        eventId: "event-1",
        eventName: "Prueba",
        category: "Salto 1.10m",
        priceArs: 1000000,
        dayId: "day-1",
        dayLabel: "Día 1",
        boxRequested: false,
        confirmedAt: "2026-01-01T00:00:00.000Z",
        drawOrder: null,
        binomioId: "binomio-2",
        participantName: "María Gómez",
        participantEmail: "maria@test.local",
        horseName: "Trueno",
        licenseNumber: null,
      },
    ]);

    const response = await POST(buildRequest(), { params: Promise.resolve({ id: "comp-1" }) });
    expect(response.status).toBe(200);

    expect(markDrawDone).toHaveBeenCalledWith("event-1");
    const assignments = vi.mocked(bulkSetDrawOrder).mock.calls[0][0];
    expect(assignments).toHaveLength(2);
    expect(assignments.map((a) => a.drawOrder).sort()).toEqual([1, 2]);

    const json = await response.json();
    expect(json.results).toHaveLength(1);
    expect(json.results[0].order).toHaveLength(2);
  });

  it("skips pruebas that are already draw_done", async () => {
    vi.mocked(getCompetitionById).mockResolvedValue(
      competitionWithPruebas([{ id: "event-1", drawDone: true }])
    );
    vi.mocked(listConfirmedRegistrationsForCompetition).mockResolvedValue([
      {
        registrationId: "reg-1",
        eventId: "event-1",
        eventName: "Prueba",
        category: "Salto 1.10m",
        priceArs: 1000000,
        dayId: "day-1",
        dayLabel: "Día 1",
        boxRequested: false,
        drawOrder: 1,
        confirmedAt: "2026-01-01T00:00:00.000Z",
        binomioId: "binomio-1",
        participantName: "Juan Pérez",
        participantEmail: "juan@test.local",
        horseName: "Relámpago",
        licenseNumber: null,
      },
    ]);

    const response = await POST(buildRequest(), { params: Promise.resolve({ id: "comp-1" }) });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.results).toHaveLength(0);
    expect(markDrawDone).not.toHaveBeenCalled();
    expect(bulkSetDrawOrder).toHaveBeenCalledWith([]);
  });
});
