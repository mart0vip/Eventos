import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/queries/paymentEvents", () => ({
  getDashboardTotals: vi.fn(),
  listRecentPayments: vi.fn(),
}));
vi.mock("@/lib/db/queries/members", () => ({ getPendingMemberDebtTotal: vi.fn() }));

import { GET } from "@/app/api/admin/dashboard/route";
import { getDashboardTotals, listRecentPayments } from "@/lib/db/queries/paymentEvents";
import { getPendingMemberDebtTotal } from "@/lib/db/queries/members";

const ADMIN_HEADERS = { "x-admin-secret": "test-admin-secret" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/dashboard", () => {
  it("rejects without a valid admin secret", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/admin/dashboard", { headers: {} })
    );
    expect(response.status).toBe(401);
  });

  it("aggregates totals, pending member debt, and recent payments", async () => {
    vi.mocked(getDashboardTotals).mockResolvedValue({
      totalCollectedArs: 1500000,
      collectedRegistrationsArs: 1000000,
      collectedMemberDebtsArs: 500000,
      paymentsCount: 2,
    });
    vi.mocked(getPendingMemberDebtTotal).mockResolvedValue(300000);
    vi.mocked(listRecentPayments).mockResolvedValue([
      {
        source: "registration",
        amountArs: 1000000,
        mpPaymentId: "mp-1",
        receivedAt: "2026-01-01T00:00:00.000Z",
        payerLabel: "Juan Pérez / Relámpago",
      },
    ]);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/admin/dashboard", { headers: ADMIN_HEADERS })
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.totalCollectedArs).toBe(1500000);
    expect(json.pendingMemberDebtArs).toBe(300000);
    expect(json.recentPayments).toHaveLength(1);
    expect(listRecentPayments).toHaveBeenCalledWith(20);
  });
});
