import { getPool } from "@/lib/db/client";

/** Creates a minimal `competitions` row for integration tests, returns its id. */
export async function createCompetition(
  overrides: Partial<{ title: string; dateFrom: string; dateTo: string; location: string; boxPriceArs: number }> = {}
): Promise<string> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO competitions (title, date_from, date_to, location, box_price_ars)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      overrides.title ?? "Concurso de Test",
      overrides.dateFrom ?? "2026-09-05",
      overrides.dateTo ?? "2026-09-06",
      overrides.location ?? "Club Hípico Buenos Aires",
      overrides.boxPriceArs ?? 500000,
    ]
  );
  return rows[0].id as string;
}

/** Creates a `competition_days` row, returns its id. */
export async function createCompetitionDay(
  competitionId: string,
  overrides: Partial<{ dayDate: string; dayLabel: string; sortOrder: number }> = {}
): Promise<string> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO competition_days (competition_id, day_date, day_label, sort_order)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [
      competitionId,
      overrides.dayDate ?? "2026-09-05",
      overrides.dayLabel ?? "Día 1 - Sábado",
      overrides.sortOrder ?? 0,
    ]
  );
  return rows[0].id as string;
}

/** Creates an `events` (prueba) row, returns its id. */
export async function createEvent(
  dayId: string,
  overrides: Partial<{
    name: string;
    category: string;
    priceArs: number;
    totalSlots: number;
    availableSlots: number;
  }> = {}
): Promise<string> {
  const pool = getPool();
  const totalSlots = overrides.totalSlots ?? 10;
  const { rows } = await pool.query(
    `INSERT INTO events (day_id, name, category, price_ars, total_slots, available_slots)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      dayId,
      overrides.name ?? "Prueba 1 - Salto 1.10m",
      overrides.category ?? "Salto 1.10m",
      overrides.priceArs ?? 1000000,
      totalSlots,
      overrides.availableSlots ?? totalSlots,
    ]
  );
  return rows[0].id as string;
}

/** Creates a `binomios` row, returns its id. */
export async function createBinomio(
  overrides: Partial<{
    participantName: string;
    participantEmail: string;
    horseName: string;
    licenseNumber: string;
  }> = {}
): Promise<string> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO binomios (participant_name, participant_email, horse_name, license_number)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [
      overrides.participantName ?? "Juan Pérez",
      overrides.participantEmail ?? `jinete-${Math.random().toString(36).slice(2)}@test.local`,
      overrides.horseName ?? "Relámpago",
      overrides.licenseNumber ?? null,
    ]
  );
  return rows[0].id as string;
}

/** Convenience: creates a competition + day + event in one call, returns all three ids. */
export async function createCompetitionWithEvent(
  eventOverrides: Parameters<typeof createEvent>[1] = {}
): Promise<{ competitionId: string; dayId: string; eventId: string }> {
  const competitionId = await createCompetition();
  const dayId = await createCompetitionDay(competitionId);
  const eventId = await createEvent(dayId, eventOverrides);
  return { competitionId, dayId, eventId };
}
