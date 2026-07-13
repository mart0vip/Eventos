import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return { emails: { send: sendMock } };
  }),
}));

import {
  buildConfirmationHtml,
  buildMemberDebtReceiptHtml,
  sendConfirmationEmail,
  sendMemberDebtReceiptEmail,
} from "@/lib/email";

beforeEach(() => {
  sendMock.mockClear();
});

describe("buildConfirmationHtml", () => {
  it("includes the participant, horse, and formatted amount", () => {
    const html = buildConfirmationHtml({
      to: "juan@test.local",
      participantName: "Juan Pérez",
      horseName: "Relámpago",
      competitionTitle: "Concurso de Primavera",
      competitionDate: "2026-09-05",
      eventName: "Prueba 1",
      drawOrder: 7,
      boxRequested: true,
      amountPaidArs: 1000000,
      mpPaymentId: "mp-123",
    });

    expect(html).toContain("Juan Pérez");
    expect(html).toContain("Relámpago");
    expect(html).toContain("Concurso de Primavera");
    expect(html).toContain("mp-123");
    expect(html).toContain("Orden de sorteo");
    expect(html).toContain("Box reservado");
  });

  it("omits the draw-order row when drawOrder is null", () => {
    const html = buildConfirmationHtml({
      to: "juan@test.local",
      participantName: "Juan Pérez",
      horseName: "Relámpago",
      competitionTitle: "Concurso de Primavera",
      competitionDate: "2026-09-05",
      eventName: "Prueba 1",
      drawOrder: null,
      boxRequested: false,
      amountPaidArs: 1000000,
      mpPaymentId: "mp-123",
    });

    expect(html).not.toContain("Orden de sorteo");
  });
});

describe("buildMemberDebtReceiptHtml", () => {
  it("includes the member, concept, and due date", () => {
    const html = buildMemberDebtReceiptHtml({
      to: "maria@test.local",
      memberName: "María Gómez",
      memberNumber: "SOC-001",
      conceptLabel: "Cuota social",
      dueDate: "2026-02-01",
      amountPaidArs: 500000,
      mpPaymentId: "mp-456",
    });

    expect(html).toContain("María Gómez");
    expect(html).toContain("SOC-001");
    expect(html).toContain("Cuota social");
    expect(html).toContain("mp-456");
  });
});

describe("sendConfirmationEmail", () => {
  it("sends via Resend with the confirmation subject", async () => {
    await sendConfirmationEmail({
      to: "juan@test.local",
      participantName: "Juan Pérez",
      horseName: "Relámpago",
      competitionTitle: "Concurso de Primavera",
      competitionDate: "2026-09-05",
      eventName: "Prueba 1",
      drawOrder: null,
      boxRequested: false,
      amountPaidArs: 1000000,
      mpPaymentId: "mp-123",
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe("juan@test.local");
    expect(call.subject).toContain("Concurso de Primavera");
  });
});

describe("sendMemberDebtReceiptEmail", () => {
  it("sends via Resend with the receipt subject", async () => {
    await sendMemberDebtReceiptEmail({
      to: "maria@test.local",
      memberName: "María Gómez",
      memberNumber: "SOC-001",
      conceptLabel: "Cuota social",
      dueDate: "2026-02-01",
      amountPaidArs: 500000,
      mpPaymentId: "mp-456",
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe("maria@test.local");
    expect(call.subject).toContain("Cuota social");
  });
});
