"use client";

import Link from "next/link";
import { Calendar, MapPin, ListChecks } from "lucide-react";
import { format, parseISO } from "date-fns";
import { CompetitionListItem } from "@/lib/db/queries/competitions";
import { useLanguage, useDateLocale } from "@/i18n/LanguageContext";

interface CompetitionCardProps {
  competition: CompetitionListItem;
}

export default function CompetitionCard({ competition }: CompetitionCardProps) {
  const { t } = useLanguage();
  const dateLocale = useDateLocale();

  const from = format(parseISO(competition.dateFrom), "MMM d", { locale: dateLocale });
  const to = format(parseISO(competition.dateTo), "MMM d, yyyy", { locale: dateLocale });

  return (
    <Link href={`/concursos/${competition.id}`}>
      <div className="card-hover bg-white rounded-xl overflow-hidden border border-dust/50 p-5">
        <h3 className="font-heading font-bold text-lg text-stable mb-2">
          {competition.title}
        </h3>
        <div className="space-y-1.5 text-sm text-stable-light">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-saddle shrink-0" />
            <span>{t("concursos.dateRange", { from, to })}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-saddle shrink-0" />
            <span className="truncate">{competition.location}</span>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-dust/30 flex items-center justify-between">
          <span className="flex items-center gap-1 text-sm text-forest font-semibold">
            <ListChecks size={14} />
            {t("concursos.pruebasAvailable", { n: competition.pruebaCount })}
          </span>
          <span className="text-sm font-semibold text-saddle">
            {t("concursos.viewDetail")}
          </span>
        </div>
      </div>
    </Link>
  );
}
