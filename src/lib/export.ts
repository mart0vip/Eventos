/**
 * FASE 3 scaffolding — daily XLSX export matching the club's legacy desktop
 * system (Visual FoxPro / Access / Delphi) format. Intentionally not implemented
 * in Fase 1; only the function signature and column layout are documented here
 * so a future implementer has the shape ready.
 *
 * Planned columns (per spec): Prueba | Categoría | Orden Sorteo | Jinete | Caballo
 * | Licencia | Box | Email | Monto | ID Pago MP
 */
export async function generateDailyExport(
  _competitionId: string,
  _date: string
): Promise<Buffer> {
  throw new Error("FASE 3: No implementado");
}
