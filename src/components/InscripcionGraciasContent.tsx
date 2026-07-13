"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock3, XCircle, Printer } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface RegistrationStatusResponse {
  status: "pending_payment" | "confirmed" | "cancelled" | "waitlisted";
  eventName: string | null;
  competitionTitle: string | null;
  participantName: string | null;
  horseName: string | null;
  confirmedAt: string | null;
}

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 45000;

export default function InscripcionGraciasContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<RegistrationStatusResponse | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    startedAtRef.current = Date.now();

    const poll = async () => {
      try {
        const res = await fetch(`/api/registrations/${id}`);
        if (!res.ok) return;
        const body: RegistrationStatusResponse = await res.json();
        if (cancelled) return;
        setData(body);

        if (body.status === "pending_payment") {
          if (Date.now() - (startedAtRef.current ?? Date.now()) >= POLL_TIMEOUT_MS) {
            setTimedOut(true);
          } else {
            setTimeout(poll, POLL_INTERVAL_MS);
          }
        }
      } catch {
        if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return <StatusCard icon={<XCircle size={48} className="text-red-500" />} title={t("inscripcionGracias.cancelledTitle")} />;
  }

  if (!data) {
    return (
      <StatusCard
        icon={<span className="text-5xl animate-bounce">🐴</span>}
        title={t("inscripcionGracias.waitingTitle")}
        desc={t("inscripcionGracias.waitingDesc")}
      />
    );
  }

  if (data.status === "confirmed") {
    return (
      <div className="bg-white rounded-xl border border-dust/50 p-8 max-w-md mx-auto text-center">
        <CheckCircle size={48} className="text-forest mx-auto mb-4" />
        <h2 className="font-heading text-2xl font-bold text-stable mb-4">
          {t("inscripcionGracias.confirmedTitle")}
        </h2>
        <dl className="text-left text-sm space-y-2 border-t border-dust/30 pt-4">
          <Row label={t("inscripcionGracias.competition")} value={data.competitionTitle} />
          <Row label={t("inscripcionGracias.prueba")} value={data.eventName} />
          <Row
            label={t("inscripcionGracias.binomio")}
            value={[data.participantName, data.horseName].filter(Boolean).join(" / ")}
          />
          {data.confirmedAt && (
            <Row label={t("inscripcionGracias.confirmedAtLabel")} value={data.confirmedAt} />
          )}
        </dl>
        <button onClick={() => window.print()} className="btn-secondary mt-6 text-sm">
          <Printer size={16} />
          {t("inscripcionGracias.printButton")}
        </button>
      </div>
    );
  }

  if (data.status === "cancelled") {
    return (
      <StatusCard
        icon={<XCircle size={48} className="text-red-500" />}
        title={t("inscripcionGracias.cancelledTitle")}
        desc={t("inscripcionGracias.cancelledDesc")}
        action={
          <Link href="/concursos" className="btn-primary mt-4 inline-flex">
            {t("inscripcionGracias.retryButton")}
          </Link>
        }
      />
    );
  }

  if (timedOut) {
    return (
      <StatusCard
        icon={<Clock3 size={48} className="text-gold" />}
        title={t("inscripcionGracias.timeoutTitle")}
        desc={t("inscripcionGracias.timeoutDesc")}
      />
    );
  }

  return (
    <StatusCard
      icon={<span className="text-5xl animate-bounce">🐴</span>}
      title={t("inscripcionGracias.waitingTitle")}
      desc={t("inscripcionGracias.waitingDesc")}
    />
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stable-light">{label}</dt>
      <dd className="font-semibold text-stable text-right">{value}</dd>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-dust/50 p-10 max-w-md mx-auto text-center">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h2 className="font-heading text-xl font-bold text-stable mb-2">{title}</h2>
      {desc && <p className="text-stable-light text-sm">{desc}</p>}
      {action}
    </div>
  );
}
