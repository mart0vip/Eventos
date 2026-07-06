"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useLanguage, useDateLocale } from "@/i18n/LanguageContext";
import { adminFetch } from "@/lib/adminSecret";
import { Competition } from "@/types/competition";

interface AdminRegistrationRow {
  eventName: string;
  dayLabel: string;
  participantName: string;
  participantEmail: string;
  horseName: string;
  licenseNumber: string | null;
  boxRequested: boolean;
  drawOrder: number | null;
  confirmedAt: string | null;
}

interface InscriptosTabProps {
  secret: string;
  competitions: Competition[];
  selectedCompetitionId: string;
  onSelectCompetition: (id: string) => void;
}

export default function InscriptosTab({
  secret,
  competitions,
  selectedCompetitionId,
  onSelectCompetition,
}: InscriptosTabProps) {
  const { t } = useLanguage();
  const dateLocale = useDateLocale();
  const [rows, setRows] = useState<AdminRegistrationRow[]>([]);
  const [dayFilter, setDayFilter] = useState("");
  const [pruebaFilter, setPruebaFilter] = useState("");

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
  const days = useMemo(() => [...new Set(effectiveRows.map((r) => r.dayLabel))], [effectiveRows]);
  const pruebas = useMemo(() => [...new Set(effectiveRows.map((r) => r.eventName))], [effectiveRows]);

  // A filter selected for a previous competition may not exist in the new
  // one's options — treat it as unfiltered rather than resetting it via effect.
  const activeDayFilter = days.includes(dayFilter) ? dayFilter : "";
  const activePruebaFilter = pruebas.includes(pruebaFilter) ? pruebaFilter : "";

  const filtered = effectiveRows.filter(
    (r) =>
      (!activeDayFilter || r.dayLabel === activeDayFilter) &&
      (!activePruebaFilter || r.eventName === activePruebaFilter)
  );

  return (
    <div className="space-y-4">
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

        {days.length > 1 && (
          <select value={activeDayFilter} onChange={(e) => setDayFilter(e.target.value)} className="input-field sm:max-w-xs">
            <option value="">{t("admin.allDays")}</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
        {pruebas.length > 1 && (
          <select value={activePruebaFilter} onChange={(e) => setPruebaFilter(e.target.value)} className="input-field sm:max-w-xs">
            <option value="">{t("admin.allPruebas")}</option>
            {pruebas.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-stable-light">{t("admin.noRegistrations")}</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-dust/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dust/30 text-left text-stable-light">
                <th className="p-3 font-semibold">{t("admin.colOrder")}</th>
                <th className="p-3 font-semibold">{t("admin.colRider")}</th>
                <th className="p-3 font-semibold">{t("admin.colHorse")}</th>
                <th className="p-3 font-semibold">{t("admin.colLicense")}</th>
                <th className="p-3 font-semibold">{t("admin.colBox")}</th>
                <th className="p-3 font-semibold">{t("admin.colConfirmedAt")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i} className="border-b border-dust/20 last:border-0">
                  <td className="p-3 text-stable-light">{r.drawOrder ?? "—"}</td>
                  <td className="p-3 text-stable font-medium">{r.participantName}</td>
                  <td className="p-3 text-stable-light">{r.horseName}</td>
                  <td className="p-3 text-stable-light">{r.licenseNumber ?? "—"}</td>
                  <td className="p-3 text-stable-light">{r.boxRequested ? "✓" : "—"}</td>
                  <td className="p-3 text-stable-light">
                    {r.confirmedAt ? format(parseISO(r.confirmedAt), "MMM d, HH:mm", { locale: dateLocale }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
