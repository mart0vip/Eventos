/**
 * Postgres-backed domain types for the Fase 1 "Sistema de Concursos" build.
 * Distinct from src/types/event.ts, which is the pre-existing localStorage-based
 * Event/Registration model for the old English-language app — the two coexist and
 * are never migrated into one another. If a file ever needs both `Registration`
 * types, alias one import, e.g.
 * `import { Registration as LegacyRegistration } from "@/types/event"`.
 */

export type CompetitionStatus = "draft" | "open" | "closed" | "cancelled";

export interface Competition {
  id: string;
  title: string;
  /** DATE-only ISO string (e.g. "2026-08-01") — always parse with date-fns' parseISO(). */
  dateFrom: string;
  dateTo: string;
  location: string;
  description: string | null;
  status: CompetitionStatus;
  /** Centavos ARS. */
  boxPriceArs: number;
  createdAt: string;
}

export interface CompetitionDay {
  id: string;
  competitionId: string;
  /** DATE-only ISO string — parse with parseISO(). */
  dayDate: string;
  dayLabel: string;
  sortOrder: number;
}

/**
 * A "prueba" — the DB table is named `events` per the source spec, but the TS type
 * is named `Prueba` to avoid colliding with the existing `Event` type in
 * src/types/event.ts.
 */
export interface Prueba {
  id: string;
  dayId: string;
  name: string;
  category: string;
  /** Centavos ARS. */
  priceArs: number;
  totalSlots: number;
  availableSlots: number;
  drawDone: boolean;
  createdAt: string;
}

export interface Binomio {
  id: string;
  participantName: string;
  participantEmail: string;
  horseName: string;
  licenseNumber: string | null;
  createdAt: string;
}

export type RegistrationStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "waitlisted";

export interface Registration {
  id: string;
  eventId: string;
  binomioId: string;
  boxRequested: boolean;
  drawOrder: number | null;
  status: RegistrationStatus;
  holdExpiresAt: string | null;
  mpPreferenceId: string | null;
  mpPaymentId: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

export interface WaitlistEntry {
  id: string;
  eventId: string;
  binomioId: string;
  createdAt: string;
  notifiedAt: string | null;
}

export interface CompetitionDayWithPruebas extends CompetitionDay {
  pruebas: Prueba[];
}

export interface CompetitionWithDetail extends Competition {
  days: CompetitionDayWithPruebas[];
}
