import { getPool } from "../client";
import { mapCompetitionDayRow, mapCompetitionRow, mapPruebaRow } from "../mappers";
import {
  Competition,
  CompetitionDay,
  CompetitionDayWithPruebas,
  CompetitionStatus,
  CompetitionWithDetail,
  Prueba,
} from "@/types/competition";

export interface CompetitionListItem extends Competition {
  /** Total number of pruebas across every day of the competition. */
  pruebaCount: number;
}

/**
 * Lists every open competition, soonest first, along with a total prueba
 * count for the "N pruebas disponibles" indicator on the public listing page.
 */
export async function listOpenCompetitions(): Promise<CompetitionListItem[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT c.*, COUNT(e.id)::int AS prueba_count
     FROM competitions c
     LEFT JOIN competition_days d ON d.competition_id = c.id
     LEFT JOIN events e ON e.day_id = d.id
     WHERE c.status = 'open'
     GROUP BY c.id
     ORDER BY c.date_from`
  );
  return rows.map((row) => ({ ...mapCompetitionRow(row), pruebaCount: row.prueba_count }));
}

/**
 * Lists every competition regardless of status (draft/open/closed/cancelled),
 * newest first — used by the admin "Anteprograma" tab, which needs to manage
 * drafts too, unlike the public listing which only shows `open` ones.
 */
export async function listAllCompetitions(): Promise<Competition[]> {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM competitions ORDER BY date_from DESC");
  return rows.map(mapCompetitionRow);
}

/**
 * Fetches a competition with its full anteprograma (days, each with its pruebas
 * and their current `available_slots`), or null if the competition doesn't exist.
 */
export async function getCompetitionById(id: string): Promise<CompetitionWithDetail | null> {
  const pool = getPool();
  const { rows: compRows } = await pool.query("SELECT * FROM competitions WHERE id = $1", [id]);
  if (!compRows[0]) return null;
  const competition = mapCompetitionRow(compRows[0]);

  const { rows: dayRows } = await pool.query(
    "SELECT * FROM competition_days WHERE competition_id = $1 ORDER BY sort_order",
    [id]
  );

  const days: CompetitionDayWithPruebas[] = [];
  for (const dayRow of dayRows) {
    const day = mapCompetitionDayRow(dayRow);
    const { rows: eventRows } = await pool.query(
      "SELECT * FROM events WHERE day_id = $1 ORDER BY name",
      [day.id]
    );
    days.push({ ...day, pruebas: eventRows.map(mapPruebaRow) });
  }

  return { ...competition, days };
}

export interface CreateCompetitionInput {
  title: string;
  dateFrom: string;
  dateTo: string;
  location: string;
  description?: string;
  boxPriceArs: number;
  days: {
    dayDate: string;
    dayLabel: string;
    sortOrder: number;
    events: { name: string; category: string; priceArs: number; totalSlots: number }[];
  }[];
}

/**
 * Creates a competition together with its days and pruebas in a single
 * transaction — the admin "create concurso" flow (nested anteprograma in one
 * request, per spec).
 */
export async function createCompetitionWithDaysAndEvents(
  input: CreateCompetitionInput
): Promise<CompetitionWithDetail> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: compRows } = await client.query(
      `INSERT INTO competitions (title, date_from, date_to, location, description, box_price_ars)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.title,
        input.dateFrom,
        input.dateTo,
        input.location,
        input.description ?? null,
        input.boxPriceArs,
      ]
    );
    const competition = mapCompetitionRow(compRows[0]);

    const days: CompetitionDayWithPruebas[] = [];
    for (const day of input.days) {
      const { rows: dayRows } = await client.query(
        `INSERT INTO competition_days (competition_id, day_date, day_label, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [competition.id, day.dayDate, day.dayLabel, day.sortOrder]
      );
      const dayRecord = mapCompetitionDayRow(dayRows[0]);

      const pruebas: Prueba[] = [];
      for (const event of day.events) {
        const { rows: eventRows } = await client.query(
          `INSERT INTO events (day_id, name, category, price_ars, total_slots, available_slots)
           VALUES ($1, $2, $3, $4, $5, $5)
           RETURNING *`,
          [dayRecord.id, event.name, event.category, event.priceArs, event.totalSlots]
        );
        pruebas.push(mapPruebaRow(eventRows[0]));
      }

      days.push({ ...dayRecord, pruebas });
    }

    await client.query("COMMIT");
    return { ...competition, days };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Adds a single day to an existing competition's anteprograma. */
export async function addDayToCompetition(
  competitionId: string,
  input: { dayDate: string; dayLabel: string; sortOrder: number }
): Promise<CompetitionDay> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO competition_days (competition_id, day_date, day_label, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [competitionId, input.dayDate, input.dayLabel, input.sortOrder]
  );
  return mapCompetitionDayRow(rows[0]);
}

/**
 * Sets a competition's status. The caller (API route) is responsible for
 * validating that the transition is legal (draft→open→closed→cancelled is a
 * one-way gate per the sorteo-requires-closed constraint) — this function
 * performs the raw update only.
 */
export async function updateCompetitionStatus(
  id: string,
  status: CompetitionStatus
): Promise<Competition | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    "UPDATE competitions SET status = $2 WHERE id = $1 RETURNING *",
    [id, status]
  );
  return rows[0] ? mapCompetitionRow(rows[0]) : null;
}
