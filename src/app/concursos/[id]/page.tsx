"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InscripcionForm, { InscripcionResult } from "@/components/InscripcionForm";
import { useLanguage, useDateLocale } from "@/i18n/LanguageContext";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock3,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { CompetitionWithDetail } from "@/types/competition";

function useCountdown(targetIso: string | null) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!targetIso) return;
    const target = new Date(targetIso).getTime();
    const tick = () => setRemainingMs(Math.max(0, target - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  if (!targetIso || remainingMs === null) return null;
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ConcursoDetailPage() {
  const { t } = useLanguage();
  const dateLocale = useDateLocale();
  const params = useParams();
  const [competition, setCompetition] = useState<CompetitionWithDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, InscripcionResult>>({});

  useEffect(() => {
    const id = params.id as string;
    fetch(`/api/competitions/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CompetitionWithDetail | null) => {
        setCompetition(data);
        if (data && data.days.length > 0) setSelectedDayId(data.days[0].id);
      })
      .finally(() => setLoaded(true));
  }, [params.id]);

  const selectedDay = useMemo(
    () => competition?.days.find((d) => d.id === selectedDayId) ?? null,
    [competition, selectedDayId]
  );

  const handleResult = (eventId: string, result: InscripcionResult) => {
    setResults((prev) => ({ ...prev, [eventId]: result }));
    setExpandedEventId(null);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <span className="text-5xl animate-bounce">🐴</span>
      </div>
    );
  }

  if (!competition) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <span className="text-6xl mb-4">🐴</span>
          <h2 className="font-heading text-2xl font-bold text-stable mb-2">
            {t("concursoDetail.notFoundTitle")}
          </h2>
          <p className="text-stable-light mb-6">{t("concursoDetail.notFoundDesc")}</p>
          <Link href="/concursos" className="btn-primary">
            <ArrowLeft size={16} />
            {t("concursoDetail.backToConcursos")}
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="bg-saddle text-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/concursos"
            className="flex items-center gap-1 text-leather-light hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={16} />
            {t("concursoDetail.backToConcursos")}
          </Link>
          <h1 className="text-3xl font-heading font-bold">{competition.title}</h1>
          <p className="text-leather-light mt-1 flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {format(parseISO(competition.dateFrom), "MMM d", { locale: dateLocale })} –{" "}
              {format(parseISO(competition.dateTo), "MMM d, yyyy", { locale: dateLocale })}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {competition.location}
            </span>
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {competition.days.length > 1 && (
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <span className="text-sm font-semibold text-stable">
              {t("concursoDetail.daySelectorLabel")}
            </span>
            {competition.days.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                className={day.id === selectedDayId ? "btn-primary text-sm py-1.5" : "btn-secondary text-sm py-1.5"}
              >
                {day.dayLabel}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {selectedDay?.pruebas.map((prueba) => {
            const result = results[prueba.id];
            const slotColor =
              prueba.availableSlots === 0
                ? "text-red-600"
                : prueba.availableSlots <= 3
                  ? "text-gold"
                  : "text-forest";
            const slotLabel =
              prueba.availableSlots === 0
                ? t("concursoDetail.slotsSoldOut")
                : prueba.availableSlots <= 3
                  ? t("concursoDetail.slotsLow", { n: prueba.availableSlots })
                  : t("concursoDetail.slotsAvailable", { n: prueba.availableSlots });

            return (
              <PruebaCard
                key={prueba.id}
                name={prueba.name}
                category={prueba.category}
                priceArs={prueba.priceArs}
                slotColor={slotColor}
                slotLabel={slotLabel}
                onToggle={() => setExpandedEventId(expandedEventId === prueba.id ? null : prueba.id)}
                registerLabel={t("concursoDetail.registerButton")}
                priceLabel={t("concursoDetail.priceLabel")}
              >
                {expandedEventId === prueba.id && (
                  <InscripcionForm
                    eventId={prueba.id}
                    boxPriceArs={competition.boxPriceArs}
                    onResult={(r) => handleResult(prueba.id, r)}
                  />
                )}
                {result && <ResultBanner result={result} />}
              </PruebaCard>
            );
          })}
        </div>
      </div>

      <Footer />
    </>
  );
}

function PruebaCard({
  name,
  category,
  priceArs,
  slotColor,
  slotLabel,
  onToggle,
  registerLabel,
  priceLabel,
  children,
}: {
  name: string;
  category: string;
  priceArs: number;
  slotColor: string;
  slotLabel: string;
  onToggle: () => void;
  registerLabel: string;
  priceLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-dust/50 p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-heading font-bold text-stable">{name}</h3>
          <p className="text-sm text-stable-light">{category}</p>
          <p className="text-sm text-stable-light mt-1">
            {priceLabel}: <span className="font-semibold text-forest">${(priceArs / 100).toLocaleString("es-AR")}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${slotColor}`}>{slotLabel}</span>
          <button onClick={onToggle} className="btn-green text-sm py-2">
            {registerLabel}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function ResultBanner({ result }: { result: InscripcionResult }) {
  const { t } = useLanguage();
  const countdown = useCountdown(
    result.kind === "held" || result.kind === "payment_setup_error" ? result.holdsUntil : null
  );

  if (result.kind === "held") {
    return (
      <div className="mt-3 bg-gold/10 border border-gold/30 rounded-lg p-4 text-sm text-saddle-dark space-y-2">
        <p className="flex items-center gap-2">
          <Clock3 size={16} className="shrink-0" />
          {t("inscripcionHold.bannerText", { time: countdown ?? "..." })}
        </p>
        <a href={result.checkoutUrl} className="btn-primary text-sm py-2 inline-flex">
          {t("inscripcionHold.goToPayment")}
        </a>
      </div>
    );
  }

  if (result.kind === "payment_setup_error") {
    return (
      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-start gap-2">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <span>
          {t("inscripcionHold.paymentSetupError")} ({countdown})
        </span>
      </div>
    );
  }

  if (result.kind === "waitlisted") {
    return (
      <div className="mt-3 bg-gold/10 border border-gold/30 rounded-lg p-4 text-sm text-saddle-dark flex items-center gap-2">
        <Clock3 size={16} className="shrink-0" />
        {t("inscripcionHold.waitlistConfirmed")}
      </div>
    );
  }

  if (result.kind === "already_registered") {
    return (
      <div className="mt-3 bg-cream-dark rounded-lg p-4 text-sm text-stable flex items-center gap-2">
        <CheckCircle size={16} className="shrink-0" />
        {t("inscripcionHold.alreadyRegistered")}
      </div>
    );
  }

  return (
    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-center gap-2">
      <AlertCircle size={16} className="shrink-0" />
      {t("inscripcionHold.genericError")}
    </div>
  );
}
