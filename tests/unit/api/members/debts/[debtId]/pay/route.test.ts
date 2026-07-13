import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/queries/members", () => ({
  getDebtWithMember: vi.fn(),
  setDebtPreferenceId: vi.fn(),
}));
vi.mock("@/lib/mercadopago", () => ({ createDebtCheckoutPreference: vi.fn() }));

import { POST } from "@/app/api/members/debts/[debtId]/pay/route";
import { getDebtWithMember, setDebtPreferenceId } from "@/lib/db/queries/members";
import { createDebtCheckoutPreference } from "@/lib/mercadopago";

const found = {
  debt: {
    id: "debt-1",
    memberId: "member-1",
    concept: "cuota" as const,
    amountArs: 500000,
    dueDate: "2026-02-01",
    paidAt: null,
    mpPreferenceId: null,
    mpPaymentId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  member: {
    id: "member-1",
    name: "María Gómez",
    email: "maria@test.local",
    memberNumber: "SOC-001",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/members/debts/[debtId]/pay (public)", () => {
  it("returns 404 for a non-existent debt", async () => {
    vi.mocked(getDebtWithMember).mockResolvedValue(null);
    const response = await POST(new Request("http://localhost/api/members/debts/debt-1/pay"), {
      params: Promise.resolve({ debtId: "debt-1" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns 409 already_paid for an already-paid debt", async () => {
    vi.mocked(getDebtWithMember).mockResolvedValue({
      ...found,
      debt: { ...found.debt, paidAt: "2026-01-15T00:00:00.000Z" },
    });
    const response = await POST(new Request("http://localhost/api/members/debts/debt-1/pay"), {
      params: Promise.resolve({ debtId: "debt-1" }),
    });
    expect(response.status).toBe(409);
  });

  it("creates the checkout preference and returns its URL", async () => {
    vi.mocked(getDebtWithMember).mockResolvedValue(found);
    vi.mocked(createDebtCheckoutPreference).mockResolvedValue({
      preferenceId: "pref-1",
      checkoutUrl: "https://mercadopago.test/checkout/pref-1",
    });

    const response = await POST(new Request("http://localhost/api/members/debts/debt-1/pay"), {
      params: Promise.resolve({ debtId: "debt-1" }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.checkoutUrl).toBe("https://mercadopago.test/checkout/pref-1");
    expect(setDebtPreferenceId).toHaveBeenCalledWith("debt-1", "pref-1");
  });

  it("returns 502 when Mercado Pago preference creation throws", async () => {
    vi.mocked(getDebtWithMember).mockResolvedValue(found);
    vi.mocked(createDebtCheckoutPreference).mockRejectedValue(new Error("MP down"));

    const response = await POST(new Request("http://localhost/api/members/debts/debt-1/pay"), {
      params: Promise.resolve({ debtId: "debt-1" }),
    });
    expect(response.status).toBe(502);
  });
});
