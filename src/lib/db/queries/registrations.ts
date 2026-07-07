import { getPool } from "../client";
import { mapRegistrationRow } from "../mappers";
import { Registration } from "@/types/competition";

export type CreateRegistrationWithHoldResult =
  | { registrationId: string; holdExpiresAt: string }
  | { error: "no_slots" | "duplicate" | "not_found" };

/**
 * Creates a `pending_payment` registration and decrements the prueba's
 * `available_slots`, atomically. Locks the `events` row with `SELECT ... FOR
 * UPDATE` so concurrent registrations against the same prueba can't both pass the
 * slots-remaining check (constraint: all `available_slots` mutations must happen
 * inside a transaction guarded this way).
 *
 * Returns `{ error: 'not_found' }` if `eventId` doesn't exist, `{ error:
 * 'duplicate' }` if this binomio already has a non-cancelled registration for
 * this prueba (checked *before* the slots check, so a binomio re-submitting
 * while still holding the last slot is correctly told "already registered"
 * rather than being placed on the waitlist), or `{ error: 'no_slots' }` if the
 * prueba is full. The duplicate check is also backed by the partial unique
 * index `idx_registrations_event_binomio_active` (over non-cancelled rows
 * only, so re-registration after an expired hold or rejected payment is never
 * permanently blocked) and caught via the `23505` Postgres error code as a
 * race-safety net — the pre-check above isn't itself race-safe under
 * concurrent brand-new duplicates, but the index guarantees correctness
 * regardless.
 */
export async function createRegistrationWithHold(params: {
  eventId: string;
  binomioId: string;
  boxRequested: boolean;
}): Promise<CreateRegistrationWithHoldResult> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: existing } = await client.query(
      `SELECT 1 FROM registrations
       WHERE event_id = $1 AND binomio_id = $2 AND status != 'cancelled'`,
      [params.eventId, params.binomioId]
    );
    if (existing.length > 0) {
      await client.query("ROLLBACK");
      return { error: "duplicate" };
    }

    const { rows } = await client.query(
      "SELECT available_slots FROM events WHERE id = $1 FOR UPDATE",
      [params.eventId]
    );

    if (!rows[0]) {
      await client.query("ROLLBACK");
      return { error: "not_found" };
    }

    if (rows[0].available_slots <= 0) {
      await client.query("ROLLBACK");
      return { error: "no_slots" };
    }

    await client.query(
      "UPDATE events SET available_slots = available_slots - 1 WHERE id = $1",
      [params.eventId]
    );

    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const { rows: reg } = await client.query(
      `INSERT INTO registrations
         (event_id, binomio_id, box_requested, status, hold_expires_at)
       VALUES ($1, $2, $3, 'pending_payment', $4)
       RETURNING id`,
      [params.eventId, params.binomioId, params.boxRequested, holdExpiresAt]
    );

    await client.query("COMMIT");
    return { registrationId: reg[0].id, holdExpiresAt: holdExpiresAt.toISOString() };
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    if ((err as { code?: string }).code === "23505") return { error: "duplicate" };
    throw err;
  } finally {
    client.release();
  }
}

/** Persists the Mercado Pago preference id created for a pending registration. */
export async function setRegistrationPreferenceId(
  id: string,
  mpPreferenceId: string
): Promise<void> {
  const pool = getPool();
  await pool.query("UPDATE registrations SET mp_preference_id = $2 WHERE id = $1", [
    id,
    mpPreferenceId,
  ]);
}

/** Fetches a registration by id, or null if it doesn't exist. */
export async function getRegistrationById(id: string): Promise<Registration | null> {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM registrations WHERE id = $1", [id]);
  return rows[0] ? mapRegistrationRow(rows[0]) : null;
}

/**
 * Marks a registration `confirmed` and records the Mercado Pago payment id. Called
 * only from the webhook — the frontend never confirms a registration itself.
 */
export async function confirmRegistration(id: string, mpPaymentId: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE registrations
     SET status = 'confirmed', confirmed_at = now(), mp_payment_id = $2
     WHERE id = $1`,
    [id, mpPaymentId]
  );
}

/**
 * Cancels a `pending_payment` registration and releases its held slot back to the
 * prueba, atomically. Shared by both the Mercado Pago webhook's rejected/cancelled
 * branch and the hold-expiry cron, so the two code paths can't drift apart.
 *
 * Guarded by `WHERE status = 'pending_payment'` so it's safe to call twice for the
 * same registration (e.g. webhook and cron racing on the same expired hold) — the
 * second call is a no-op and returns `false` rather than double-releasing the slot.
 */
export async function cancelRegistrationAndReleaseSlot(id: string): Promise<boolean> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE registrations
       SET status = 'cancelled'
       WHERE id = $1 AND status = 'pending_payment'
       RETURNING event_id`,
      [id]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query(
      "UPDATE events SET available_slots = available_slots + 1 WHERE id = $1",
      [rows[0].event_id]
    );
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cancels every `pending_payment` registration whose hold has expired and releases
 * its slot. Wired to `POST /api/admin/release-expired-holds` (the Vercel cron in
 * production, a local `setInterval` script in dev).
 */
export async function releaseExpiredHolds(): Promise<number> {
  const pool = getPool();
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM registrations
     WHERE status = 'pending_payment' AND hold_expires_at < now()`
  );

  let released = 0;
  for (const row of rows) {
    if (await cancelRegistrationAndReleaseSlot(row.id)) released += 1;
  }
  return released;
}

export interface ConfirmedRegistrationRow {
  registrationId: string;
  eventId: string;
  eventName: string;
  category: string;
  priceArs: number;
  dayId: string;
  dayLabel: string;
  boxRequested: boolean;
  drawOrder: number | null;
  confirmedAt: string | null;
  binomioId: string;
  participantName: string;
  participantEmail: string;
  horseName: string;
  licenseNumber: string | null;
}

/**
 * Lists every confirmed registration for a competition, joined with its prueba,
 * day, and binomio — the shared data source for the admin "Inscriptos" tab, the
 * daily CSV export, and (indirectly) debt calculation.
 */
export async function listConfirmedRegistrationsForCompetition(
  competitionId: string
): Promise<ConfirmedRegistrationRow[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       r.id AS registration_id,
       e.id AS event_id,
       e.name AS event_name,
       e.category AS category,
       e.price_ars AS price_ars,
       d.id AS day_id,
       d.day_label AS day_label,
       r.box_requested AS box_requested,
       r.draw_order AS draw_order,
       r.confirmed_at AS confirmed_at,
       b.id AS binomio_id,
       b.participant_name AS participant_name,
       b.participant_email AS participant_email,
       b.horse_name AS horse_name,
       b.license_number AS license_number
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     JOIN competition_days d ON d.id = e.day_id
     JOIN binomios b ON b.id = r.binomio_id
     WHERE d.competition_id = $1 AND r.status = 'confirmed'
     ORDER BY d.sort_order, e.name, r.confirmed_at`,
    [competitionId]
  );

  return rows.map((row) => ({
    registrationId: row.registration_id,
    eventId: row.event_id,
    eventName: row.event_name,
    category: row.category,
    priceArs: row.price_ars,
    dayId: row.day_id,
    dayLabel: row.day_label,
    boxRequested: row.box_requested,
    drawOrder: row.draw_order,
    confirmedAt: row.confirmed_at,
    binomioId: row.binomio_id,
    participantName: row.participant_name,
    participantEmail: row.participant_email,
    horseName: row.horse_name,
    licenseNumber: row.license_number,
  }));
}

export interface DailyExportRow {
  eventName: string;
  category: string;
  drawOrder: number | null;
  participantName: string;
  horseName: string;
  licenseNumber: string | null;
  boxRequested: boolean;
  participantEmail: string;
  /** Centavos ARS: precio de la prueba + box del concurso si fue solicitado. */
  totalArs: number;
  mpPaymentId: string | null;
}

/**
 * Lists every confirmed registration for one competition day (`day_date`),
 * shaped for the Fase 3 legacy XLSX export: one row per registration with the
 * amount owed (prueba price + box if requested) and the Mercado Pago payment id.
 */
export async function listConfirmedRegistrationsForDay(
  competitionId: string,
  date: string
): Promise<DailyExportRow[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       e.name AS event_name,
       e.category AS category,
       r.draw_order AS draw_order,
       b.participant_name AS participant_name,
       b.horse_name AS horse_name,
       b.license_number AS license_number,
       r.box_requested AS box_requested,
       b.participant_email AS participant_email,
       (e.price_ars + CASE WHEN r.box_requested THEN c.box_price_ars ELSE 0 END)::int
         AS total_ars,
       r.mp_payment_id AS mp_payment_id
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     JOIN competition_days d ON d.id = e.day_id
     JOIN competitions c ON c.id = d.competition_id
     JOIN binomios b ON b.id = r.binomio_id
     WHERE d.competition_id = $1 AND d.day_date = $2 AND r.status = 'confirmed'
     ORDER BY e.name, r.draw_order NULLS LAST, b.participant_name`,
    [competitionId, date]
  );

  return rows.map((row) => ({
    eventName: row.event_name,
    category: row.category,
    drawOrder: row.draw_order,
    participantName: row.participant_name,
    horseName: row.horse_name,
    licenseNumber: row.license_number,
    boxRequested: row.box_requested,
    participantEmail: row.participant_email,
    totalArs: row.total_ars,
    mpPaymentId: row.mp_payment_id,
  }));
}

export interface DebtItem {
  concept: string;
  amountArs: number;
}

export interface DebtResult {
  binomioName: string;
  horseName: string;
  items: DebtItem[];
  totalArs: number;
  paid: boolean;
}

/**
 * Computes a binomio's total debt for a competition: the sum of confirmed
 * pruebas' `price_ars` plus the competition's `box_price_ars` for each
 * confirmed registration where a box was requested. Only `confirmed`
 * registrations count. Returns null if the binomio has no confirmed
 * registrations in this competition.
 */
export async function getDebtForBinomio(
  competitionId: string,
  binomioId: string
): Promise<DebtResult | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT
       r.box_requested AS box_requested,
       r.mp_payment_id AS mp_payment_id,
       e.name AS event_name,
       e.price_ars AS price_ars,
       c.box_price_ars AS box_price_ars,
       b.participant_name AS participant_name,
       b.horse_name AS horse_name
     FROM registrations r
     JOIN events e ON e.id = r.event_id
     JOIN competition_days d ON d.id = e.day_id
     JOIN competitions c ON c.id = d.competition_id
     JOIN binomios b ON b.id = r.binomio_id
     WHERE d.competition_id = $1 AND r.binomio_id = $2 AND r.status = 'confirmed'`,
    [competitionId, binomioId]
  );

  if (rows.length === 0) return null;

  const items: DebtItem[] = [];
  let totalArs = 0;
  let paid = true;

  for (const row of rows) {
    items.push({ concept: row.event_name, amountArs: row.price_ars });
    totalArs += row.price_ars;
    if (row.box_requested) {
      items.push({ concept: `Box — ${row.event_name}`, amountArs: row.box_price_ars });
      totalArs += row.box_price_ars;
    }
    if (!row.mp_payment_id) paid = false;
  }

  return {
    binomioName: rows[0].participant_name,
    horseName: rows[0].horse_name,
    items,
    totalArs,
    paid,
  };
}

/**
 * Bulk-assigns `draw_order` to a set of registrations (the sorteo result for one
 * prueba), inside a single transaction.
 */
export async function bulkSetDrawOrder(
  assignments: { registrationId: string; drawOrder: number }[]
): Promise<void> {
  if (assignments.length === 0) return;

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const { registrationId, drawOrder } of assignments) {
      await client.query("UPDATE registrations SET draw_order = $2 WHERE id = $1", [
        registrationId,
        drawOrder,
      ]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
