import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDbPool, resetDb } from "../db";
import { createBinomio, createCompetitionWithEvent } from "../fixtures";
import { addToWaitlist, getNextWaitlisted, markNotified } from "@/lib/db/queries/waitlist";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDbPool();
});

describe("waitlist", () => {
  it("returns the oldest not-yet-notified entry first (FIFO)", async () => {
    const { eventId } = await createCompetitionWithEvent();
    const first = await createBinomio({ participantEmail: "first@test.local" });
    const second = await createBinomio({ participantEmail: "second@test.local" });

    const firstEntry = await addToWaitlist(eventId, first);
    await addToWaitlist(eventId, second);

    const next = await getNextWaitlisted(eventId);
    expect(next?.id).toBe(firstEntry.id);
    expect(next?.binomioId).toBe(first);
  });

  it("skips already-notified entries", async () => {
    const { eventId } = await createCompetitionWithEvent();
    const first = await createBinomio({ participantEmail: "first@test.local" });
    const second = await createBinomio({ participantEmail: "second@test.local" });

    const firstEntry = await addToWaitlist(eventId, first);
    const secondEntry = await addToWaitlist(eventId, second);
    await markNotified(firstEntry.id);

    const next = await getNextWaitlisted(eventId);
    expect(next?.id).toBe(secondEntry.id);
  });

  it("returns null when the waitlist is empty or fully notified", async () => {
    const { eventId } = await createCompetitionWithEvent();
    expect(await getNextWaitlisted(eventId)).toBeNull();

    const binomioId = await createBinomio();
    const entry = await addToWaitlist(eventId, binomioId);
    await markNotified(entry.id);
    expect(await getNextWaitlisted(eventId)).toBeNull();
  });
});
