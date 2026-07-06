"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CompetitionCard from "@/components/CompetitionCard";
import { CompetitionListItem } from "@/lib/db/queries/competitions";
import { useLanguage } from "@/i18n/LanguageContext";

export default function ConcursosPage() {
  const { t } = useLanguage();
  const [competitions, setCompetitions] = useState<CompetitionListItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/competitions")
      .then((res) => res.json())
      .then((data: CompetitionListItem[]) => setCompetitions(data))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <>
      <Navbar />

      <div className="bg-saddle text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-heading font-bold">{t("concursos.title")}</h1>
          <p className="text-leather-light mt-1">{t("concursos.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loaded ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <span className="text-5xl animate-bounce">🐴</span>
          </div>
        ) : competitions.length === 0 ? (
          <p className="text-center text-stable-light py-16">{t("concursos.emptyState")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {competitions.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
