import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/queries/competitions", () => ({ listOpenCompetitions: vi.fn() }));

import { GET } from "@/app/api/competitions/route";
import { listOpenCompetitions } from "@/lib/db/queries/competitions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/competitions", () => {
  it("returns the list of open competitions", async () => {
    vi.mocked(listOpenCompetitions).mockResolvedValue([
      {
        id: "comp-1",
        title: "Concurso de Primavera",
        dateFrom: "2026-09-05",
        dateTo: "2026-09-06",
        location: "CHA",
        description: null,
        status: "open",
        boxPriceArs: 500000,
        createdAt: "2026-01-01T00:00:00.000Z",
        pruebaCount: 2,
      },
    ]);

    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveLength(1);
    expect(json[0].pruebaCount).toBe(2);
  });
});
