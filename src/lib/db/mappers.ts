import {
  Binomio,
  Competition,
  CompetitionDay,
  Prueba,
  Registration,
  WaitlistEntry,
} from "@/types/competition";
import { Member, MemberDebt } from "@/types/member";

/** Maps a raw `competitions` row (snake_case) to the `Competition` domain type. */
export function mapCompetitionRow(row: Record<string, unknown>): Competition {
  return {
    id: row.id as string,
    title: row.title as string,
    dateFrom: row.date_from as string,
    dateTo: row.date_to as string,
    location: row.location as string,
    description: (row.description as string | null) ?? null,
    status: row.status as Competition["status"],
    boxPriceArs: row.box_price_ars as number,
    createdAt: row.created_at as string,
  };
}

/** Maps a raw `competition_days` row to the `CompetitionDay` domain type. */
export function mapCompetitionDayRow(row: Record<string, unknown>): CompetitionDay {
  return {
    id: row.id as string,
    competitionId: row.competition_id as string,
    dayDate: row.day_date as string,
    dayLabel: row.day_label as string,
    sortOrder: row.sort_order as number,
  };
}

/** Maps a raw `events` (prueba) row to the `Prueba` domain type. */
export function mapPruebaRow(row: Record<string, unknown>): Prueba {
  return {
    id: row.id as string,
    dayId: row.day_id as string,
    name: row.name as string,
    category: row.category as string,
    priceArs: row.price_ars as number,
    totalSlots: row.total_slots as number,
    availableSlots: row.available_slots as number,
    drawDone: row.draw_done as boolean,
    createdAt: row.created_at as string,
  };
}

/** Maps a raw `binomios` row to the `Binomio` domain type. */
export function mapBinomioRow(row: Record<string, unknown>): Binomio {
  return {
    id: row.id as string,
    participantName: row.participant_name as string,
    participantEmail: row.participant_email as string,
    horseName: row.horse_name as string,
    licenseNumber: (row.license_number as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

/** Maps a raw `registrations` row to the `Registration` domain type. */
export function mapRegistrationRow(row: Record<string, unknown>): Registration {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    binomioId: row.binomio_id as string,
    boxRequested: row.box_requested as boolean,
    drawOrder: (row.draw_order as number | null) ?? null,
    status: row.status as Registration["status"],
    holdExpiresAt: (row.hold_expires_at as string | null) ?? null,
    mpPreferenceId: (row.mp_preference_id as string | null) ?? null,
    mpPaymentId: (row.mp_payment_id as string | null) ?? null,
    createdAt: row.created_at as string,
    confirmedAt: (row.confirmed_at as string | null) ?? null,
  };
}

/** Maps a raw `waitlist` row to the `WaitlistEntry` domain type. */
export function mapWaitlistRow(row: Record<string, unknown>): WaitlistEntry {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    binomioId: row.binomio_id as string,
    createdAt: row.created_at as string,
    notifiedAt: (row.notified_at as string | null) ?? null,
  };
}

/** Maps a raw `members` row to the `Member` domain type. */
export function mapMemberRow(row: Record<string, unknown>): Member {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    memberNumber: row.member_number as string,
    createdAt: row.created_at as string,
  };
}

/** Maps a raw `member_debts` row to the `MemberDebt` domain type. */
export function mapMemberDebtRow(row: Record<string, unknown>): MemberDebt {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    concept: row.concept as MemberDebt["concept"],
    amountArs: row.amount_ars as number,
    dueDate: row.due_date as string,
    paidAt: (row.paid_at as string | null) ?? null,
    mpPreferenceId: (row.mp_preference_id as string | null) ?? null,
    mpPaymentId: (row.mp_payment_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}
