"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { adminFetch } from "@/lib/adminSecret";
import { downloadCsv } from "@/lib/csv";
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

interface ExportarTabProps {
  secret: string;
  competitions: Competition[];
  selectedCompetitionId: string;
  onSelectCompetition: (id: string) => void;
}

export default function ExportarTab({
  secret,
  competitions,
  selectedCompetitionId,
  onSelectCompetition,
}: ExportarTabProps) {
  const { t } = useLanguage();
  const [rows, setRows] = useState<AdminRegistrationRow[]>([]);

  useEffect(() => {
    if (!selectedCompetitionId) return;
    adminFetch(`/api/admin/competitions/${selectedCompetitionId}/registrations`, secret)
      .then((res) => (res.ok ? res.json() : []))
      .then(setRows);
  }, [selectedCompetitionId, secret]);

  const effectiveRows = selectedCompetitionId ? rows : [];

  const handleDownload = () => {
    const competition = competitions.find((c) => c.id === selectedCompetitionId);
    const slug = (competition?.title ?? "concurso")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    downloadCsv(
      `inscriptos-${slug}`,
      effectiveRows.map((r) => ({
        [t("admin.colOrder")]: r.drawOrder ?? "",
        [t("admin.colRider")]: r.participantName,
        [t("admin.colHorse")]: r.horseName,
        [t("admin.colLicense")]: r.licenseNumber ?? "",
        [t("admin.colBox")]: r.boxRequested ? "Sí" : "No",
        [t("admin.colConfirmedAt")]: r.confirmedAt ?? "",
      }))
    );
  };

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

      {selectedCompetitionId && (
        <button onClick={handleDownload} disabled={effectiveRows.length === 0} className="btn-secondary disabled:opacity-50">
          <Download size={16} />
          {t("admin.downloadCsv")}
        </button>
      )}
    </div>
  );
}
