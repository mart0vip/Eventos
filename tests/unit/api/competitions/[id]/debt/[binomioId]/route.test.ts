import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/queries/registrations", () => ({ getDebtForBinomio: vi.fn() }));

import { GET } from "@/app/api/competitions/[id]/debt/[binomioId]/route";
import { getDebtForBinomio } from "@/lib/db/queries/registrations";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/competitions/[id]/debt/[binomioId]", () => {
  it("returns 404 when the binomio has no confirmed registrations", async () => {
    vi.mocked(getDebtForBinomio).mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/competitions/comp-1/debt/binomio-1"), {
      params: Promise.resolve({ id: "comp-1", binomioId: "binomio-1" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns the debt breakdown", async () => {
    vi.mocked(getDebtForBinomio).mockResolvedValue({
      binomioName: "Juan Pérez",
      horseName: "Relámpago",
      items: [{ concept: "Prueba 1", amountArs: 1000000 }],
      totalArs: 1000000,
      paid: true,
    });

    const response = await GET(new Request("http://localhost/api/competitions/comp-1/debt/binomio-1"), {
      params: Promise.resolve({ id: "comp-1", binomioId: "binomio-1" }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.totalArs).toBe(1000000);
    expect(json.paid).toBe(true);
  });
});
