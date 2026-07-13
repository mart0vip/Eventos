import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDbPool, resetDb } from "../db";
import { createBinomio, createCompetitionWithEvent } from "../fixtures";
import { getDashboardTotals, insertPaymentEvent, listRecentPayments } from "@/lib/db/queries/paymentEvents";
import { createRegistrationWithHold } from "@/lib/db/queries/registrations";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDbPool();
});

describe("insertPaymentEvent", () => {
  it("inserts a new payment event", async () => {
    await insertPaymentEvent({
      source: "registration",
      sourceId: "00000000-0000-0000-0000-000000000000",
      amountArs: 1000000,
      mpPaymentId: "mp-1",
    });

    const totals = await getDashboardTotals();
    expect(totals.totalCollectedArs).toBe(1000000);
    expect(totals.paymentsCount).toBe(1);
  });

  it("is idempotent — a webhook retry with the same mp_payment_id does not double-count", async () => {
    const params = {
      source: "registration" as const,
      sourceId: "00000000-0000-0000-0000-000000000000",
      amountArs: 1000000,
      mpPaymentId: "mp-retry-1",
    };

    await insertPaymentEvent(params);
    await insertPaymentEvent(params); // simulates Mercado Pago's webhook retry

    const totals = await getDashboardTotals();
    expect(totals.totalCollectedArs).toBe(1000000);
    expect(totals.paymentsCount).toBe(1);
  });
});

describe("getDashboardTotals", () => {
  it("splits totals by source (registration vs member_debt)", async () => {
    await insertPaymentEvent({
      source: "registration",
      sourceId: "00000000-0000-0000-0000-000000000000",
      amountArs: 1000000,
      mpPaymentId: "mp-reg-1",
    });
    await insertPaymentEvent({
      source: "member_debt",
      sourceId: "00000000-0000-0000-0000-000000000000",
      amountArs: 250000,
      mpPaymentId: "mp-debt-1",
    });

    const totals = await getDashboardTotals();
    expect(totals.collectedRegistrationsArs).toBe(1000000);
    expect(totals.collectedMemberDebtsArs).toBe(250000);
    expect(totals.totalCollectedArs).toBe(1250000);
    expect(totals.paymentsCount).toBe(2);
  });

  it("returns zeroed totals when the ledger is empty", async () => {
    const totals = await getDashboardTotals();
    expect(totals).toEqual({
      totalCollectedArs: 0,
      collectedRegistrationsArs: 0,
      collectedMemberDebtsArs: 0,
      paymentsCount: 0,
    });
  });
});

describe("listRecentPayments", () => {
  it("resolves a human-readable payer label for a registration payment", async () => {
    const { eventId } = await createCompetitionWithEvent();
    const binomioId = await createBinomio({
      participantName: "Juan Pérez",
      horseName: "Relámpago",
    });
    const created = await createRegistrationWithHold({ eventId, binomioId, boxRequested: false });
    if (!("registrationId" in created)) throw new Error("expected success");

    await insertPaymentEvent({
      source: "registration",
      sourceId: created.registrationId,
      amountArs: 1000000,
      mpPaymentId: "mp-1",
    });

    const recent = await listRecentPayments(10);
    expect(recent).toHaveLength(1);
    expect(recent[0].payerLabel).toBe("Juan Pérez / Relámpago");
    expect(recent[0].mpPaymentId).toBe("mp-1");
  });

  it("respects the limit and orders by most recent first", async () => {
    for (let i = 0; i < 3; i++) {
      await insertPaymentEvent({
        source: "registration",
        sourceId: "00000000-0000-0000-0000-000000000000",
        amountArs: 1000,
        mpPaymentId: `mp-${i}`,
      });
    }

    const recent = await listRecentPayments(2);
    expect(recent).toHaveLength(2);
  });
});
