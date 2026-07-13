import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/export", () => ({ generateDailyExport: vi.fn() }));
vi.mock("@/lib/db/queries/exportLogs", () => ({ insertExportLog: vi.fn() }));

import { GET } from "@/app/api/admin/export/route";
import { generateDailyExport } from "@/lib/export";
import { insertExportLog } from "@/lib/db/queries/exportLogs";

const ADMIN_HEADERS = { "x-admin-secret": "test-admin-secret" };
const VALID_COMPETITION_ID = "123e4567-e89b-12d3-a456-426614174000";

function buildRequest(query: string, headers: Record<string, string> = ADMIN_HEADERS) {
  return new NextRequest(`http://localhost:3000/api/admin/export${query}`, { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/admin/export", () => {
  it("rejects without a valid admin secret", async () => {
    const response = await GET(
      buildRequest(`?competitionId=${VALID_COMPETITION_ID}&date=2026-09-05`, {})
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 invalid_params for a malformed competitionId", async () => {
    const response = await GET(buildRequest("?competitionId=not-a-uuid&date=2026-09-05"));
    expect(response.status).toBe(400);
  });

  it("returns 404 no_rows when the day has no confirmed registrations", async () => {
    vi.mocked(generateDailyExport).mockResolvedValue(null);
    const response = await GET(
      buildRequest(`?competitionId=${VALID_COMPETITION_ID}&date=2026-09-05`)
    );
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("no_rows");
  });

  it("streams the XLSX and logs the export", async () => {
    vi.mocked(generateDailyExport).mockResolvedValue({
      buffer: Buffer.from("fake-xlsx-content"),
      rowCount: 5,
    });

    const response = await GET(
      buildRequest(`?competitionId=${VALID_COMPETITION_ID}&date=2026-09-05`)
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("spreadsheetml");
    expect(response.headers.get("Content-Disposition")).toContain("planilla-2026-09-05.xlsx");
    expect(insertExportLog).toHaveBeenCalledWith({
      exportDate: "2026-09-05",
      fileName: "planilla-2026-09-05.xlsx",
      rowCount: 5,
      exportedBy: "manual",
    });
  });
});
