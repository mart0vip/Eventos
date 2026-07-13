import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDbPool, resetDb } from "../db";
import { createCompetitionDay, createCompetitionWithEvent, createEvent } from "../fixtures";
import {
  addEventToDay,
  getEventById,
  getEventCheckoutContext,
  getEventsByCompetition,
  markDrawDone,
} from "@/lib/db/queries/events";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDbPool();
});

describe("addEventToDay", () => {
  it("creates a prueba with available_slots equal to total_slots", async () => {
    const { dayId } = await createCompetitionWithEvent();
    const prueba = await addEventToDay(dayId, {
      name: "Prueba 2",
      category: "Doma Nivel 2",
      priceArs: 800000,
      totalSlots: 8,
    });
    expect(prueba.availableSlots).toBe(8);
    expect(prueba.totalSlots).toBe(8);
  });
});

describe("getEventById", () => {
  it("returns null for a non-existent prueba", async () => {
    const found = await getEventById("00000000-0000-0000-0000-000000000000");
    expect(found).toBeNull();
  });

  it("returns the prueba for an existing id", async () => {
    const { eventId } = await createCompetitionWithEvent({ name: "Prueba 1" });
    const found = await getEventById(eventId);
    expect(found?.name).toBe("Prueba 1");
  });
});

describe("getEventsByCompetition", () => {
  it("lists every prueba across all days of a competition, ordered by day then name", async () => {
    const { competitionId, dayId } = await createCompetitionWithEvent({ name: "Prueba A" });
    const day2 = await createCompetitionDay(competitionId, { sortOrder: 1, dayLabel: "Día 2" });
    await createEvent(day2, { name: "Prueba Z" });
    await createEvent(dayId, { name: "Prueba B" });

    const list = await getEventsByCompetition(competitionId);
    expect(list.map((e) => e.name)).toEqual(["Prueba A", "Prueba B", "Prueba Z"]);
  });
});

describe("markDrawDone", () => {
  it("sets draw_done true for the prueba", async () => {
    const { eventId } = await createCompetitionWithEvent();
    await markDrawDone(eventId);
    const found = await getEventById(eventId);
    expect(found?.drawDone).toBe(true);
  });
});

describe("getEventCheckoutContext", () => {
  it("joins the prueba with its competition for checkout/email context", async () => {
    const { eventId } = await createCompetitionWithEvent({ name: "Prueba 1", priceArs: 1000000 });
    const context = await getEventCheckoutContext(eventId);
    expect(context).toEqual({
      eventId,
      eventName: "Prueba 1",
      priceArs: 1000000,
      competitionTitle: "Concurso de Test",
      competitionDateFrom: "2026-09-05",
      boxPriceArs: 500000,
    });
  });

  it("returns null for a non-existent prueba", async () => {
    const context = await getEventCheckoutContext("00000000-0000-0000-0000-000000000000");
    expect(context).toBeNull();
  });
});
