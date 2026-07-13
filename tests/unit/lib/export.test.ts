import { describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";

vi.mock("@/lib/db/queries/registrations", () => ({
  listConfirmedRegistrationsForDay: vi.fn(),
}));

import { generateDailyExport } from "@/lib/export";
import { listConfirmedRegistrationsForDay } from "@/lib/db/queries/registrations";

describe("generateDailyExport", () => {
  it("returns null when the day has no confirmed registrations", async () => {
    vi.mocked(listConfirmedRegistrationsForDay).mockResolvedValue([]);
    const result = await generateDailyExport("comp-1", "2026-09-05");
    expect(result).toBeNull();
  });

  it("generates an XLSX buffer with the expected columns and monto in pesos (not centavos)", async () => {
    vi.mocked(listConfirmedRegistrationsForDay).mockResolvedValue([
      {
        eventName: "Prueba 1",
        category: "Salto 1.10m",
        drawOrder: 3,
        participantName: "Juan Pérez",
        horseName: "Relámpago",
        licenseNumber: "LIC-1",
        boxRequested: true,
        participantEmail: "juan@test.local",
        totalArs: 1500000,
        mpPaymentId: "mp-1",
      },
    ]);

    const result = await generateDailyExport("comp-1", "2026-09-05");
    expect(result).not.toBeNull();
    expect(result?.rowCount).toBe(1);

    const workbook = new ExcelJS.Workbook();
    // exceljs's own type defs declare a conflicting global `Buffer extends ArrayBuffer`
    // interface that Node's real Buffer no longer satisfies structurally — cast around it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(result!.buffer as any);
    const sheet = workbook.getWorksheet("2026-09-05");
    expect(sheet).toBeDefined();

    const headerRow = sheet!.getRow(1).values as unknown[];
    expect(headerRow.slice(1)).toEqual([
      "Prueba",
      "Categoría",
      "Orden Sorteo",
      "Jinete",
      "Caballo",
      "Licencia",
      "Box",
      "Email",
      "Monto",
      "ID Pago MP",
    ]);

    const dataRow = sheet!.getRow(2).values as unknown[];
    expect(dataRow.slice(1)).toEqual([
      "Prueba 1",
      "Salto 1.10m",
      3,
      "Juan Pérez",
      "Relámpago",
      "LIC-1",
      "Sí",
      "juan@test.local",
      15000, // 1500000 centavos -> 15000 pesos
      "mp-1",
    ]);
  });

  it("renders 'No' for boxRequested=false and empty strings for null optional fields", async () => {
    vi.mocked(listConfirmedRegistrationsForDay).mockResolvedValue([
      {
        eventName: "Prueba 1",
        category: "Salto 1.10m",
        drawOrder: null,
        participantName: "Juan Pérez",
        horseName: "Relámpago",
        licenseNumber: null,
        boxRequested: false,
        participantEmail: "juan@test.local",
        totalArs: 1000000,
        mpPaymentId: null,
      },
    ]);

    const result = await generateDailyExport("comp-1", "2026-09-05");
    const workbook = new ExcelJS.Workbook();
    // exceljs's own type defs declare a conflicting global `Buffer extends ArrayBuffer`
    // interface that Node's real Buffer no longer satisfies structurally — cast around it.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(result!.buffer as any);
    const sheet = workbook.getWorksheet("2026-09-05");
    const dataRow = sheet!.getRow(2).values as unknown[];

    expect(dataRow.slice(1)).toEqual([
      "Prueba 1",
      "Salto 1.10m",
      "",
      "Juan Pérez",
      "Relámpago",
      "",
      "No",
      "juan@test.local",
      10000,
      "",
    ]);
  });
});
