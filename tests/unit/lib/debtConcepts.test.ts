import { describe, expect, it } from "vitest";
import { debtConceptLabel } from "@/lib/debtConcepts";

describe("debtConceptLabel", () => {
  it.each([
    ["cuota", "Cuota social"],
    ["pension", "Pensión"],
    ["ropero", "Ropero"],
    ["otro", "Otro concepto"],
  ] as const)("maps %s to %s", (concept, label) => {
    expect(debtConceptLabel(concept)).toBe(label);
  });
});
