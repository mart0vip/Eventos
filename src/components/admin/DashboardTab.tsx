"use client";

import { useEffect, useState } from "react";
import { useLanguage, useDateLocale } from "@/i18n/LanguageContext";
import { adminFetch } from "@/lib/adminSecret";
import { format } from "date-fns";

interface RecentPayment {
  source: "registration" | "member_debt";
  amountArs: number;
  mpPaymentId: string;
  receivedAt: string;
  payerLabel: string;
}

interface DashboardData {
  totalCollectedArs: number;
  collectedRegistrationsArs: number;
  collectedMemberDebtsArs: number;
  paymentsCount: number;
  pendingMemberDebtArs: number;
  recentPayments: RecentPayment[];
}

interface DashboardTabProps {
  secret: string;
}

export default function DashboardTab({ secret }: DashboardTabProps) {
  const { t } = useLanguage();
  const dateLocale = useDateLocale();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    adminFetch("/api/admin/dashboard", secret)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData);
  }, [secret]);

  if (!data) {
    return (
      <div className="min-h-[30vh] flex items-center justify-center">
        <span className="text-5xl animate-bounce">🐴</span>
      </div>
    );
  }

  const formatArs = (amountArs: number) => `$${(amountArs / 100).toLocaleString("es-AR")}`;

  const cards = [
    { label: t("admin.dashTotalCollected"), value: formatArs(data.totalCollectedArs), accent: "text-forest" },
    { label: t("admin.dashFromRegistrations"), value: formatArs(data.collectedRegistrationsArs), accent: "text-stable" },
    { label: t("admin.dashFromMembers"), value: formatArs(data.collectedMemberDebtsArs), accent: "text-stable" },
    { label: t("admin.dashPendingMemberDebt"), value: formatArs(data.pendingMemberDebtArs), accent: "text-red-600" },
    { label: t("admin.dashPaymentsCount"), value: String(data.paymentsCount), accent: "text-stable" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-dust/50 p-5">
            <p className="text-sm text-stable-light mb-1">{card.label}</p>
            <p className={`font-heading font-bold text-xl ${card.accent}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-heading font-bold text-stable mb-3">{t("admin.dashRecentPayments")}</h3>
        {data.recentPayments.length === 0 ? (
          <p className="text-stable-light text-sm">{t("admin.dashEmpty")}</p>
        ) : (
          <div className="bg-white rounded-xl border border-dust/50 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stable-light border-b border-dust/30">
                  <th className="px-4 py-3 font-semibold">{t("admin.dashColDate")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.dashColSource")}</th>
                  <th className="px-4 py-3 font-semibold">{t("admin.dashColPayer")}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t("admin.dashColAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.map((payment) => (
                  <tr key={payment.mpPaymentId} className="border-b border-dust/20 last:border-0">
                    <td className="px-4 py-3 text-stable-light">
                      {format(new Date(payment.receivedAt), "d MMM yyyy HH:mm", { locale: dateLocale })}
                    </td>
                    <td className="px-4 py-3 text-stable">
                      {payment.source === "registration"
                        ? t("admin.dashSourceRegistration")
                        : t("admin.dashSourceMemberDebt")}
                    </td>
                    <td className="px-4 py-3 text-stable">{payment.payerLabel}</td>
                    <td className="px-4 py-3 text-right font-semibold text-forest">
                      {formatArs(payment.amountArs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
