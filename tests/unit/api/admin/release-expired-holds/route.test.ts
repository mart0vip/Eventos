import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/registrations", () => ({ releaseExpiredHolds: vi.fn() }));

import { GET, POST } from "@/app/api/admin/release-expired-holds/route";
import { releaseExpiredHolds } from "@/lib/db/queries/registrations";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ADMIN_SECRET = "test-admin-secret";
  process.env.CRON_SECRET = "test-cron-secret";
  vi.mocked(releaseExpiredHolds).mockResolvedValue(3);
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function buildRequest(headers: Record<string, string>, method: "GET" | "POST" = "POST") {
  return new NextRequest("http://localhost:3000/api/admin/release-expired-holds", {
    method,
    headers,
  });
}

describe("POST /api/admin/release-expired-holds", () => {
  it("authorizes via x-admin-secret", async () => {
    const response = await POST(buildRequest({ "x-admin-secret": "test-admin-secret" }));
    expect(response.status).toBe(200);
    expect((await response.json()).released).toBe(3);
  });

  it("authorizes via Bearer CRON_SECRET (Vercel Cron's own header)", async () => {
    const response = await POST(
      buildRequest({ authorization: "Bearer test-cron-secret" })
    );
    expect(response.status).toBe(200);
  });

  it("rejects a wrong x-admin-secret", async () => {
    const response = await POST(buildRequest({ "x-admin-secret": "wrong" }));
    expect(response.status).toBe(401);
    expect(releaseExpiredHolds).not.toHaveBeenCalled();
  });

  it("rejects a wrong bearer token", async () => {
    const response = await POST(buildRequest({ authorization: "Bearer wrong" }));
    expect(response.status).toBe(401);
  });

  it("rejects when no auth header is present at all", async () => {
    const response = await POST(buildRequest({}));
    expect(response.status).toBe(401);
  });
});

describe("GET /api/admin/release-expired-holds (Vercel Cron invokes via GET)", () => {
  it("authorizes via Bearer CRON_SECRET on GET too", async () => {
    const response = await GET(
      buildRequest({ authorization: "Bearer test-cron-secret" }, "GET")
    );
    expect(response.status).toBe(200);
  });
});
