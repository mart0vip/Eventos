"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { adminFetch } from "@/lib/adminSecret";
import { Competition, CompetitionStatus, CompetitionWithDetail } from "@/types/competition";

const LEGAL_TRANSITIONS: Record<CompetitionStatus, CompetitionStatus[]> = {
  draft: ["open", "cancelled"],
  open: ["closed", "cancelled"],
  closed: ["cancelled"],
  cancelled: [],
};

const STATUS_LABEL_KEY: Record<CompetitionStatus, string> = {
  draft: "statusLabel",
  open: "openRegistrations",
  closed: "closeRegistrations",
  cancelled: "cancelCompetition",
};

interface AnteprogramaTabProps {
  secret: string;
  competitions: Competition[];
  selectedCompetitionId: string;
  onSelectCompetition: (id: string) => void;
  onCompetitionsChanged: () => void;
}

export default function AnteprogramaTab({
  secret,
  competitions,
  selectedCompetitionId,
  onSelectCompetition,
  onCompetitionsChanged,
}: AnteprogramaTabProps) {
  const { t } = useLanguage();
  const [detail, setDetail] = useState<CompetitionWithDetail | null>(null);

  const [title, setTitle] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [boxPriceArs, setBoxPriceArs] = useState("");

  const [dayDate, setDayDate] = useState("");
  const [dayLabel, setDayLabel] = useState("");

  const [pruebaDayId, setPruebaDayId] = useState<string | null>(null);
  const [pruebaName, setPruebaName] = useState("");
  const [pruebaCategory, setPruebaCategory] = useState("");
  const [pruebaPrice, setPruebaPrice] = useState("");
  const [pruebaSlots, setPruebaSlots] = useState("");

  const refreshDetail = async (id: string) => {
    const res = await fetch(`/api/competitions/${id}`);
    setDetail(res.ok ? await res.json() : null);
  };

  useEffect(() => {
    if (!selectedCompetitionId) return;
    fetch(`/api/competitions/${selectedCompetitionId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setDetail);
  }, [selectedCompetitionId]);

  const effectiveDetail = selectedCompetitionId ? detail : null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminFetch("/api/admin/competitions", secret, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        dateFrom,
        dateTo,
        location,
        description: description || undefined,
        boxPriceArs: Math.round(Number(boxPriceArs || 0) * 100),
        days: [],
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setTitle("");
      setDateFrom("");
      setDateTo("");
      setLocation("");
      setDescription("");
      setBoxPriceArs("");
      onCompetitionsChanged();
      onSelectCompetition(created.id);
    }
  };

  const handleTransition = async (status: CompetitionStatus) => {
    const res = await adminFetch(`/api/admin/competitions/${selectedCompetitionId}`, secret, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      onCompetitionsChanged();
      refreshDetail(selectedCompetitionId);
    }
  };

  const handleAddDay = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await adminFetch(
      `/api/admin/competitions/${selectedCompetitionId}/days`,
      secret,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayDate,
          dayLabel,
          sortOrder: detail?.days.length ?? 0,
        }),
      }
    );
    if (res.ok) {
      setDayDate("");
      setDayLabel("");
      refreshDetail(selectedCompetitionId);
    }
  };

  const handleAddPrueba = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pruebaDayId) return;
    const res = await adminFetch(`/api/admin/days/${pruebaDayId}/events`, secret, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: pruebaName,
        category: pruebaCategory,
        priceArs: Math.round(Number(pruebaPrice || 0) * 100),
        totalSlots: Number(pruebaSlots || 0),
      }),
    });
    if (res.ok) {
      setPruebaName("");
      setPruebaCategory("");
      setPruebaPrice("");
      setPruebaSlots("");
      setPruebaDayId(null);
      refreshDetail(selectedCompetitionId);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-5 border border-dust/50">
        <h3 className="font-heading font-bold text-stable mb-4">{t("admin.createCompetition")}</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required placeholder={t("admin.titleField")} value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
          <input required placeholder={t("admin.locationField")} value={location} onChange={(e) => setLocation(e.target.value)} className="input-field" />
          <input required type="date" placeholder={t("admin.dateFromField")} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field" />
          <input required type="date" placeholder={t("admin.dateToField")} value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field" />
          <input placeholder={t("admin.descriptionField")} value={description} onChange={(e) => setDescription(e.target.value)} className="input-field sm:col-span-2" />
          <input type="number" min="0" placeholder={t("admin.boxPriceField")} value={boxPriceArs} onChange={(e) => setBoxPriceArs(e.target.value)} className="input-field" />
          <button type="submit" className="btn-green">
            <Plus size={16} />
            {t("admin.createButton")}
          </button>
        </form>
      </div>

      {competitions.length === 0 ? (
        <p className="text-stable-light">{t("admin.noCompetitions")}</p>
      ) : (
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
                {c.title} ({c.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {effectiveDetail && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 border border-dust/50 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-heading font-bold text-stable">{effectiveDetail.title}</h3>
              <p className="text-sm text-stable-light">
                {t("admin.statusLabel")} <strong>{effectiveDetail.status}</strong>
              </p>
            </div>
            <div className="flex gap-2">
              {LEGAL_TRANSITIONS[effectiveDetail.status].map((next) => (
                <button key={next} onClick={() => handleTransition(next)} className="btn-secondary text-sm py-2">
                  {t(`admin.${STATUS_LABEL_KEY[next]}`)}
                </button>
              ))}
            </div>
          </div>

          {effectiveDetail.days.map((day) => (
            <div key={day.id} className="bg-white rounded-xl border border-dust/50 p-5">
              <h4 className="font-heading font-bold text-stable mb-3">{day.dayLabel}</h4>
              <ul className="space-y-2 mb-4">
                {day.pruebas.map((prueba) => (
                  <li key={prueba.id} className="text-sm text-stable-light flex justify-between border-b border-dust/20 pb-2">
                    <span>
                      {prueba.name} ({prueba.category})
                    </span>
                    <span>
                      ${(prueba.priceArs / 100).toLocaleString("es-AR")} · {prueba.availableSlots}/{prueba.totalSlots}
                    </span>
                  </li>
                ))}
              </ul>

              {pruebaDayId === day.id ? (
                <form onSubmit={handleAddPrueba} className="grid grid-cols-2 gap-2">
                  <input required placeholder={t("admin.pruebaNameField")} value={pruebaName} onChange={(e) => setPruebaName(e.target.value)} className="input-field" />
                  <input required placeholder={t("admin.pruebaCategoryField")} value={pruebaCategory} onChange={(e) => setPruebaCategory(e.target.value)} className="input-field" />
                  <input required type="number" min="0" placeholder={t("admin.pruebaPriceField")} value={pruebaPrice} onChange={(e) => setPruebaPrice(e.target.value)} className="input-field" />
                  <input required type="number" min="1" placeholder={t("admin.pruebaSlotsField")} value={pruebaSlots} onChange={(e) => setPruebaSlots(e.target.value)} className="input-field" />
                  <button type="submit" className="btn-green col-span-2 justify-center">
                    {t("admin.addPruebaButton")}
                  </button>
                </form>
              ) : (
                <button onClick={() => setPruebaDayId(day.id)} className="btn-secondary text-sm">
                  <Plus size={14} />
                  {t("admin.addPruebaTitle", { day: day.dayLabel })}
                </button>
              )}
            </div>
          ))}

          <div className="bg-white rounded-xl border border-dust/50 p-5">
            <h4 className="font-heading font-bold text-stable mb-3">{t("admin.addDayTitle")}</h4>
            <form onSubmit={handleAddDay} className="grid grid-cols-2 gap-2">
              <input required type="date" value={dayDate} onChange={(e) => setDayDate(e.target.value)} className="input-field" />
              <input required placeholder={t("admin.dayLabelField")} value={dayLabel} onChange={(e) => setDayLabel(e.target.value)} className="input-field" />
              <button type="submit" className="btn-green col-span-2 justify-center">
                {t("admin.addDayButton")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
