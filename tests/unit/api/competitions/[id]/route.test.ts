import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/queries/competitions", () => ({ getCompetitionById: vi.fn() }));

import { GET } from "@/app/api/competitions/[id]/route";
import { getCompetitionById } from "@/lib/db/queries/competitions";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/competitions/[id]", () => {
  it("returns 404 for a non-existent competition", async () => {
    vi.mocked(getCompetitionById).mockResolvedValue(null);
    const response = await GET(new Request("http://localhost/api/competitions/comp-1"), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(404);
  });

  it("returns the competition with its anteprograma", async () => {
    vi.mocked(getCompetitionById).mockResolvedValue({
      id: "comp-1",
      title: "Concurso de Primavera",
      dateFrom: "2026-09-05",
      dateTo: "2026-09-06",
      location: "CHA",
      description: null,
      status: "open",
      boxPriceArs: 500000,
      createdAt: "2026-01-01T00:00:00.000Z",
      days: [],
    });

    const response = await GET(new Request("http://localhost/api/competitions/comp-1"), {
      params: Promise.resolve({ id: "comp-1" }),
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.title).toBe("Concurso de Primavera");
  });
});
