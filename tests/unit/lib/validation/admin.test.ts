import { describe, expect, it } from "vitest";
import {
  addDaySchema,
  addEventSchema,
  createCompetitionSchema,
  updateCompetitionStatusSchema,
} from "@/lib/validation/admin";

describe("createCompetitionSchema", () => {
  const valid = {
    title: "Concurso de Primavera",
    dateFrom: "2026-09-05",
    dateTo: "2026-09-06",
    location: "CHA",
    boxPriceArs: 500000,
    days: [
      {
        dayDate: "2026-09-05",
        dayLabel: "Día 1",
        sortOrder: 0,
        events: [{ name: "Prueba 1", category: "Salto 1.10m", priceArs: 1000000, totalSlots: 10 }],
      },
    ],
  };

  it("accepts a valid nested body", () => {
    expect(createCompetitionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a non-ISO date", () => {
    const result = createCompetitionSchema.safeParse({ ...valid, dateFrom: "05/09/2026" });
    expect(result.success).toBe(false);
  });

  it("rejects a negative boxPriceArs", () => {
    const result = createCompetitionSchema.safeParse({ ...valid, boxPriceArs: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects a prueba with zero totalSlots", () => {
    const result = createCompetitionSchema.safeParse({
      ...valid,
      days: [{ ...valid.days[0], events: [{ ...valid.days[0].events[0], totalSlots: 0 }] }],
    });
    expect(result.success).toBe(false);
  });
});

describe("addDaySchema", () => {
  it("accepts a day without events", () => {
    const result = addDaySchema.safeParse({
      dayDate: "2026-09-06",
      dayLabel: "Día 2",
      sortOrder: 1,
    });
    expect(result.success).toBe(true);
  });
});

describe("addEventSchema", () => {
  it("accepts a valid prueba", () => {
    const result = addEventSchema.safeParse({
      name: "Prueba 2",
      category: "Doma Nivel 2",
      priceArs: 800000,
      totalSlots: 8,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a negative priceArs", () => {
    const result = addEventSchema.safeParse({
      name: "Prueba 2",
      category: "Doma Nivel 2",
      priceArs: -1,
      totalSlots: 8,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCompetitionStatusSchema", () => {
  it.each(["draft", "open", "closed", "cancelled"])("accepts status=%s", (status) => {
    expect(updateCompetitionStatusSchema.safeParse({ status }).success).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(updateCompetitionStatusSchema.safeParse({ status: "unknown" }).success).toBe(false);
  });
});
