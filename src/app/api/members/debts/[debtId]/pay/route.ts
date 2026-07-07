import { NextResponse } from "next/server";
import { getDebtWithMember, setDebtPreferenceId } from "@/lib/db/queries/members";
import { createDebtCheckoutPreference } from "@/lib/mercadopago";
import { debtConceptLabel } from "@/lib/debtConcepts";

/**
 * POST /api/members/debts/[debtId]/pay
 *
 * Creates the Mercado Pago Checkout Pro preference for an unpaid debt item and
 * returns its checkout URL. Public for the same reason as the portal's GET:
 * the debt id is a non-enumerable UUID reachable only from the socio's
 * permanent link. Paying doesn't mark anything paid — only the webhook does.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ debtId: string }> }
) {
  const { debtId } = await params;
  const found = await getDebtWithMember(debtId);
  if (!found) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (found.debt.paidAt !== null) {
    return NextResponse.json({ error: "already_paid" }, { status: 409 });
  }

  try {
    const preference = await createDebtCheckoutPreference({
      debtId: found.debt.id,
      memberId: found.member.id,
      memberName: found.member.name,
      memberEmail: found.member.email,
      conceptLabel: debtConceptLabel(found.debt.concept),
      dueDate: found.debt.dueDate,
      amountArs: found.debt.amountArs,
    });
    await setDebtPreferenceId(found.debt.id, preference.preferenceId);

    return NextResponse.json({ debtId: found.debt.id, checkoutUrl: preference.checkoutUrl });
  } catch (err) {
    // Expected in local/dev environments without real Mercado Pago credentials.
    console.error("Mercado Pago preference creation failed", err);
    return NextResponse.json({ error: "payment_provider_error" }, { status: 502 });
  }
}
