import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/members", () => ({
  createMember: vi.fn(),
  listMembersWithPendingTotal: vi.fn(),
}));

import { GET, POST } from "@/app/api/members/route";
import { createMember, listMembersWithPendingTotal } from "@/lib/db/queries/members";

const ADMIN_HEADERS = { "x-admin-secret": "test-admin-secret" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/members", () => {
  it("rejects without a valid admin secret", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/members", { headers: {} })
    );
    expect(response.status).toBe(401);
    expect(listMembersWithPendingTotal).not.toHaveBeenCalled();
  });

  it("lists members with their pending debt total", async () => {
    vi.mocked(listMembersWithPendingTotal).mockResolvedValue([
      {
        id: "member-1",
        name: "María Gómez",
        email: "maria@test.local",
        memberNumber: "SOC-001",
        createdAt: "2026-01-01T00:00:00.000Z",
        pendingTotalArs: 300000,
      },
    ]);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/members", { headers: ADMIN_HEADERS })
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json[0].pendingTotalArs).toBe(300000);
  });
});

describe("POST /api/members", () => {
  function buildRequest(body: unknown, headers: Record<string, string> = ADMIN_HEADERS) {
    return new NextRequest("http://localhost:3000/api/members", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  it("rejects without a valid admin secret", async () => {
    const response = await POST(buildRequest({}, {}));
    expect(response.status).toBe(401);
  });

  it("returns 400 for an invalid body", async () => {
    const response = await POST(buildRequest({ name: "", email: "not-an-email" }));
    expect(response.status).toBe(400);
  });

  it("creates a member", async () => {
    vi.mocked(createMember).mockResolvedValue({
      member: {
        id: "member-1",
        name: "María Gómez",
        email: "maria@test.local",
        memberNumber: "SOC-001",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    });

    const response = await POST(
      buildRequest({ name: "María Gómez", email: "maria@test.local", memberNumber: "SOC-001" })
    );
    expect(response.status).toBe(201);
  });

  it("returns 409 member_exists on a duplicate email/member number", async () => {
    vi.mocked(createMember).mockResolvedValue({ error: "duplicate" });

    const response = await POST(
      buildRequest({ name: "María Gómez", email: "maria@test.local", memberNumber: "SOC-001" })
    );
    expect(response.status).toBe(409);
    expect((await response.json()).error).toBe("member_exists");
  });
});
