import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDbPool, resetDb } from "../db";
import { createCompetition, createCompetitionDay, createEvent } from "../fixtures";
import {
  addDayToCompetition,
  createCompetitionWithDaysAndEvents,
  getCompetitionById,
  listAllCompetitions,
  listOpenCompetitions,
  updateCompetitionStatus,
} from "@/lib/db/queries/competitions";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDbPool();
});

describe("listOpenCompetitions", () => {
  it("lists only status=open competitions, with a prueba count", async () => {
    const openId = await createCompetition({ title: "Abierto" });
    await updateCompetitionStatus(openId, "open");
    const dayId = await createCompetitionDay(openId);
    await createEvent(dayId);
    await createEvent(dayId);

    await createCompetition({ title: "Borrador" });

    const list = await listOpenCompetitions();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("Abierto");
    expect(list[0].pruebaCount).toBe(2);
  });

  it("orders by date_from ascending", async () => {
    const laterId = await createCompetition({ title: "Later", dateFrom: "2026-12-01", dateTo: "2026-12-02" });
    const earlierId = await createCompetition({ title: "Earlier", dateFrom: "2026-01-01", dateTo: "2026-01-02" });
    await updateCompetitionStatus(laterId, "open");
    await updateCompetitionStatus(earlierId, "open");

    const list = await listOpenCompetitions();
    expect(list.map((c) => c.title)).toEqual(["Earlier", "Later"]);
  });
});

describe("listAllCompetitions", () => {
  it("includes competitions regardless of status", async () => {
    const draftId = await createCompetition({ title: "Draft" });
    const openId = await createCompetition({ title: "Open" });
    await updateCompetitionStatus(openId, "open");

    const list = await listAllCompetitions();
    expect(list.map((c) => c.id).sort()).toEqual([draftId, openId].sort());
  });
});

describe("getCompetitionById", () => {
  it("returns the competition with its full days/pruebas anteprograma", async () => {
    const competitionId = await createCompetition();
    const dayId = await createCompetitionDay(competitionId, { dayLabel: "Día 1" });
    await createEvent(dayId, { name: "Prueba A" });
    await createEvent(dayId, { name: "Prueba B" });

    const found = await getCompetitionById(competitionId);
    expect(found).not.toBeNull();
    expect(found?.days).toHaveLength(1);
    expect(found?.days[0].pruebas.map((p) => p.name).sort()).toEqual(["Prueba A", "Prueba B"]);
  });

  it("returns null for a non-existent competition", async () => {
    const found = await getCompetitionById("00000000-0000-0000-0000-000000000000");
    expect(found).toBeNull();
  });
});

describe("createCompetitionWithDaysAndEvents", () => {
  it("creates the competition, its days, and pruebas atomically", async () => {
    const created = await createCompetitionWithDaysAndEvents({
      title: "Concurso Nuevo",
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
    });

    expect(created.days).toHaveLength(1);
    expect(created.days[0].pruebas).toHaveLength(1);
    expect(created.days[0].pruebas[0].availableSlots).toBe(10);

    const refetched = await getCompetitionById(created.id);
    expect(refetched?.days[0].pruebas[0].name).toBe("Prueba 1");
  });
});

describe("addDayToCompetition", () => {
  it("adds a day to an existing competition", async () => {
    const competitionId = await createCompetition();
    const day = await addDayToCompetition(competitionId, {
      dayDate: "2026-09-06",
      dayLabel: "Día 2",
      sortOrder: 1,
    });
    expect(day.competitionId).toBe(competitionId);

    const found = await getCompetitionById(competitionId);
    expect(found?.days).toHaveLength(1);
    expect(found?.days[0].dayLabel).toBe("Día 2");
  });
});

describe("updateCompetitionStatus", () => {
  it("updates the status and returns the updated row", async () => {
    const competitionId = await createCompetition();
    const updated = await updateCompetitionStatus(competitionId, "open");
    expect(updated?.status).toBe("open");
  });

  it("returns null for a non-existent competition", async () => {
    const updated = await updateCompetitionStatus(
      "00000000-0000-0000-0000-000000000000",
      "open"
    );
    expect(updated).toBeNull();
  });
});
