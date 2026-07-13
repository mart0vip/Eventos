import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/members", () => ({
  createMemberDebts: vi.fn(),
  getMemberWithDebts: vi.fn(),
}));

import { GET, POST } from "@/app/api/members/[id]/debts/route";
import { createMemberDebts, getMemberWithDebts } from "@/lib/db/queries/members";

const ADMIN_HEADERS = { "x-admin-secret": "test-admin-secret" };
const memberWithDebts = {
  id: "member-1",
  name: "María Gómez",
  email: "maria@test.local",
  memberNumber: "SOC-001",
  createdAt: "2026-01-01T00:00:00.000Z",
  debts: [],
  pendingTotalArs: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/members/[id]/debts (public)", () => {
  it("returns 404 for a non-existent member", async () => {
    vi.mocked(getMemberWithDebts).mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/members/member-1/debts"), {
      params: Promise.resolve({ id: "member-1" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns the member's debt breakdown without requiring an admin secret", async () => {
    vi.mocked(getMemberWithDebts).mockResolvedValue(memberWithDebts);
    const response = await GET(new Request("http://localhost/api/members/member-1/debts"), {
      params: Promise.resolve({ id: "member-1" }),
    });
    expect(response.status).toBe(200);
  });
});

describe("POST /api/members/[id]/debts (admin)", () => {
  function buildRequest(body: unknown, headers: Record<string, string> = ADMIN_HEADERS) {
    return new NextRequest("http://localhost:3000/api/members/member-1/debts", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  it("rejects without a valid admin secret", async () => {
    const response = await POST(buildRequest({ debts: [] }, {}), {
      params: Promise.resolve({ id: "member-1" }),
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 for a non-existent member", async () => {
    vi.mocked(getMemberWithDebts).mockResolvedValue(null);
    const response = await POST(
      buildRequest({ debts: [{ concept: "cuota", amountArs: 500000, dueDate: "2026-02-01" }] }),
      { params: Promise.resolve({ id: "member-1" }) }
    );
    expect(response.status).toBe(404);
  });

  it("returns 400 for an invalid body", async () => {
    vi.mocked(getMemberWithDebts).mockResolvedValue(memberWithDebts);
    const response = await POST(buildRequest({ debts: [] }), {
      params: Promise.resolve({ id: "member-1" }),
    });
    expect(response.status).toBe(400);
  });

  it("creates the debts", async () => {
    vi.mocked(getMemberWithDebts).mockResolvedValue(memberWithDebts);
    vi.mocked(createMemberDebts).mockResolvedValue([
      {
        id: "debt-1",
        memberId: "member-1",
        concept: "cuota",
        amountArs: 500000,
        dueDate: "2026-02-01",
        paidAt: null,
        mpPreferenceId: null,
        mpPaymentId: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const response = await POST(
      buildRequest({ debts: [{ concept: "cuota", amountArs: 500000, dueDate: "2026-02-01" }] }),
      { params: Promise.resolve({ id: "member-1" }) }
    );
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.debts).toHaveLength(1);
  });
});
