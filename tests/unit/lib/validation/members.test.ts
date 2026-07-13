import { describe, expect, it } from "vitest";
import { createDebtsSchema, createMemberSchema } from "@/lib/validation/members";

describe("createMemberSchema", () => {
  const valid = { name: "María Gómez", email: "maria@test.local", memberNumber: "SOC-001" };

  it("accepts a valid body", () => {
    expect(createMemberSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = createMemberSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty memberNumber", () => {
    const result = createMemberSchema.safeParse({ ...valid, memberNumber: "  " });
    expect(result.success).toBe(false);
  });
});

describe("createDebtsSchema", () => {
  const validDebt = { concept: "cuota", amountArs: 500000, dueDate: "2026-02-01" };

  it("accepts one or more valid debts", () => {
    const result = createDebtsSchema.safeParse({ debts: [validDebt] });
    expect(result.success).toBe(true);
  });

  it("rejects an empty debts array", () => {
    const result = createDebtsSchema.safeParse({ debts: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid concept", () => {
    const result = createDebtsSchema.safeParse({
      debts: [{ ...validDebt, concept: "invalid" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive amountArs", () => {
    const result = createDebtsSchema.safeParse({
      debts: [{ ...validDebt, amountArs: 0 }],
    });
    expect(result.success).toBe(false);
  });
});
