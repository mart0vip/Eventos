import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/events", () => ({ addEventToDay: vi.fn() }));

import { POST } from "@/app/api/admin/days/[dayId]/events/route";
import { addEventToDay } from "@/lib/db/queries/events";

const ADMIN_HEADERS = { "x-admin-secret": "test-admin-secret" };
const validBody = { name: "Prueba 2", category: "Doma Nivel 2", priceArs: 800000, totalSlots: 8 };

function buildRequest(body: unknown, headers: Record<string, string> = ADMIN_HEADERS) {
  return new NextRequest("http://localhost:3000/api/admin/days/day-1/events", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/admin/days/[dayId]/events", () => {
  it("rejects without a valid admin secret", async () => {
    const response = await POST(buildRequest(validBody, {}), {
      params: Promise.resolve({ dayId: "day-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 400 for an invalid body", async () => {
    const response = await POST(buildRequest({ ...validBody, totalSlots: 0 }), {
      params: Promise.resolve({ dayId: "day-1" }),
    });
    expect(response.status).toBe(400);
  });

  it("adds the prueba", async () => {
    vi.mocked(addEventToDay).mockResolvedValue({
      id: "event-1",
      dayId: "day-1",
      name: validBody.name,
      category: validBody.category,
      priceArs: validBody.priceArs,
      totalSlots: validBody.totalSlots,
      availableSlots: validBody.totalSlots,
      drawDone: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const response = await POST(buildRequest(validBody), {
      params: Promise.resolve({ dayId: "day-1" }),
    });
    expect(response.status).toBe(201);
  });
});
