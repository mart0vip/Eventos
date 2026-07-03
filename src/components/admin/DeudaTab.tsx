"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { adminFetch } from "@/lib/adminSecret";
import { Competition } from "@/types/competition";

interface AdminRegistrationRow {
  binomioId: string;
  participantName: string;
  horseName: string;
}

interface DebtItem {
  concept: string;
  amountArs: number;
}

interface DebtResponse {
  binomioName: string;
  horseName: string;
  items: DebtItem[];
  totalArs: number;
  paid: boolean;
}

interface DeudaTabProps {
  secret: string;
  competitions: Competition[];
  selectedCompetitionId: string;
  onSelectCompetition: (id: string) => void;
}

export default function DeudaTab({
  secret,
  competitions,
  selectedCompetitionId,
  onSelectCompetition,
}: DeudaTabProps) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<AdminRegistrationRow[]>([]);
  const [binomioId, setBinomioId] = useState("");
  const [debt, setDebt] = useState<DebtResponse | null>(null);

  useEffect(() => {
    if (!selectedCompetitionId) return;
    adminFetch(`/api/admin/competitions/${selectedCompetitionId}/registrations`, secret)
      .then((res) => (res.ok ? res.json() : []))
      .then(setRows);
  }, [selectedCompetitionId, secret]);

  const effectiveRows = useMemo(
    () => (selectedCompetitionId ? rows : []),
    [selectedCompetitionId, rows]
  );
  const binomios = useMemo(() => {
    const seen = new Map<string, AdminRegistrationRow>();
    for (const r of effectiveRows) seen.set(r.binomioId, r);
    return [...seen.values()];
  }, [effectiveRows]);

  // A binomio selected for a previous competition may not exist in the new
  // one's list — treat it as unselected rather than resetting it via effect.
  const activeBinomioId = binomios.some((b) => b.binomioId === binomioId) ? binomioId : "";

  useEffect(() => {
    if (!activeBinomioId || !selectedCompetitionId) return;
    fetch(`/api/competitions/${selectedCompetitionId}/debt/${activeBinomioId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setDebt);
  }, [activeBinomioId, selectedCompetitionId]);

  const effectiveDebt = activeBinomioId ? debt : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-semibold text-stable">{t("admin.selectCompetition")}</label>
        <select
          value={selectedCompetitionId}
          onChange={(e) => onSelectCompetition(e.target.value)}
          className="input-field sm:max-w-md"
        >
          <option value="">—</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        {binomios.length > 0 && (
          <>
            <label className="text-sm font-semibold text-stable">{t("admin.selectBinomio")}</label>
            <select value={activeBinomioId} onChange={(e) => setBinomioId(e.target.value)} className="input-field sm:max-w-md">
              <option value="">—</option>
              {binomios.map((b) => (
                <option key={b.binomioId} value={b.binomioId}>
                  {b.participantName} / {b.horseName}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {effectiveDebt && (
        <div className="bg-white rounded-xl border border-dust/50 p-5 max-w-md">
          <h4 className="font-heading font-bold text-stable mb-3">
            {effectiveDebt.binomioName} / {effectiveDebt.horseName}
          </h4>
          <ul className="text-sm text-stable-light space-y-1 mb-3">
            {effectiveDebt.items.map((item, i) => (
              <li key={i} className="flex justify-between">
                <span>{item.concept}</span>
                <span>${(item.amountArs / 100).toLocaleString("es-AR")}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-dust/30 pt-3 flex justify-between font-bold text-stable">
            <span>{t("admin.debtTotal")}</span>
            <span>${(effectiveDebt.totalArs / 100).toLocaleString("es-AR")}</span>
          </div>
          <p className={`text-sm mt-2 ${effectiveDebt.paid ? "text-forest" : "text-red-600"}`}>
            {effectiveDebt.paid ? t("admin.debtPaid") : t("admin.debtPending")}
          </p>
        </div>
      )}
    </div>
  );
}
