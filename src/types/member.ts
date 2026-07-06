/**
 * Postgres-backed domain types for the Fase 2 "Portal de socios" build.
 * Follows the same conventions as src/types/competition.ts: DATE-only columns
 * are ISO strings parsed with date-fns' parseISO(), and money is centavos ARS.
 */

export interface Member {
  id: string;
  name: string;
  email: string;
  memberNumber: string;
  createdAt: string;
}

export type DebtConcept = "cuota" | "pension" | "ropero" | "otro";

export interface MemberDebt {
  id: string;
  memberId: string;
  concept: DebtConcept;
  /** Centavos ARS. */
  amountArs: number;
  /** DATE-only ISO string — parse with parseISO(). */
  dueDate: string;
  paidAt: string | null;
  mpPreferenceId: string | null;
  mpPaymentId: string | null;
  createdAt: string;
}

export interface MemberWithDebts extends Member {
  debts: MemberDebt[];
  /** Centavos ARS — suma de deudas sin paid_at. */
  pendingTotalArs: number;
}
