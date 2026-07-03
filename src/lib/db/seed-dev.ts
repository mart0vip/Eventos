import { getPool } from "./client";
import { createCompetitionWithDaysAndEvents, updateCompetitionStatus } from "./queries/competitions";

/**
 * Dev-only seed script (never imported by production code paths). Inserts one
 * `open` competition with two pruebas — one with a single slot so the
 * no-slots/waitlist branch is reachable via manual/curl testing without
 * needing 3+ real registrations. Wired to `npm run db:seed`.
 */
async function seed(): Promise<void> {
  const competition = await createCompetitionWithDaysAndEvents({
    title: "Concurso de Primavera",
    dateFrom: "2026-09-05",
    dateTo: "2026-09-06",
    location: "Club Hípico Buenos Aires",
    description: "Concurso de desarrollo local para pruebas manuales.",
    boxPriceArs: 500000, // $5000 ARS in centavos
    days: [
      {
        dayDate: "2026-09-05",
        dayLabel: "Día 1 - Sábado",
        sortOrder: 0,
        events: [
          { name: "Prueba 1 - Salto 0.80m", category: "Salto 0.80m", priceArs: 800000, totalSlots: 20 },
          { name: "Prueba 2 - Salto 1.10m (cupo limitado)", category: "Salto 1.10m", priceArs: 1200000, totalSlots: 1 },
        ],
      },
    ],
  });

  await updateCompetitionStatus(competition.id, "open");

  console.log("Seeded competition:", competition.id);
  for (const day of competition.days) {
    for (const prueba of day.pruebas) {
      console.log(`  prueba: ${prueba.name} -> ${prueba.id} (slots: ${prueba.availableSlots})`);
    }
  }

  await getPool().end();
}

seed().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
