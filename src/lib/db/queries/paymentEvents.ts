import { getPool } from "../client";

export type PaymentEventSource = "registration" | "member_debt";

/**
 * Records an approved Mercado Pago payment in the `payment_events` ledger —
 * the append-only feed the Fase 4 treasury dashboard aggregates over. Called
 * only from the webhook; a retry for an already-recorded payment id is a
 * no-op thanks to the unique index on `mp_payment_id` + ON CONFLICT.
 */
export async function insertPaymentEvent(params: {
  source: PaymentEventSource;
  sourceId: string;
  amountArs: number;
  mpPaymentId: string;
}): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO payment_events (source, source_id, amount_ars, mp_payment_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (mp_payment_id) DO NOTHING`,
    [params.source, params.sourceId, params.amountArs, params.mpPaymentId]
  );
}

export interface DashboardTotals {
  /** Centavos ARS cobrados en total (todas las fuentes). */
  totalCollectedArs: number;
  collectedRegistrationsArs: number;
  collectedMemberDebtsArs: number;
  paymentsCount: number;
}

/** Aggregates the `payment_events` ledger into the dashboard's headline totals. */
export async function getDashboardTotals(): Promise<DashboardTotals> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(amount_ars), 0)::bigint AS total,
       COALESCE(SUM(amount_ars) FILTER (WHERE source = 'registration'), 0)::bigint AS registrations,
       COALESCE(SUM(amount_ars) FILTER (WHERE source = 'member_debt'), 0)::bigint AS member_debts,
       COUNT(*)::int AS payments_count
     FROM payment_events`
  );
  const row = rows[0];
  return {
    totalCollectedArs: Number(row.total),
    collectedRegistrationsArs: Number(row.registrations),
    collectedMemberDebtsArs: Number(row.member_debts),
    paymentsCount: row.payments_count,
  };
}

export interface RecentPayment {
  source: PaymentEventSource;
  amountArs: number;
  mpPaymentId: string;
  receivedAt: string;
  /** "Jinete / Caballo" para inscripciones, "Nombre (n° socio)" para deudas. */
  payerLabel: string;
}

/**
 * Lists the most recent approved payments with a human-readable payer label,
 * resolved against `registrations`/`binomios` or `members` depending on the
 * event's source.
 */
export async function listRecentPayments(limit: number): Promise<RecentPayment[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       pe.source,
       pe.amount_ars,
       pe.mp_payment_id,
       pe.received_at,
       CASE pe.source
         WHEN 'registration' THEN (
           SELECT b.participant_name || ' / ' || b.horse_name
           FROM registrations r JOIN binomios b ON b.id = r.binomio_id
           WHERE r.id = pe.source_id
         )
         WHEN 'member_debt' THEN (
           SELECT m.name || ' (' || m.member_number || ')'
           FROM member_debts d JOIN members m ON m.id = d.member_id
           WHERE d.id = pe.source_id
         )
       END AS payer_label
     FROM payment_events pe
     ORDER BY pe.received_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((row) => ({
    source: row.source,
    amountArs: row.amount_ars,
    mpPaymentId: row.mp_payment_id,
    receivedAt: row.received_at,
    payerLabel: row.payer_label ?? "—",
  }));
}
