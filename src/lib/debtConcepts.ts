import { DebtConcept } from "@/types/member";

/**
 * Server-side Spanish labels for member-debt concepts, used where the i18n
 * React context is unavailable (Mercado Pago item titles, receipt emails).
 * Frontend surfaces use the i18n keys under `socios.concept*` instead.
 */
export function debtConceptLabel(concept: DebtConcept): string {
  switch (concept) {
    case "cuota":
      return "Cuota social";
    case "pension":
      return "Pensión";
    case "ropero":
      return "Ropero";
    case "otro":
      return "Otro concepto";
  }
}
