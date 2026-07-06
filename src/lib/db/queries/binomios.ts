import { getPool } from "../client";
import { mapBinomioRow } from "../mappers";
import { Binomio } from "@/types/competition";

/**
 * Finds the binomio for a given (participant_email, horse_name) pair, or creates
 * one if it doesn't exist yet. A binomio is uniquely identified by email + horse
 * name per the product rule ("un email+caballo siempre es el mismo binomio") —
 * backed by the `idx_binomios_email_horse` unique index so this is race-safe under
 * concurrent registrations for a brand-new binomio.
 *
 * If the pair already exists, `participantName` and `licenseNumber` are updated to
 * the values passed in (most-recent-submission-wins) rather than left untouched —
 * the spec doesn't define a rule here, so this is the chosen, documented behavior.
 */
export async function findOrCreateBinomio(params: {
  participantName: string;
  participantEmail: string;
  horseName: string;
  licenseNumber?: string;
}): Promise<Binomio> {
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO binomios (participant_name, participant_email, horse_name, license_number)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (participant_email, horse_name)
     DO UPDATE SET
       participant_name = EXCLUDED.participant_name,
       license_number = COALESCE(EXCLUDED.license_number, binomios.license_number)
     RETURNING *`,
    [params.participantName, params.participantEmail, params.horseName, params.licenseNumber ?? null]
  );
  return mapBinomioRow(rows[0]);
}

/** Fetches a binomio by id, or null if it doesn't exist. */
export async function getBinomioById(id: string): Promise<Binomio | null> {
  const pool = getPool();
  const { rows } = await pool.query("SELECT * FROM binomios WHERE id = $1", [id]);
  return rows[0] ? mapBinomioRow(rows[0]) : null;
}
