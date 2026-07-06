import { getPool } from "../client";
import { mapWaitlistRow } from "../mappers";
import { WaitlistEntry } from "@/types/competition";

/** Adds a binomio to a prueba's waitlist. */
export async function addToWaitlist(eventId: string, binomioId: string): Promise<WaitlistEntry> {
  const pool = getPool();
  const { rows } = await pool.query(
    "INSERT INTO waitlist (event_id, binomio_id) VALUES ($1, $2) RETURNING *",
    [eventId, binomioId]
  );
  return mapWaitlistRow(rows[0]);
}

/**
 * Returns the oldest not-yet-notified waitlist entry for a prueba (FIFO), or null
 * if the waitlist is empty. Used after a slot frees up (webhook cancellation or
 * hold expiry) to determine who to notify next.
 */
export async function getNextWaitlisted(eventId: string): Promise<WaitlistEntry | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM waitlist
     WHERE event_id = $1 AND notified_at IS NULL
     ORDER BY created_at ASC
     LIMIT 1`,
    [eventId]
  );
  return rows[0] ? mapWaitlistRow(rows[0]) : null;
}

/** Marks a waitlist entry as notified. */
export async function markNotified(id: string): Promise<void> {
  const pool = getPool();
  await pool.query("UPDATE waitlist SET notified_at = now() WHERE id = $1", [id]);
}
