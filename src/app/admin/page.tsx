"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnteprogramaTab from "@/components/admin/AnteprogramaTab";
import InscriptosTab from "@/components/admin/InscriptosTab";
import SorteoTab from "@/components/admin/SorteoTab";
import DeudaTab from "@/components/admin/DeudaTab";
import ExportarTab from "@/components/admin/ExportarTab";
import { useLanguage } from "@/i18n/LanguageContext";
import { adminFetch, getStoredAdminSecret, storeAdminSecret } from "@/lib/adminSecret";
import { Competition } from "@/types/competition";

type Tab = "anteprograma" | "inscriptos" | "sorteo" | "deuda" | "exportar";

function AdminPageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [secret, setSecret] = useState<string | null>(null);
  const [secretInput, setSecretInput] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [checking, setChecking] = useState(() =>
    Boolean(searchParams.get("secret") || getStoredAdminSecret())
  );
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState("");
  const [tab, setTab] = useState<Tab>("anteprograma");

  const refreshCompetitions = async (candidateSecret: string) => {
    const res = await adminFetch("/api/admin/competitions", candidateSecret);
    if (!res.ok) return false;
    setCompetitions(await res.json());
    return true;
  };

  const tryLogin = async (candidateSecret: string) => {
    setChecking(true);
    const ok = await refreshCompetitions(candidateSecret);
    if (ok) {
      storeAdminSecret(candidateSecret);
      setSecret(candidateSecret);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
    setChecking(false);
  };

  useEffect(() => {
    const fromQuery = searchParams.get("secret");
    const fromSession = getStoredAdminSecret();
    const candidate = fromQuery ?? fromSession;
    if (!candidate) return;

    adminFetch("/api/admin/competitions", candidate)
      .then(async (res) => {
        if (res.ok) {
          setCompetitions(await res.json());
          storeAdminSecret(candidate);
          setSecret(candidate);
          setLoginError(false);
        } else {
          setLoginError(true);
        }
        setChecking(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void tryLogin(secretInput);
  };

  if (checking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="text-5xl animate-bounce">🐴</span>
      </div>
    );
  }

  if (!secret) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <form onSubmit={handleLoginSubmit} className="bg-white rounded-xl border border-dust/50 p-8 max-w-sm w-full">
          <h2 className="font-heading text-xl font-bold text-stable mb-4">{t("admin.loginTitle")}</h2>
          <input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder={t("admin.loginPlaceholder")}
            className="input-field mb-3"
          />
          {loginError && <p className="text-sm text-red-600 mb-3">{t("admin.loginError")}</p>}
          <button type="submit" className="btn-primary w-full justify-center">
            {t("admin.loginButton")}
          </button>
        </form>
      </div>
    );
  }

  const tabs: { id: Tab; labelKey: string }[] = [
    { id: "anteprograma", labelKey: "admin.tabAnteprograma" },
    { id: "inscriptos", labelKey: "admin.tabInscriptos" },
    { id: "sorteo", labelKey: "admin.tabSorteo" },
    { id: "deuda", labelKey: "admin.tabDeuda" },
    { id: "exportar", labelKey: "admin.tabExportar" },
  ];

  const sharedProps = {
    secret,
    competitions,
    selectedCompetitionId,
    onSelectCompetition: setSelectedCompetitionId,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={tab === tabItem.id ? "btn-primary text-sm py-2" : "btn-secondary text-sm py-2"}
          >
            {t(tabItem.labelKey)}
          </button>
        ))}
      </div>

      {tab === "anteprograma" && (
        <AnteprogramaTab {...sharedProps} onCompetitionsChanged={() => refreshCompetitions(secret)} />
      )}
      {tab === "inscriptos" && <InscriptosTab {...sharedProps} />}
      {tab === "sorteo" && <SorteoTab {...sharedProps} />}
      {tab === "deuda" && <DeudaTab {...sharedProps} />}
      {tab === "exportar" && <ExportarTab {...sharedProps} />}
    </div>
  );
}

export default function AdminPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <span className="text-5xl animate-bounce">🐴</span>
          </div>
        }
      >
        <AdminPageContent />
      </Suspense>
      <Footer />
    </>
  );
}
