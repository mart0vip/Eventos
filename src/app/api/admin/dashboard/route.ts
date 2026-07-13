import { NextRequest, NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/auth/admin-secret";
import { getDashboardTotals, listRecentPayments } from "@/lib/db/queries/paymentEvents";
import { getPendingMemberDebtTotal } from "@/lib/db/queries/members";

/**
 * GET /api/admin/dashboard
 *
 * Fase 4: treasury dashboard metrics — collected totals aggregated from the
 * `payment_events` ledger (fed by the Mercado Pago webhook), pending member
 * debt, and the latest payments with a resolved payer label.
 */
export async function GET(request: NextRequest) {
  const unauthorized = requireAdminSecret(request);
  if (unauthorized) return unauthorized;

  const [totals, pendingMemberDebtArs, recentPayments] = await Promise.all([
    getDashboardTotals(),
    getPendingMemberDebtTotal(),
    listRecentPayments(20),
  ]);

  return NextResponse.json({ ...totals, pendingMemberDebtArs, recentPayments });
}
