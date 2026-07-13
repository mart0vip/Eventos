import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getPool } from "@/lib/db/client";
import { closeDbPool, resetDb } from "../db";
import { createBinomio, createCompetitionWithEvent, createEvent } from "../fixtures";
import {
  bulkSetDrawOrder,
  cancelRegistrationAndReleaseSlot,
  confirmRegistration,
  createRegistrationWithHold,
  getDebtForBinomio,
  releaseExpiredHolds,
} from "@/lib/db/queries/registrations";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDbPool();
});

describe("createRegistrationWithHold", () => {
  it("creates a pending_payment hold and decrements available_slots", async () => {
    const { eventId } = await createCompetitionWithEvent({ availableSlots: 5, totalSlots: 5 });
    const binomioId = await createBinomio();

    const result = await createRegistrationWithHold({
      eventId,
      binomioId,
      boxRequested: true,
    });

    expect("registrationId" in result).toBe(true);
    if (!("registrationId" in result)) throw new Error("expected success");
    expect(result.holdExpiresAt).toBeTruthy();

    const pool = getPool();
    const { rows } = await pool.query("SELECT available_slots FROM events WHERE id = $1", [
      eventId,
    ]);
    expect(rows[0].available_slots).toBe(4);
  });

  it("returns not_found for a non-existent event", async () => {
    const binomioId = await createBinomio();
    const result = await createRegistrationWithHold({
      eventId: "00000000-0000-0000-0000-000000000000",
      binomioId,
      boxRequested: false,
    });
    expect(result).toEqual({ error: "not_found" });
  });

  it("returns no_slots when the prueba is full", async () => {
    const { eventId } = await createCompetitionWithEvent({ availableSlots: 0, totalSlots: 5 });
    const binomioId = await createBinomio();

    const result = await createRegistrationWithHold({ eventId, binomioId, boxRequested: false });
    expect(result).toEqual({ error: "no_slots" });
  });

  it("checks duplicate before capacity, so a re-submit while holding the last slot is 'duplicate' not 'no_slots'", async () => {
    const { eventId } = await createCompetitionWithEvent({ availableSlots: 1, totalSlots: 1 });
    const binomioId = await createBinomio();

    const first = await createRegistrationWithHold({ eventId, binomioId, boxRequested: false });
    expect("registrationId" in first).toBe(true);

    // available_slots is now 0 — a naive capacity-first check would say no_slots,
    // but this is the *same* binomio re-submitting, so it must be told "duplicate".
    const second = await createRegistrationWithHold({ eventId, binomioId, boxRequested: false });
    expect(second).toEqual({ error: "duplicate" });
  });

  it("allows re-registration after the prior registration was cancelled", async () => {
    const { eventId } = await createCompetitionWithEvent({ availableSlots: 2, totalSlots: 2 });
    const binomioId = await createBinomio();

    const first = await createRegistrationWithHold({ eventId, binomioId, boxRequested: false });
    if (!("registrationId" in first)) throw new Error("expected success");
    await cancelRegistrationAndReleaseSlot(first.registrationId);

    const second = await createRegistrationWithHold({ eventId, binomioId, boxRequested: false });
    expect("registrationId" in second).toBe(true);
  });

  it("is race-safe: concurrent duplicate submissions for a brand-new binomio only let one through", async () => {
    const { eventId } = await createCompetitionWithEvent({ availableSlots: 5, totalSlots: 5 });
    const binomioId = await createBinomio();

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        createRegistrationWithHold({ eventId, binomioId, boxRequested: false })
      )
    );

    const successes = results.filter((r) => "registrationId" in r);
    const duplicates = results.filter((r) => "error" in r && r.error === "duplicate");
    expect(successes).toHaveLength(1);
    expect(duplicates).toHaveLength(4);
  });
});

describe("cancelRegistrationAndReleaseSlot", () => {
  it("cancels a pending hold and releases its slot", async () => {
    const { eventId } = await createCompetitionWithEvent({ availableSlots: 3, totalSlots: 3 });
    const binomioId = await createBinomio();
    const created = await createRegistrationWithHold({ eventId, binomioId, boxRequested: false });
    if (!("registrationId" in created)) throw new Error("expected success");

    const released = await cancelRegistrationAndReleaseSlot(created.registrationId);
    expect(released).toBe(true);

    const pool = getPool();
    const { rows } = await pool.query("SELECT available_slots FROM events WHERE id = $1", [
      eventId,
    ]);
    expect(rows[0].available_slots).toBe(3);
  });

  it("is idempotent — a second call on the same registration is a no-op, no double-release", async () => {
    const { eventId } = await createCompetitionWithEvent({ availableSlots: 3, totalSlots: 3 });
    const binomioId = await createBinomio();
    const created = await createRegistrationWithHold({ eventId, binomioId, boxRequested: false });
    if (!("registrationId" in created)) throw new Error("expected success");

    const first = await cancelRegistrationAndReleaseSlot(created.registrationId);
    const second = await cancelRegistrationAndReleaseSlot(created.registrationId);
    expect(first).toBe(true);
    expect(second).toBe(false);

    const pool = getPool();
    const { rows } = await pool.query("SELECT available_slots FROM events WHERE id = $1", [
      eventId,
    ]);
    expect(rows[0].available_slots).toBe(3);
  });

  it("returns false for a registration that doesn't exist", async () => {
    const released = await cancelRegistrationAndReleaseSlot(
      "00000000-0000-0000-0000-000000000000"
    );
    expect(released).toBe(false);
  });

  it("does not release a slot for an already-confirmed registration", async () => {
    const { eventId } = await createCompetitionWithEvent({ availableSlots: 3, totalSlots: 3 });
    const binomioId = await createBinomio();
    const created = await createRegistrationWithHold({ eventId, binomioId, boxRequested: false });
    if (!("registrationId" in created)) throw new Error("expected success");
    await confirmRegistration(created.registrationId, "mp-payment-1");

    const released = await cancelRegistrationAndReleaseSlot(created.registrationId);
    expect(released).toBe(false);

    const pool = getPool();
    const { rows } = await pool.query("SELECT available_slots FROM events WHERE id = $1", [
      eventId,
    ]);
    expect(rows[0].available_slots).toBe(2);
  });
});

describe("releaseExpiredHolds", () => {
  it("releases only holds past their hold_expires_at, leaving live holds untouched", async () => {
    const { eventId } = await createCompetitionWithEvent({ availableSlots: 5, totalSlots: 5 });
    const expiredBinomio = await createBinomio({ participantEmail: "expired@test.local" });
    const liveBinomio = await createBinomio({ participantEmail: "live@test.local" });

    const expired = await createRegistrationWithHold({
      eventId,
      binomioId: expiredBinomio,
      boxRequested: false,
    });
    const live = await createRegistrationWithHold({
      eventId,
      binomioId: liveBinomio,
      boxRequested: false,
    });
    if (!("registrationId" in expired) || !("registrationId" in live)) {
      throw new Error("expected success");
    }

    const pool = getPool();
    await pool.query(
      "UPDATE registrations SET hold_expires_at = now() - interval '1 minute' WHERE id = $1",
      [expired.registrationId]
    );

    const releasedCount = await releaseExpiredHolds();
    expect(releasedCount).toBe(1);

    const { rows } = await pool.query(
      "SELECT id, status FROM registrations ORDER BY created_at"
    );
    const statuses = Object.fromEntries(rows.map((r) => [r.id, r.status]));
    expect(statuses[expired.registrationId]).toBe("cancelled");
    expect(statuses[live.registrationId]).toBe("pending_payment");

    const { rows: eventRows } = await pool.query(
      "SELECT available_slots FROM events WHERE id = $1",
      [eventId]
    );
    expect(eventRows[0].available_slots).toBe(4); // 5 - 2 holds + 1 released
  });
});

describe("confirmRegistration", () => {
  it("marks the registration confirmed and records the payment id", async () => {
    const { eventId } = await createCompetitionWithEvent();
    const binomioId = await createBinomio();
    const created = await createRegistrationWithHold({ eventId, binomioId, boxRequested: false });
    if (!("registrationId" in created)) throw new Error("expected success");

    await confirmRegistration(created.registrationId, "mp-payment-123");

    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT status, mp_payment_id, confirmed_at FROM registrations WHERE id = $1",
      [created.registrationId]
    );
    expect(rows[0].status).toBe("confirmed");
    expect(rows[0].mp_payment_id).toBe("mp-payment-123");
    expect(rows[0].confirmed_at).not.toBeNull();
  });
});

describe("getDebtForBinomio", () => {
  it("sums confirmed registrations' prueba price plus box price when requested", async () => {
    const { competitionId, dayId } = await createCompetitionWithEvent();
    const pool = getPool();
    const { rows: dayRows } = await pool.query(
      "SELECT competition_id FROM competition_days WHERE id = $1",
      [dayId]
    );
    expect(dayRows[0].competition_id).toBe(competitionId);

    const eventId = await createEvent(dayId, { priceArs: 1000000 });
    const binomioId = await createBinomio();

    const created = await createRegistrationWithHold({ eventId, binomioId, boxRequested: true });
    if (!("registrationId" in created)) throw new Error("expected success");
    await confirmRegistration(created.registrationId, "mp-payment-1");

    const debt = await getDebtForBinomio(competitionId, binomioId);
    expect(debt).not.toBeNull();
    expect(debt?.totalArs).toBe(1000000 + 500000); // prueba + box_price_ars from fixture default
    expect(debt?.paid).toBe(true);
    expect(debt?.items).toHaveLength(2);
  });

  it("returns null when the binomio has no confirmed registrations in the competition", async () => {
    const { competitionId } = await createCompetitionWithEvent();
    const binomioId = await createBinomio();
    const debt = await getDebtForBinomio(competitionId, binomioId);
    expect(debt).toBeNull();
  });

  it("marks paid false when a confirmed registration has no mp_payment_id yet", async () => {
    const { competitionId, eventId } = await createCompetitionWithEvent();
    const binomioId = await createBinomio();
    const created = await createRegistrationWithHold({ eventId, binomioId, boxRequested: false });
    if (!("registrationId" in created)) throw new Error("expected success");

    // Confirm status manually without a payment id, mirroring a data edge case.
    const pool = getPool();
    await pool.query(
      "UPDATE registrations SET status = 'confirmed', confirmed_at = now() WHERE id = $1",
      [created.registrationId]
    );

    const debt = await getDebtForBinomio(competitionId, binomioId);
    expect(debt?.paid).toBe(false);
  });
});

describe("bulkSetDrawOrder", () => {
  it("assigns draw_order to every registration in the batch", async () => {
    const { eventId } = await createCompetitionWithEvent({ availableSlots: 3, totalSlots: 3 });
    const binomioA = await createBinomio({ participantEmail: "a@test.local" });
    const binomioB = await createBinomio({ participantEmail: "b@test.local" });

    const regA = await createRegistrationWithHold({
      eventId,
      binomioId: binomioA,
      boxRequested: false,
    });
    const regB = await createRegistrationWithHold({
      eventId,
      binomioId: binomioB,
      boxRequested: false,
    });
    if (!("registrationId" in regA) || !("registrationId" in regB)) {
      throw new Error("expected success");
    }

    await bulkSetDrawOrder([
      { registrationId: regA.registrationId, drawOrder: 2 },
      { registrationId: regB.registrationId, drawOrder: 1 },
    ]);

    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT id, draw_order FROM registrations ORDER BY draw_order"
    );
    expect(rows[0].id).toBe(regB.registrationId);
    expect(rows[0].draw_order).toBe(1);
    expect(rows[1].id).toBe(regA.registrationId);
    expect(rows[1].draw_order).toBe(2);
  });

  it("is a no-op for an empty batch", async () => {
    await expect(bulkSetDrawOrder([])).resolves.toBeUndefined();
  });
});
