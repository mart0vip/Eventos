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
  const [exportDate, setExportDate] = useState("");
  const [xlsxError, setXlsxError] = useState<"no_rows" | "error" | null>(null);
  const [downloading, setDownloading] = useState(false);

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

  const handleXlsxDownload = async () => {
    setDownloading(true);
    setXlsxError(null);
    try {
      const res = await adminFetch(
        `/api/admin/export?competitionId=${selectedCompetitionId}&date=${exportDate}`,
        secret
      );
      if (!res.ok) {
        setXlsxError(res.status === 404 ? "no_rows" : "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `planilla-${exportDate}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setXlsxError("error");
    } finally {
      setDownloading(false);
    }
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

      {selectedCompetitionId && (
        <div className="bg-white rounded-xl border border-dust/50 p-5 max-w-md space-y-3">
          <div>
            <label className="text-sm font-semibold text-stable">{t("admin.exportDayField")}</label>
            <input
              type="date"
              value={exportDate}
              onChange={(e) => {
                setExportDate(e.target.value);
                setXlsxError(null);
              }}
              className="input-field"
            />
          </div>
          <button
            onClick={handleXlsxDownload}
            disabled={!exportDate || downloading}
            className="btn-primary text-sm py-2 disabled:opacity-50"
          >
            <Download size={16} />
            {t("admin.downloadXlsx")}
          </button>
          {xlsxError && (
            <p className="text-sm text-red-600">
              {xlsxError === "no_rows" ? t("admin.exportNoRows") : t("admin.exportError")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
