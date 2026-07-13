import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/competitions", () => ({
  createCompetitionWithDaysAndEvents: vi.fn(),
  listAllCompetitions: vi.fn(),
}));

import { GET, POST } from "@/app/api/admin/competitions/route";
import {
  createCompetitionWithDaysAndEvents,
  listAllCompetitions,
} from "@/lib/db/queries/competitions";

const ADMIN_HEADERS = { "x-admin-secret": "test-admin-secret" };
const validBody = {
  title: "Concurso de Primavera",
  dateFrom: "2026-09-05",
  dateTo: "2026-09-06",
  location: "CHA",
  boxPriceArs: 500000,
  days: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/competitions", () => {
  it("rejects without a valid admin secret", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/admin/competitions", { headers: {} })
    );
    expect(response.status).toBe(401);
  });

  it("lists every competition regardless of status", async () => {
    vi.mocked(listAllCompetitions).mockResolvedValue([]);
    const response = await GET(
      new NextRequest("http://localhost:3000/api/admin/competitions", {
        headers: ADMIN_HEADERS,
      })
    );
    expect(response.status).toBe(200);
  });
});

describe("POST /api/admin/competitions", () => {
  function buildRequest(body: unknown, headers: Record<string, string> = ADMIN_HEADERS) {
    return new NextRequest("http://localhost:3000/api/admin/competitions", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  it("rejects without a valid admin secret", async () => {
    const response = await POST(buildRequest(validBody, {}));
    expect(response.status).toBe(401);
  });

  it("returns 400 for an invalid body", async () => {
    const response = await POST(buildRequest({ ...validBody, dateFrom: "not-a-date" }));
    expect(response.status).toBe(400);
  });

  it("creates the competition with its nested anteprograma", async () => {
    vi.mocked(createCompetitionWithDaysAndEvents).mockResolvedValue({
      id: "comp-1",
      title: validBody.title,
      dateFrom: validBody.dateFrom,
      dateTo: validBody.dateTo,
      location: validBody.location,
      description: null,
      status: "draft",
      boxPriceArs: validBody.boxPriceArs,
      createdAt: "2026-01-01T00:00:00.000Z",
      days: [],
    });

    const response = await POST(buildRequest(validBody));
    expect(response.status).toBe(201);
  });
});
