import { getPool } from "../client";
import { mapMemberDebtRow, mapMemberRow } from "../mappers";
import { Member, MemberDebt, MemberWithDebts } from "@/types/member";

export type CreateMemberResult = { member: Member } | { error: "duplicate" };

/**
 * Creates a socio. `email` and `member_number` are UNIQUE in the schema; a
 * collision on either is reported as `{ error: 'duplicate' }` (caught via the
 * 23505 Postgres error code) so the admin UI can show a meaningful message
 * instead of a 500.
 */
export async function createMember(params: {
  name: string;
  email: string;
  memberNumber: string;
}): Promise<CreateMemberResult> {
  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `INSERT INTO members (name, email, member_number)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [params.name, params.email, params.memberNumber]
    );
    return { member: mapMemberRow(rows[0]) };
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "23505") return { error: "duplicate" };
    throw err;
  }
}

/**
 * Lists every socio with their pending-debt total (sum of unpaid
 * `member_debts.amount_ars`), for the admin "Socios" tab.
 */
export async function listMembersWithPendingTotal(): Promise<
  (Member & { pendingTotalArs: number })[]
> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT m.*,
            COALESCE(SUM(d.amount_ars) FILTER (WHERE d.paid_at IS NULL), 0)::int
              AS pending_total_ars
     FROM members m
     LEFT JOIN member_debts d ON d.member_id = m.id
     GROUP BY m.id
     ORDER BY m.member_number`
  );
  return rows.map((row) => ({
    ...mapMemberRow(row),
    pendingTotalArs: row.pending_total_ars as number,
  }));
}

/**
 * Fetches a socio with their full debt breakdown (paid and unpaid, newest due
 * date first) — the data source for the public portal page `/socios/[id]`.
 * Returns null if the member doesn't exist.
 */
export async function getMemberWithDebts(memberId: string): Promise<MemberWithDebts | null> {
  const pool = getPool();
  const { rows: memberRows } = await pool.query("SELECT * FROM members WHERE id = $1", [
    memberId,
  ]);
  if (!memberRows[0]) return null;

  const { rows: debtRows } = await pool.query(
    "SELECT * FROM member_debts WHERE member_id = $1 ORDER BY due_date DESC, created_at DESC",
    [memberId]
  );

  const debts = debtRows.map(mapMemberDebtRow);
  const pendingTotalArs = debts
    .filter((d) => d.paidAt === null)
    .reduce((sum, d) => sum + d.amountArs, 0);

  return { ...mapMemberRow(memberRows[0]), debts, pendingTotalArs };
}

/**
 * Inserts one or more debt records for a socio (admin bulk/manual load).
 * Runs inside a single transaction so a partial bulk load can't happen.
 */
export async function createMemberDebts(
  memberId: string,
  debts: { concept: string; amountArs: number; dueDate: string }[]
): Promise<MemberDebt[]> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const created: MemberDebt[] = [];
    for (const debt of debts) {
      const { rows } = await client.query(
        `INSERT INTO member_debts (member_id, concept, amount_ars, due_date)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [memberId, debt.concept, debt.amountArs, debt.dueDate]
      );
      created.push(mapMemberDebtRow(rows[0]));
    }
    await client.query("COMMIT");
    return created;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Total pending (unpaid) member debt in centavos ARS — Fase 4 dashboard. */
export async function getPendingMemberDebtTotal(): Promise<number> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(amount_ars), 0)::bigint AS total
     FROM member_debts
     WHERE paid_at IS NULL`
  );
  return Number(rows[0].total);
}

/** Fetches a debt joined with its socio (needed to build the MP preference). */
export async function getDebtWithMember(
  debtId: string
): Promise<{ debt: MemberDebt; member: Member } | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT d.*,
            m.id AS m_id, m.name AS m_name, m.email AS m_email,
            m.member_number AS m_member_number, m.created_at AS m_created_at
     FROM member_debts d
     JOIN members m ON m.id = d.member_id
     WHERE d.id = $1`,
    [debtId]
  );
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    debt: mapMemberDebtRow(row),
    member: mapMemberRow({
      id: row.m_id,
      name: row.m_name,
      email: row.m_email,
      member_number: row.m_member_number,
      created_at: row.m_created_at,
    }),
  };
}

/** Persists the Mercado Pago preference id created for an unpaid debt. */
export async function setDebtPreferenceId(
  debtId: string,
  mpPreferenceId: string
): Promise<void> {
  const pool = getPool();
  await pool.query("UPDATE member_debts SET mp_preference_id = $2 WHERE id = $1", [
    debtId,
    mpPreferenceId,
  ]);
}

/**
 * Marks a debt paid and records the Mercado Pago payment id. Called only from
 * the webhook — the frontend never marks a debt paid itself (same single
 * source of truth rule as registrations). Guarded by `paid_at IS NULL` so a
 * webhook retry can't overwrite the original payment record; returns false
 * when the debt was already paid (or doesn't exist).
 */
export async function markDebtPaid(debtId: string, mpPaymentId: string): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `UPDATE member_debts
     SET paid_at = now(), mp_payment_id = $2
     WHERE id = $1 AND paid_at IS NULL`,
    [debtId, mpPaymentId]
  );
  return (rowCount ?? 0) > 0;
}
