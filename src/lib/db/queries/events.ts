import { getPool } from "../client";
import { mapPruebaRow } from "../mappers";
import { Prueba } from "@/types/competition";

/** Fetches a single prueba by id, or null if it doesn't exist. */
export async function getEventById(id: string): Promise<Prueba | null> {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
  return rows[0] ? mapPruebaRow(rows[0]) : null;
}

/** Adds a prueba to an existing competition day. `availableSlots` starts equal to `totalSlots`. */
export async function addEventToDay(
  dayId: string,
  input: { name: string; category: string; priceArs: number; totalSlots: number }
): Promise<Prueba> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO events (day_id, name, category, price_ars, total_slots, available_slots)
     VALUES ($1, $2, $3, $4, $5, $5)
     RETURNING *`,
    [dayId, input.name, input.category, input.priceArs, input.totalSlots]
  );
  return mapPruebaRow(rows[0]);
}

/**
 * Lists every prueba belonging to a competition (across all its days), ordered by
 * day sort order then prueba name. Used by the sorteo (draw runs per-prueba across
 * the whole competition) and by debt calculation.
 */
export async function getEventsByCompetition(competitionId: string): Promise<Prueba[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT e.*
     FROM events e
     JOIN competition_days d ON d.id = e.day_id
     WHERE d.competition_id = $1
     ORDER BY d.sort_order, e.name`,
    [competitionId]
  );
  return rows.map(mapPruebaRow);
}

/** Marks a prueba's sorteo as executed. */
export async function markDrawDone(eventId: string): Promise<void> {
  const pool = getPool();
  await pool.query("UPDATE events SET draw_done = true WHERE id = $1", [eventId]);
}

export interface EventCheckoutContext {
  eventId: string;
  eventName: string;
  priceArs: number;
  competitionTitle: string;
  competitionDateFrom: string;
  boxPriceArs: number;
}

/**
 * Fetches the minimal joined context (prueba + its competition) needed to build
 * a Mercado Pago checkout preference and a confirmation email, in one query.
 */
export async function getEventCheckoutContext(
  eventId: string
): Promise<EventCheckoutContext | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT e.id AS event_id, e.name AS event_name, e.price_ars AS price_ars,
            c.title AS competition_title, c.date_from AS competition_date_from,
            c.box_price_ars AS box_price_ars
     FROM events e
     JOIN competition_days d ON d.id = e.day_id
     JOIN competitions c ON c.id = d.competition_id
     WHERE e.id = $1`,
    [eventId]
  );
  if (!rows[0]) return null;
  return {
    eventId: rows[0].event_id,
    eventName: rows[0].event_name,
    priceArs: rows[0].price_ars,
    competitionTitle: rows[0].competition_title,
    competitionDateFrom: rows[0].competition_date_from,
    boxPriceArs: rows[0].box_price_ars,
  };
}
