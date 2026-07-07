"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage, useDateLocale } from "@/i18n/LanguageContext";
import { format, parseISO } from "date-fns";
import { AlertCircle, CheckCircle, Clock3, CreditCard } from "lucide-react";
import { DebtConcept, MemberWithDebts } from "@/types/member";

const CONCEPT_KEYS: Record<DebtConcept, string> = {
  cuota: "socios.conceptCuota",
  pension: "socios.conceptPension",
  ropero: "socios.conceptRopero",
  otro: "socios.conceptOtro",
};

function SocioPortalContent() {
  const { t } = useLanguage();
  const dateLocale = useDateLocale();
  const params = useParams();
  const searchParams = useSearchParams();
  const [member, setMember] = useState<MemberWithDebts | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [payingDebtId, setPayingDebtId] = useState<string | null>(null);
  const [payError, setPayError] = useState(false);

  const memberId = params.id as string;
  const pagoBanner = searchParams.get("pago");

  const refresh = useCallback(() => {
    return fetch(`/api/members/${memberId}/debts`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setMember);
  }, [memberId]);

  useEffect(() => {
    refresh().finally(() => setLoaded(true));
  }, [refresh]);

  // Coming back from Mercado Pago the webhook may still be in flight — poll a
  // few times so an approved payment flips to "paid" without a manual reload.
  useEffect(() => {
    if (pagoBanner !== "exito") return;
    const interval = setInterval(refresh, 3000);
    const timeout = setTimeout(() => clearInterval(interval), 45000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pagoBanner, refresh]);

  const handlePay = async (debtId: string) => {
    setPayingDebtId(debtId);
    setPayError(false);
    try {
      const res = await fetch(`/api/members/debts/${debtId}/pay`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      setPayError(true);
    } catch {
      setPayError(true);
    }
    setPayingDebtId(null);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <span className="text-5xl animate-bounce">🐴</span>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <span className="text-6xl mb-4">🐴</span>
        <h2 className="font-heading text-2xl font-bold text-stable mb-2">
          {t("socios.notFoundTitle")}
        </h2>
        <p className="text-stable-light">{t("socios.notFoundDesc")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-saddle text-white py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-leather-light text-sm mb-1">{t("socios.title")}</p>
          <h1 className="text-3xl font-heading font-bold">{member.name}</h1>
          <p className="text-leather-light mt-1">
            {t("socios.memberNumberLabel", { n: member.memberNumber })}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {pagoBanner === "exito" && (
          <div className="bg-forest/10 border border-forest/30 rounded-lg p-4 text-sm text-forest flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0" />
            {t("socios.paymentSuccessBanner")}
          </div>
        )}
        {pagoBanner === "pendiente" && (
          <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 text-sm text-saddle-dark flex items-center gap-2">
            <Clock3 size={16} className="shrink-0" />
            {t("socios.paymentPendingBanner")}
          </div>
        )}
        {pagoBanner === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            {t("socios.paymentErrorBanner")}
          </div>
        )}

        <div className="bg-white rounded-xl border border-dust/50 p-5 flex items-center justify-between">
          <span className="font-heading font-bold text-stable">{t("socios.pendingTotal")}</span>
          <span className="font-heading font-bold text-xl text-forest">
            ${(member.pendingTotalArs / 100).toLocaleString("es-AR")}
          </span>
        </div>

        {member.debts.length === 0 ? (
          <div className="bg-white rounded-xl border border-dust/50 p-8 text-center text-stable-light">
            {t("socios.noDebts")}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-dust/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stable-light border-b border-dust/30">
                  <th className="px-4 py-3 font-semibold">{t("socios.colConcept")}</th>
                  <th className="px-4 py-3 font-semibold">{t("socios.colDueDate")}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t("socios.colAmount")}</th>
                  <th className="px-4 py-3 font-semibold">{t("socios.colStatus")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {member.debts.map((debt) => (
                  <tr key={debt.id} className="border-b border-dust/20 last:border-0">
                    <td className="px-4 py-3 text-stable font-medium">
                      {t(CONCEPT_KEYS[debt.concept])}
                    </td>
                    <td className="px-4 py-3 text-stable-light">
                      {format(parseISO(debt.dueDate), "d MMM yyyy", { locale: dateLocale })}
                    </td>
                    <td className="px-4 py-3 text-right text-stable">
                      ${(debt.amountArs / 100).toLocaleString("es-AR")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          debt.paidAt
                            ? "text-forest font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {debt.paidAt ? t("socios.statusPaid") : t("socios.statusPending")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!debt.paidAt && (
                        <button
                          onClick={() => handlePay(debt.id)}
                          disabled={payingDebtId !== null}
                          className="btn-green text-sm py-1.5 disabled:opacity-50"
                        >
                          <CreditCard size={14} />
                          {payingDebtId === debt.id
                            ? t("socios.paying")
                            : t("socios.payButton")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {payError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            {t("socios.payError")}
          </div>
        )}
      </div>
    </>
  );
}

export default function SocioPortalPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <span className="text-5xl animate-bounce">🐴</span>
          </div>
        }
      >
        <SocioPortalContent />
      </Suspense>
      <Footer />
    </>
  );
}
