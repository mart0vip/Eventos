"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, DollarSign, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Event, categoryIcons } from "@/types/event";
import { useLanguage, useDateLocale } from "@/i18n/LanguageContext";

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

export default function EventCard({ event, featured = false }: EventCardProps) {
  const { t } = useLanguage();
  const dateLocale = useDateLocale();
  const spotsLeft = event.capacity - event.registered;
  const percentFilled = (event.registered / event.capacity) * 100;

  return (
    <Link href={`/events/${event.id}`}>
      <div
        className={`card-hover bg-white rounded-xl overflow-hidden border border-dust/50 ${
          featured ? "md:flex" : ""
        }`}
      >
        <div
          className={`relative ${featured ? "md:w-2/5 md:min-h-[280px]" : "h-48"}`}
        >
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className="category-badge">
              {categoryIcons[event.category]} {t(`categories.${event.category}`)}
            </span>
          </div>
          {event.isFeatured && (
            <div className="absolute top-3 right-3 bg-gold text-white text-xs font-bold px-2 py-1 rounded-full">
              {t("eventCard.featured")}
            </div>
          )}
          {spotsLeft <= 10 && spotsLeft > 0 && (
            <div className="absolute bottom-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {t("eventCard.spotsLeft", { n: spotsLeft })}
            </div>
          )}
          {spotsLeft === 0 && (
            <div className="absolute bottom-3 right-3 bg-stable text-white text-xs font-bold px-2 py-1 rounded-full">
              {t("eventCard.soldOut")}
            </div>
          )}
        </div>

        <div className={`p-5 ${featured ? "md:w-3/5 md:flex md:flex-col md:justify-between" : ""}`}>
          <div>
            <h3
              className={`font-heading font-bold text-stable mb-2 ${
                featured ? "text-xl" : "text-lg"
              }`}
            >
              {event.title}
            </h3>

            {featured && (
              <p className="text-stable-light text-sm mb-3 line-clamp-2">
                {event.description}
              </p>
            )}

            <div className="space-y-1.5 text-sm text-stable-light">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-saddle shrink-0" />
                <span>
                  {format(parseISO(event.date), "EEE, MMM d, yyyy", { locale: dateLocale })}
                  {event.endDate &&
                    ` - ${format(parseISO(event.endDate), "MMM d, yyyy", { locale: dateLocale })}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-saddle shrink-0" />
                <span>
                  {event.time}
                  {event.endTime && ` - ${event.endTime}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-saddle shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-dust/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <DollarSign size={14} className="text-forest" />
                <span className="font-bold text-forest">
                  {event.price === 0 ? t("eventCard.free") : `$${event.price}`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-stable-light">
                <Users size={14} />
                <span>
                  {event.registered}/{event.capacity}
                </span>
              </div>
            </div>
            <div className="progress-bar h-1.5">
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(percentFilled, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
