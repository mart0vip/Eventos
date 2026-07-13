import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildMemberDebtReference,
  parseExternalReference,
  verifyWebhookSignature,
} from "@/lib/mercadopago";

const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET!;

/**
 * Hand-computes a valid Mercado Pago webhook signature the same way their
 * servers do: HMAC-SHA256 over "id:{dataId};request-id:{requestId};ts:{ts};",
 * formatted as the SDK expects it in the `x-signature` header (`ts=..,v1=..`).
 */
function signManifest(params: { dataId: string; requestId: string; ts: number }): string {
  const manifest = `id:${params.dataId};request-id:${params.requestId};ts:${params.ts};`;
  const hash = createHmac("sha256", WEBHOOK_SECRET).update(manifest).digest("hex");
  return `ts=${params.ts},v1=${hash}`;
}

describe("verifyWebhookSignature", () => {
  it("accepts a validly-signed webhook", () => {
    const ts = Date.now();
    const xSignature = signManifest({ dataId: "123", requestId: "req-1", ts });

    const result = verifyWebhookSignature({
      xSignature,
      xRequestId: "req-1",
      dataId: "123",
    });

    expect(result).toEqual({ valid: true });
  });

  it("rejects a tampered signature (wrong hash)", () => {
    const ts = Date.now();
    const xSignature = `ts=${ts},v1=${"0".repeat(64)}`;

    const result = verifyWebhookSignature({
      xSignature,
      xRequestId: "req-1",
      dataId: "123",
    });

    expect(result.valid).toBe(false);
  });

  it("rejects a signature computed with the wrong dataId (payload swap)", () => {
    const ts = Date.now();
    const xSignature = signManifest({ dataId: "999", requestId: "req-1", ts });

    const result = verifyWebhookSignature({
      xSignature,
      xRequestId: "req-1",
      dataId: "123", // attacker/bug changed the id after signing
    });

    expect(result.valid).toBe(false);
  });

  it("rejects an expired timestamp outside the 300s tolerance window", () => {
    const ts = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    const xSignature = signManifest({ dataId: "123", requestId: "req-1", ts });

    const result = verifyWebhookSignature({
      xSignature,
      xRequestId: "req-1",
      dataId: "123",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("TimestampOutOfTolerance");
  });

  it("rejects a missing x-signature header", () => {
    const result = verifyWebhookSignature({
      xSignature: null,
      xRequestId: "req-1",
      dataId: "123",
    });

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("MissingSignatureHeader");
  });

  it("rejects a malformed x-signature header", () => {
    const result = verifyWebhookSignature({
      xSignature: "not-a-valid-header",
      xRequestId: "req-1",
      dataId: "123",
    });

    expect(result.valid).toBe(false);
  });
});

describe("parseExternalReference / buildMemberDebtReference", () => {
  it("parses a bare UUID as a registration reference", () => {
    const parsed = parseExternalReference("abc-123");
    expect(parsed).toEqual({ kind: "registration", registrationId: "abc-123" });
  });

  it("parses a member_debt:-prefixed reference as a member debt", () => {
    const parsed = parseExternalReference("member_debt:debt-456");
    expect(parsed).toEqual({ kind: "member_debt", debtId: "debt-456" });
  });

  it("buildMemberDebtReference round-trips through parseExternalReference", () => {
    const reference = buildMemberDebtReference("debt-789");
    expect(parseExternalReference(reference)).toEqual({
      kind: "member_debt",
      debtId: "debt-789",
    });
  });
});
