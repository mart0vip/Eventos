import { beforeEach, describe, expect, it, vi } from "vitest";

const preferenceCreateMock = vi.fn();
const paymentGetMock = vi.fn();

vi.mock("mercadopago", async (importOriginal) => {
  const actual = await importOriginal<typeof import("mercadopago")>();
  return {
    ...actual,
    MercadoPagoConfig: vi.fn().mockImplementation(function MercadoPagoConfig() {
      return {};
    }),
    Preference: vi.fn().mockImplementation(function Preference() {
      return { create: preferenceCreateMock };
    }),
    Payment: vi.fn().mockImplementation(function Payment() {
      return { get: paymentGetMock };
    }),
  };
});

import {
  createCheckoutPreference,
  createDebtCheckoutPreference,
  getPayment,
} from "@/lib/mercadopago";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createCheckoutPreference", () => {
  it("creates a preference with the prueba fee and returns the checkout URL", async () => {
    preferenceCreateMock.mockResolvedValue({
      id: "pref-1",
      init_point: "https://mercadopago.test/checkout/pref-1",
    });

    const result = await createCheckoutPreference({
      registrationId: "reg-1",
      eventName: "Prueba 1",
      competitionTitle: "Concurso Test",
      participantEmail: "juan@test.local",
      priceArs: 1000000,
      boxPriceArs: 0,
      horseName: "Relámpago",
      participantName: "Juan Pérez",
    });

    expect(result).toEqual({
      preferenceId: "pref-1",
      checkoutUrl: "https://mercadopago.test/checkout/pref-1",
    });
    const body = preferenceCreateMock.mock.calls[0][0].body;
    expect(body.items).toHaveLength(1);
    expect(body.marketplace_fee).toBe(0);
    expect(body.external_reference).toBe("reg-1");
  });

  it("adds a second line item when a box is requested", async () => {
    preferenceCreateMock.mockResolvedValue({
      id: "pref-1",
      init_point: "https://mercadopago.test/checkout/pref-1",
    });

    await createCheckoutPreference({
      registrationId: "reg-1",
      eventName: "Prueba 1",
      competitionTitle: "Concurso Test",
      participantEmail: "juan@test.local",
      priceArs: 1000000,
      boxPriceArs: 500000,
      horseName: "Relámpago",
      participantName: "Juan Pérez",
    });

    const body = preferenceCreateMock.mock.calls[0][0].body;
    expect(body.items).toHaveLength(2);
    expect(body.items[1].title).toBe("Reserva de box");
  });

  it("throws when Mercado Pago doesn't return an id/init_point", async () => {
    preferenceCreateMock.mockResolvedValue({});

    await expect(
      createCheckoutPreference({
        registrationId: "reg-1",
        eventName: "Prueba 1",
        competitionTitle: "Concurso Test",
        participantEmail: "juan@test.local",
        priceArs: 1000000,
        boxPriceArs: 0,
        horseName: "Relámpago",
        participantName: "Juan Pérez",
      })
    ).rejects.toThrow();
  });
});

describe("createDebtCheckoutPreference", () => {
  it("creates a preference for the debt with a member_debt: external_reference", async () => {
    preferenceCreateMock.mockResolvedValue({
      id: "pref-2",
      init_point: "https://mercadopago.test/checkout/pref-2",
    });

    const result = await createDebtCheckoutPreference({
      debtId: "debt-1",
      memberId: "member-1",
      memberName: "María Gómez",
      memberEmail: "maria@test.local",
      conceptLabel: "Cuota social",
      dueDate: "2026-02-01",
      amountArs: 500000,
    });

    expect(result.checkoutUrl).toBe("https://mercadopago.test/checkout/pref-2");
    const body = preferenceCreateMock.mock.calls[0][0].body;
    expect(body.external_reference).toBe("member_debt:debt-1");
    expect(body.expires).toBeUndefined();
  });
});

describe("getPayment", () => {
  it("fetches a payment by id", async () => {
    paymentGetMock.mockResolvedValue({ id: 999, status: "approved" });
    const payment = await getPayment("999");
    expect(payment).toEqual({ id: 999, status: "approved" });
    expect(paymentGetMock).toHaveBeenCalledWith({ id: "999" });
  });
});
