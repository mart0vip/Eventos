import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/competitions", () => ({
  getCompetitionById: vi.fn(),
  updateCompetitionStatus: vi.fn(),
}));

import { PATCH } from "@/app/api/admin/competitions/[id]/route";
import { getCompetitionById, updateCompetitionStatus } from "@/lib/db/queries/competitions";

const ADMIN_HEADERS = { "x-admin-secret": "test-admin-secret" };

function buildRequest(body: unknown, headers: Record<string, string> = ADMIN_HEADERS) {
  return new NextRequest("http://localhost:3000/api/admin/competitions/comp-1", {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
}

function competitionWithStatus(status: "draft" | "open" | "closed" | "cancelled") {
  return {
    id: "comp-1",
    title: "Concurso",
    dateFrom: "2026-09-05",
    dateTo: "2026-09-06",
    location: "CHA",
    description: null,
    status,
    boxPriceArs: 500000,
    createdAt: "2026-01-01T00:00:00.000Z",
    days: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PATCH /api/admin/competitions/[id]", () => {
  it("rejects without a valid admin secret", async () => {
    const response = await PATCH(buildRequest({ status: "open" }, {}), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 400 for an invalid status value", async () => {
    const response = await PATCH(buildRequest({ status: "unknown" }), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(400);
  });

  it("returns 404 for a non-existent competition", async () => {
    vi.mocked(getCompetitionById).mockResolvedValue(null);
    const response = await PATCH(buildRequest({ status: "open" }), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(404);
  });

  it("allows draft -> open", async () => {
    vi.mocked(getCompetitionById).mockResolvedValue(competitionWithStatus("draft"));
    vi.mocked(updateCompetitionStatus).mockResolvedValue(competitionWithStatus("open"));

    const response = await PATCH(buildRequest({ status: "open" }), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(200);
  });

  it("rejects draft -> closed as an illegal transition (must go through open first)", async () => {
    vi.mocked(getCompetitionById).mockResolvedValue(competitionWithStatus("draft"));

    const response = await PATCH(buildRequest({ status: "closed" }), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("illegal_transition");
    expect(updateCompetitionStatus).not.toHaveBeenCalled();
  });

  it("rejects any transition out of cancelled (terminal state)", async () => {
    vi.mocked(getCompetitionById).mockResolvedValue(competitionWithStatus("cancelled"));

    const response = await PATCH(buildRequest({ status: "open" }), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(400);
  });

  it("rejects closed -> open (one-way gate)", async () => {
    vi.mocked(getCompetitionById).mockResolvedValue(competitionWithStatus("closed"));

    const response = await PATCH(buildRequest({ status: "open" }), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(400);
  });
});
