"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export type InscripcionResult =
  | { kind: "held"; registrationId: string; checkoutUrl: string; holdsUntil: string }
  | { kind: "waitlisted"; waitlistId: string }
  | { kind: "already_registered" }
  | { kind: "payment_setup_error"; registrationId: string; holdsUntil: string }
  | { kind: "error" };

interface InscripcionFormProps {
  eventId: string;
  boxPriceArs: number;
  onResult: (result: InscripcionResult) => void;
}

/** Inline, per-prueba registration form (spec: "formulario de inscripción expandible por prueba"). */
export default function InscripcionForm({ eventId, boxPriceArs, onResult }: InscripcionFormProps) {
  const { t } = useLanguage();
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [horseName, setHorseName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [boxRequested, setBoxRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          participantName,
          participantEmail,
          horseName,
          licenseNumber: licenseNumber || undefined,
          boxRequested,
        }),
      });
      const body = await response.json();

      if (response.status === 201) {
        onResult({
          kind: "held",
          registrationId: body.registrationId,
          checkoutUrl: body.checkoutUrl,
          holdsUntil: body.holdsUntil,
        });
      } else if (response.status === 200 && body.status === "waitlisted") {
        onResult({ kind: "waitlisted", waitlistId: body.waitlistId });
      } else if (response.status === 409 && body.error === "already_registered") {
        onResult({ kind: "already_registered" });
      } else if (response.status === 502 && body.error === "payment_provider_error") {
        onResult({
          kind: "payment_setup_error",
          registrationId: body.registrationId,
          holdsUntil: body.holdsUntil,
        });
      } else {
        onResult({ kind: "error" });
      }
    } catch {
      onResult({ kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-cream-dark rounded-xl p-4 mt-3">
      <div>
        <label className="block text-sm font-semibold text-stable mb-1.5">
          {t("inscripcionForm.fullName")}
        </label>
        <input
          type="text"
          required
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          placeholder={t("inscripcionForm.fullNamePlaceholder")}
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-stable mb-1.5">
          {t("inscripcionForm.email")}
        </label>
        <input
          type="email"
          required
          value={participantEmail}
          onChange={(e) => setParticipantEmail(e.target.value)}
          placeholder={t("inscripcionForm.emailPlaceholder")}
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-stable mb-1.5">
          {t("inscripcionForm.horseName")}
        </label>
        <input
          type="text"
          required
          value={horseName}
          onChange={(e) => setHorseName(e.target.value)}
          placeholder={t("inscripcionForm.horseNamePlaceholder")}
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-stable mb-1.5">
          {t("inscripcionForm.licenseNumber")}
        </label>
        <input
          type="text"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          className="input-field"
        />
        <p className="text-xs text-stable-light mt-1">{t("inscripcionForm.licenseNumberHelper")}</p>
      </div>

      {boxPriceArs > 0 && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={boxRequested}
            onChange={(e) => setBoxRequested(e.target.checked)}
            className="w-4 h-4 accent-saddle"
          />
          <span className="text-sm font-medium text-stable">
            {t("inscripcionForm.boxCheckbox", { price: (boxPriceArs / 100).toLocaleString("es-AR") })}
          </span>
        </label>
      )}

      <button type="submit" disabled={submitting} className="btn-green w-full justify-center disabled:opacity-50">
        <Ticket size={18} />
        {submitting ? t("inscripcionForm.submitting") : t("inscripcionForm.submit")}
      </button>
    </form>
  );
}
