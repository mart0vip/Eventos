import { describe, expect, it } from "vitest";
import {
  mapBinomioRow,
  mapCompetitionDayRow,
  mapCompetitionRow,
  mapMemberDebtRow,
  mapMemberRow,
  mapPruebaRow,
  mapRegistrationRow,
  mapWaitlistRow,
} from "@/lib/db/mappers";

describe("mapCompetitionRow", () => {
  it("maps snake_case to camelCase and defaults null description", () => {
    const mapped = mapCompetitionRow({
      id: "comp-1",
      title: "Concurso",
      date_from: "2026-09-05",
      date_to: "2026-09-06",
      location: "CHA",
      description: null,
      status: "open",
      box_price_ars: 500000,
      created_at: "2026-01-01T00:00:00.000Z",
    });
    expect(mapped).toEqual({
      id: "comp-1",
      title: "Concurso",
      dateFrom: "2026-09-05",
      dateTo: "2026-09-06",
      location: "CHA",
      description: null,
      status: "open",
      boxPriceArs: 500000,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });
});

describe("mapCompetitionDayRow", () => {
  it("maps snake_case to camelCase", () => {
    const mapped = mapCompetitionDayRow({
      id: "day-1",
      competition_id: "comp-1",
      day_date: "2026-09-05",
      day_label: "Día 1",
      sort_order: 0,
    });
    expect(mapped).toEqual({
      id: "day-1",
      competitionId: "comp-1",
      dayDate: "2026-09-05",
      dayLabel: "Día 1",
      sortOrder: 0,
    });
  });
});

describe("mapPruebaRow", () => {
  it("maps snake_case to camelCase", () => {
    const mapped = mapPruebaRow({
      id: "event-1",
      day_id: "day-1",
      name: "Prueba 1",
      category: "Salto 1.10m",
      price_ars: 1000000,
      total_slots: 10,
      available_slots: 8,
      draw_done: false,
      created_at: "2026-01-01T00:00:00.000Z",
    });
    expect(mapped).toEqual({
      id: "event-1",
      dayId: "day-1",
      name: "Prueba 1",
      category: "Salto 1.10m",
      priceArs: 1000000,
      totalSlots: 10,
      availableSlots: 8,
      drawDone: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });
});

describe("mapBinomioRow", () => {
  it("defaults null license_number", () => {
    const mapped = mapBinomioRow({
      id: "binomio-1",
      participant_name: "Juan Pérez",
      participant_email: "juan@test.local",
      horse_name: "Relámpago",
      license_number: null,
      created_at: "2026-01-01T00:00:00.000Z",
    });
    expect(mapped.licenseNumber).toBeNull();
  });
});

describe("mapRegistrationRow", () => {
  it("defaults null fields for a pending registration", () => {
    const mapped = mapRegistrationRow({
      id: "reg-1",
      event_id: "event-1",
      binomio_id: "binomio-1",
      box_requested: true,
      draw_order: null,
      status: "pending_payment",
      hold_expires_at: "2026-01-01T00:15:00.000Z",
      mp_preference_id: null,
      mp_payment_id: null,
      created_at: "2026-01-01T00:00:00.000Z",
      confirmed_at: null,
    });
    expect(mapped.drawOrder).toBeNull();
    expect(mapped.mpPreferenceId).toBeNull();
    expect(mapped.mpPaymentId).toBeNull();
    expect(mapped.confirmedAt).toBeNull();
    expect(mapped.boxRequested).toBe(true);
  });
});

describe("mapWaitlistRow", () => {
  it("defaults null notified_at", () => {
    const mapped = mapWaitlistRow({
      id: "waitlist-1",
      event_id: "event-1",
      binomio_id: "binomio-1",
      created_at: "2026-01-01T00:00:00.000Z",
      notified_at: null,
    });
    expect(mapped.notifiedAt).toBeNull();
  });
});

describe("mapMemberRow", () => {
  it("maps snake_case to camelCase", () => {
    const mapped = mapMemberRow({
      id: "member-1",
      name: "María Gómez",
      email: "maria@test.local",
      member_number: "SOC-001",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    expect(mapped).toEqual({
      id: "member-1",
      name: "María Gómez",
      email: "maria@test.local",
      memberNumber: "SOC-001",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });
});

describe("mapMemberDebtRow", () => {
  it("defaults null paid_at/mp fields for an unpaid debt", () => {
    const mapped = mapMemberDebtRow({
      id: "debt-1",
      member_id: "member-1",
      concept: "cuota",
      amount_ars: 500000,
      due_date: "2026-02-01",
      paid_at: null,
      mp_preference_id: null,
      mp_payment_id: null,
      created_at: "2026-01-01T00:00:00.000Z",
    });
    expect(mapped.paidAt).toBeNull();
    expect(mapped.mpPreferenceId).toBeNull();
    expect(mapped.mpPaymentId).toBeNull();
  });
});
