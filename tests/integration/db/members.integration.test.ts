import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDbPool, resetDb } from "../db";
import {
  createMember,
  createMemberDebts,
  getDebtWithMember,
  getMemberWithDebts,
  getPendingMemberDebtTotal,
  markDebtPaid,
} from "@/lib/db/queries/members";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDbPool();
});

describe("createMember", () => {
  it("creates a member", async () => {
    const result = await createMember({
      name: "María Gómez",
      email: "maria@test.local",
      memberNumber: "SOC-001",
    });
    expect("member" in result).toBe(true);
  });

  it("reports duplicate on a repeated email", async () => {
    await createMember({ name: "María Gómez", email: "maria@test.local", memberNumber: "SOC-001" });
    const result = await createMember({
      name: "Otra Persona",
      email: "maria@test.local",
      memberNumber: "SOC-002",
    });
    expect(result).toEqual({ error: "duplicate" });
  });

  it("reports duplicate on a repeated member_number", async () => {
    await createMember({ name: "María Gómez", email: "maria@test.local", memberNumber: "SOC-001" });
    const result = await createMember({
      name: "Otra Persona",
      email: "otra@test.local",
      memberNumber: "SOC-001",
    });
    expect(result).toEqual({ error: "duplicate" });
  });
});

describe("markDebtPaid", () => {
  async function createMemberWithDebt() {
    const memberResult = await createMember({
      name: "María Gómez",
      email: "maria@test.local",
      memberNumber: "SOC-001",
    });
    if (!("member" in memberResult)) throw new Error("expected success");
    const [debt] = await createMemberDebts(memberResult.member.id, [
      { concept: "cuota", amountArs: 500000, dueDate: "2026-02-01" },
    ]);
    return { member: memberResult.member, debt };
  }

  it("marks a debt paid and records the payment id", async () => {
    const { debt } = await createMemberWithDebt();

    const firstConfirmation = await markDebtPaid(debt.id, "mp-payment-1");
    expect(firstConfirmation).toBe(true);

    const found = await getDebtWithMember(debt.id);
    expect(found?.debt.paidAt).not.toBeNull();
    expect(found?.debt.mpPaymentId).toBe("mp-payment-1");
  });

  it("is idempotent — a webhook retry on an already-paid debt returns false and keeps the original payment id", async () => {
    const { debt } = await createMemberWithDebt();

    const first = await markDebtPaid(debt.id, "mp-payment-1");
    const retry = await markDebtPaid(debt.id, "mp-payment-DIFFERENT");

    expect(first).toBe(true);
    expect(retry).toBe(false);

    const found = await getDebtWithMember(debt.id);
    expect(found?.debt.mpPaymentId).toBe("mp-payment-1");
  });

  it("returns false for a non-existent debt", async () => {
    const result = await markDebtPaid("00000000-0000-0000-0000-000000000000", "mp-payment-1");
    expect(result).toBe(false);
  });
});

describe("getMemberWithDebts / getPendingMemberDebtTotal", () => {
  it("computes pendingTotalArs from only the unpaid debts", async () => {
    const memberResult = await createMember({
      name: "María Gómez",
      email: "maria@test.local",
      memberNumber: "SOC-001",
    });
    if (!("member" in memberResult)) throw new Error("expected success");
    const [cuota] = await createMemberDebts(memberResult.member.id, [
      { concept: "cuota", amountArs: 500000, dueDate: "2026-02-01" },
      { concept: "pension", amountArs: 300000, dueDate: "2026-02-01" },
    ]);
    await markDebtPaid(cuota.id, "mp-payment-1");

    const withDebts = await getMemberWithDebts(memberResult.member.id);
    expect(withDebts?.pendingTotalArs).toBe(300000);

    const globalTotal = await getPendingMemberDebtTotal();
    expect(globalTotal).toBe(300000);
  });

  it("returns null for a non-existent member", async () => {
    const found = await getMemberWithDebts("00000000-0000-0000-0000-000000000000");
    expect(found).toBeNull();
  });
});
