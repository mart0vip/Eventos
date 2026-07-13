import { describe, expect, it } from "vitest";
import { createRegistrationSchema } from "@/lib/validation/registration";

const validBody = {
  eventId: "123e4567-e89b-12d3-a456-426614174000",
  participantName: "Juan Pérez",
  participantEmail: "juan@test.local",
  horseName: "Relámpago",
  boxRequested: true,
};

describe("createRegistrationSchema", () => {
  it("accepts a valid body", () => {
    expect(createRegistrationSchema.safeParse(validBody).success).toBe(true);
  });

  it("accepts an optional licenseNumber", () => {
    const result = createRegistrationSchema.safeParse({ ...validBody, licenseNumber: "LIC-1" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID eventId", () => {
    const result = createRegistrationSchema.safeParse({ ...validBody, eventId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = createRegistrationSchema.safeParse({
      ...validBody,
      participantEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty participantName", () => {
    const result = createRegistrationSchema.safeParse({ ...validBody, participantName: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects a missing boxRequested", () => {
    const rest: Partial<typeof validBody> = { ...validBody };
    delete rest.boxRequested;
    const result = createRegistrationSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
