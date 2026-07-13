import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/competitions", () => ({ addDayToCompetition: vi.fn() }));

import { POST } from "@/app/api/admin/competitions/[id]/days/route";
import { addDayToCompetition } from "@/lib/db/queries/competitions";

const ADMIN_HEADERS = { "x-admin-secret": "test-admin-secret" };
const validBody = { dayDate: "2026-09-06", dayLabel: "Día 2", sortOrder: 1 };

function buildRequest(body: unknown, headers: Record<string, string> = ADMIN_HEADERS) {
  return new NextRequest("http://localhost:3000/api/admin/competitions/comp-1/days", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/competitions/[id]/days", () => {
  it("rejects without a valid admin secret", async () => {
    const response = await POST(buildRequest(validBody, {}), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 400 for an invalid body", async () => {
    const response = await POST(buildRequest({ ...validBody, dayDate: "not-a-date" }), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(400);
  });

  it("adds the day", async () => {
    vi.mocked(addDayToCompetition).mockResolvedValue({
      id: "day-1",
      competitionId: "comp-1",
      dayDate: validBody.dayDate,
      dayLabel: validBody.dayLabel,
      sortOrder: validBody.sortOrder,
    });

    const response = await POST(buildRequest(validBody), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(201);
  });
});
