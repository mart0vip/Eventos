"use client";

import { useEffect, useState } from "react";
import { Shuffle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { adminFetch } from "@/lib/adminSecret";
import { Competition, CompetitionWithDetail } from "@/types/competition";

interface DrawResultEntry {
  eventId: string;
  eventName: string;
  order: { binomioName: string; horseName: string; drawOrder: number }[];
}

interface SorteoTabProps {
  secret: string;
  competitions: Competition[];
  selectedCompetitionId: string;
  onSelectCompetition: (id: string) => void;
}

export default function SorteoTab({
  secret,
  competitions,
  selectedCompetitionId,
  onSelectCompetition,
}: SorteoTabProps) {
  const { t } = useLanguage();
  const [detail, setDetail] = useState<CompetitionWithDetail | null>(null);
  const [results, setResults] = useState<DrawResultEntry[]>([]);
  const [resultsCompetitionId, setResultsCompetitionId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCompetitionId) return;
    fetch(`/api/competitions/${selectedCompetitionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setDetail);
  }, [selectedCompetitionId]);

  const handleRunDraw = async () => {
    const res = await adminFetch(`/api/admin/competitions/${selectedCompetitionId}/draw`, secret, {
      method: "POST",
    });
    if (res.ok) {
      const body = await res.json();
      setResults(body.results);
      setResultsCompetitionId(selectedCompetitionId);
      const refreshed = await fetch(`/api/competitions/${selectedCompetitionId}`);
      if (refreshed.ok) setDetail(await refreshed.json());
    }
  };

  const effectiveDetail = selectedCompetitionId ? detail : null;
  const effectiveResults = resultsCompetitionId === selectedCompetitionId ? results : [];
  const allPruebas = effectiveDetail?.days.flatMap((d) => d.pruebas) ?? [];
  const canRunDraw = effectiveDetail?.status === "closed" && allPruebas.some((p) => !p.drawDone);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
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
      </div>

      {effectiveDetail && (
        <>
          <div className="bg-white rounded-xl border border-dust/50 p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <ul className="text-sm text-stable-light space-y-1">
                {allPruebas.map((p) => (
                  <li key={p.id}>
                    {p.name} — {p.drawDone ? t("admin.drawAlreadyDone") : "—"}
                  </li>
                ))}
              </ul>
              <button onClick={handleRunDraw} disabled={!canRunDraw} className="btn-green disabled:opacity-50">
                <Shuffle size={16} />
                {t("admin.runDraw")}
              </button>
            </div>
            {effectiveDetail.status !== "closed" && (
              <p className="text-sm text-gold mt-3">{t("admin.drawRequiresClosed")}</p>
            )}
          </div>

          {effectiveResults.length > 0 && (
            <div className="bg-white rounded-xl border border-dust/50 p-5">
              <h4 className="font-heading font-bold text-stable mb-3">{t("admin.drawResultsTitle")}</h4>
              {effectiveResults.map((r) => (
                <div key={r.eventId} className="mb-4 last:mb-0">
                  <p className="font-semibold text-stable text-sm mb-1">{r.eventName}</p>
                  <ol className="text-sm text-stable-light list-decimal list-inside">
                    {r.order.map((entry) => (
                      <li key={entry.drawOrder}>
                        {entry.binomioName} / {entry.horseName}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
