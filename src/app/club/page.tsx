"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage, useDateLocale } from "@/i18n/LanguageContext";
import {
  getEvents,
  getRegistrations,
  getWaitlist,
  promoteFromWaitlist,
  cancelRegistration,
  updateEvent,
  initializeEvents,
} from "@/store/events";
import { downloadCsv } from "@/lib/csv";
import { Event, EventCategory, Registration, categoryIcons } from "@/types/event";
import { format, parseISO } from "date-fns";
import {
  Users,
  Download,
  Clock3,
  ArrowUpCircle,
  XCircle,
  CalendarClock,
} from "lucide-react";

const categoryValues: EventCategory[] = [
  "show-jumping",
  "dressage",
  "cross-country",
  "polo",
  "rodeo",
  "trail-ride",
  "clinic",
  "auction",
  "social",
  "other",
];

export default function ClubPanelPage() {
  const { t } = useLanguage();
  const dateLocale = useDateLocale();
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  const refresh = () => {
    setEvents(getEvents());
    setRegistrations(getRegistrations());
  };

  useEffect(() => {
    initializeEvents();
    refresh();
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const categorySummary = useMemo(() => {
    return categoryValues.map((category) => {
      const eventIds = events
        .filter((e) => e.category === category)
        .map((e) => e.id);
      const confirmed = registrations.filter(
        (r) => eventIds.includes(r.eventId) && r.status === "confirmed"
      ).length;
      const waitlisted = registrations.filter(
        (r) => eventIds.includes(r.eventId) && r.status === "waitlisted"
      ).length;
      return { category, confirmed, waitlisted };
    });
  }, [events, registrations]);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;
  const confirmedRegistrants = registrations
    .filter((r) => r.eventId === selectedEventId && r.status === "confirmed")
    .sort(
      (a, b) =>
        parseISO(a.registeredAt).getTime() - parseISO(b.registeredAt).getTime()
    );
  const waitlistRegistrants = selectedEventId ? getWaitlist(selectedEventId) : [];

  const isExpired = (dateStr: string) => {
    if (!dateStr) return false;
    return parseISO(dateStr).getTime() < new Date().setHours(0, 0, 0, 0);
  };

  const formatExpiry = (dateStr: string) => {
    if (!dateStr) return "—";
    return format(parseISO(dateStr), "MMM d, yyyy", { locale: dateLocale });
  };

  const handlePromote = (id: string) => {
    promoteFromWaitlist(id);
    refresh();
  };

  const handleCancel = (id: string) => {
    cancelRegistration(id);
    refresh();
  };

  const handleToggleAutoPromote = (checked: boolean) => {
    if (!selectedEvent) return;
    updateEvent(selectedEvent.id, { autoPromoteWaitlist: checked });
    refresh();
  };

  const handleExport = () => {
    if (!selectedEvent) return;
    const rows = confirmedRegistrants.map((r) => ({
      [t("club.colName")]: r.name,
      [t("club.colEmail")]: r.email,
      [t("club.colPhone")]: r.phone,
      [t("club.colHorse")]: r.horseName,
      [t("club.colInsurance")]: r.insuranceExpiry,
      [t("club.colHealthBooklet")]: r.healthBookletExpiry,
      [t("club.colTickets")]: r.tickets,
      [t("club.colNotes")]: r.notes,
      [t("club.colRegisteredAt")]: r.registeredAt,
    }));
    const slug = selectedEvent.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    downloadCsv(`inscriptos-${slug}`, rows);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <span className="text-5xl animate-bounce">🐴</span>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className="bg-saddle text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-heading font-bold">{t("club.title")}</h1>
          <p className="text-leather-light mt-1">{t("club.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Category summary */}
        <section>
          <h2 className="font-heading text-xl font-bold text-stable mb-4">
            {t("club.byCategoryTitle")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categorySummary.map(({ category, confirmed, waitlisted }) => (
              <div
                key={category}
                className="bg-white rounded-xl p-4 border border-dust/50 text-center"
              >
                <span className="text-2xl block mb-1">{categoryIcons[category]}</span>
                <p className="text-xs font-semibold text-stable-light mb-2">
                  {t(`categories.${category}`)}
                </p>
                <p className="text-lg font-bold text-forest">{confirmed}</p>
                <p className="text-[11px] text-stable-light">{t("club.confirmedCount")}</p>
                {waitlisted > 0 && (
                  <p className="text-xs text-gold mt-1">
                    +{waitlisted} {t("club.waitlistCount")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Event selector + detail */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <label className="text-sm font-semibold text-stable shrink-0">
              {t("club.selectEvent")}
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="input-field sm:max-w-md"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {categoryIcons[e.category]} {e.title}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="space-y-8">
              <div className="bg-white rounded-xl p-5 border border-dust/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-heading text-lg font-bold text-stable">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-sm text-stable-light flex items-center gap-1.5 mt-1">
                    <Users size={14} className="text-saddle" />
                    {selectedEvent.registered} / {selectedEvent.capacity} · {confirmedRegistrants.length}{" "}
                    {t("club.confirmedCount")}
                    {waitlistRegistrants.length > 0 &&
                      ` · ${waitlistRegistrants.length} ${t("club.waitlistCount")}`}
                  </p>
                </div>
                <button onClick={handleExport} className="btn-secondary text-sm">
                  <Download size={16} />
                  {t("club.exportSheet")}
                </button>
              </div>

              {/* Confirmed table */}
              <div>
                <h4 className="font-heading font-bold text-stable mb-3">
                  {t("club.confirmedRegistrants")}
                </h4>
                {confirmedRegistrants.length === 0 ? (
                  <p className="text-sm text-stable-light">{t("club.noConfirmed")}</p>
                ) : (
                  <div className="overflow-x-auto bg-white rounded-xl border border-dust/50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dust/30 text-left text-stable-light">
                          <th className="p-3 font-semibold">{t("club.colName")}</th>
                          <th className="p-3 font-semibold">{t("club.colEmail")}</th>
                          <th className="p-3 font-semibold">{t("club.colHorse")}</th>
                          <th className="p-3 font-semibold">{t("club.colInsurance")}</th>
                          <th className="p-3 font-semibold">{t("club.colHealthBooklet")}</th>
                          <th className="p-3 font-semibold">{t("club.colTickets")}</th>
                          <th className="p-3 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {confirmedRegistrants.map((r) => (
                          <tr key={r.id} className="border-b border-dust/20 last:border-0">
                            <td className="p-3 text-stable font-medium">{r.name}</td>
                            <td className="p-3 text-stable-light">{r.email}</td>
                            <td className="p-3 text-stable-light">{r.horseName}</td>
                            <td
                              className={`p-3 ${isExpired(r.insuranceExpiry) ? "text-red-600 font-semibold" : "text-stable-light"}`}
                            >
                              {formatExpiry(r.insuranceExpiry)}
                              {isExpired(r.insuranceExpiry) && ` (${t("club.expired")})`}
                            </td>
                            <td
                              className={`p-3 ${isExpired(r.healthBookletExpiry) ? "text-red-600 font-semibold" : "text-stable-light"}`}
                            >
                              {formatExpiry(r.healthBookletExpiry)}
                              {isExpired(r.healthBookletExpiry) && ` (${t("club.expired")})`}
                            </td>
                            <td className="p-3 text-stable-light">{r.tickets}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleCancel(r.id)}
                                className="text-red-500 hover:text-red-700 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                              >
                                <XCircle size={14} />
                                {t("club.cancelAction")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Waitlist */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading font-bold text-stable flex items-center gap-2">
                    <Clock3 size={18} className="text-gold" />
                    {t("club.waitlistRegistrants")}
                  </h4>
                  <label className="flex items-center gap-2 text-sm text-stable-light cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!selectedEvent.autoPromoteWaitlist}
                      onChange={(e) => handleToggleAutoPromote(e.target.checked)}
                      className="w-4 h-4 accent-saddle"
                    />
                    <CalendarClock size={14} />
                    {t("club.autoPromoteLabel")}
                  </label>
                </div>

                {waitlistRegistrants.length === 0 ? (
                  <p className="text-sm text-stable-light">{t("club.noWaitlist")}</p>
                ) : (
                  <div className="overflow-x-auto bg-white rounded-xl border border-dust/50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-dust/30 text-left text-stable-light">
                          <th className="p-3 font-semibold">#</th>
                          <th className="p-3 font-semibold">{t("club.colName")}</th>
                          <th className="p-3 font-semibold">{t("club.colEmail")}</th>
                          <th className="p-3 font-semibold">{t("club.colHorse")}</th>
                          <th className="p-3 font-semibold">{t("club.colTickets")}</th>
                          <th className="p-3 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {waitlistRegistrants.map((r, i) => (
                          <tr key={r.id} className="border-b border-dust/20 last:border-0">
                            <td className="p-3 text-stable-light">{i + 1}</td>
                            <td className="p-3 text-stable font-medium">{r.name}</td>
                            <td className="p-3 text-stable-light">{r.email}</td>
                            <td className="p-3 text-stable-light">{r.horseName}</td>
                            <td className="p-3 text-stable-light">{r.tickets}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handlePromote(r.id)}
                                className="text-forest hover:text-forest-light transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                              >
                                <ArrowUpCircle size={14} />
                                {t("club.promote")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}
