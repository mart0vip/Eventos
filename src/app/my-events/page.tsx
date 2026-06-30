"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Registration, Event } from "@/types/event";
import {
  getRegistrations,
  getEvent,
  cancelRegistration,
  initializeEvents,
} from "@/store/events";
import { format } from "date-fns";
import Link from "next/link";
import {
  Ticket,
  Calendar,
  MapPin,
  XCircle,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface RegistrationWithEvent extends Registration {
  event?: Event;
}

export default function MyEventsPage() {
  const [registrations, setRegistrations] = useState<RegistrationWithEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  useEffect(() => {
    initializeEvents();
    loadRegistrations();
    setLoaded(true);
  }, []);

  const loadRegistrations = () => {
    const regs = getRegistrations();
    const enriched: RegistrationWithEvent[] = regs.map((r) => ({
      ...r,
      event: getEvent(r.eventId),
    }));
    enriched.sort(
      (a, b) =>
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
    );
    setRegistrations(enriched);
  };

  const handleCancel = (id: string) => {
    cancelRegistration(id);
    setCancelId(null);
    loadRegistrations();
  };

  const confirmed = registrations.filter((r) => r.status === "confirmed");
  const cancelled = registrations.filter((r) => r.status === "cancelled");

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-heading font-bold">My Events</h1>
          <p className="text-leather-light mt-1">
            View and manage your event registrations
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-dust/50 text-center">
            <p className="text-2xl font-bold text-forest">{confirmed.length}</p>
            <p className="text-sm text-stable-light">Active</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-dust/50 text-center">
            <p className="text-2xl font-bold text-stable">
              {registrations.length}
            </p>
            <p className="text-sm text-stable-light">Total</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-dust/50 text-center">
            <p className="text-2xl font-bold text-red-500">
              {cancelled.length}
            </p>
            <p className="text-sm text-stable-light">Cancelled</p>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">🐴</span>
            <h3 className="font-heading text-xl font-bold text-stable mb-2">
              No Registrations Yet
            </h3>
            <p className="text-stable-light mb-6">
              Browse our events and register for something exciting!
            </p>
            <Link href="/events" className="btn-primary">
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className={`bg-white rounded-xl border overflow-hidden ${
                  reg.status === "cancelled"
                    ? "border-red-200 opacity-60"
                    : "border-dust/50"
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  {reg.event && (
                    <div className="sm:w-48 h-32 sm:h-auto shrink-0">
                      <img
                        src={reg.event.image}
                        alt={reg.event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {reg.status === "confirmed" ? (
                            <CheckCircle
                              size={16}
                              className="text-forest shrink-0"
                            />
                          ) : (
                            <XCircle
                              size={16}
                              className="text-red-500 shrink-0"
                            />
                          )}
                          <span
                            className={`text-xs font-bold uppercase ${
                              reg.status === "confirmed"
                                ? "text-forest"
                                : "text-red-500"
                            }`}
                          >
                            {reg.status}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-stable text-lg">
                          {reg.event?.title || "Unknown Event"}
                        </h3>
                      </div>

                      {reg.event && (
                        <Link
                          href={`/events/${reg.eventId}`}
                          className="shrink-0 p-2 rounded-lg border border-dust hover:border-saddle hover:text-saddle transition-colors"
                        >
                          <ExternalLink size={16} />
                        </Link>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-sm text-stable-light">
                      {reg.event && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-saddle" />
                            <span>
                              {format(new Date(reg.event.date), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-saddle" />
                            <span className="truncate">
                              {reg.event.location}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Ticket size={13} className="text-saddle" />
                        <span>
                          {reg.tickets} ticket{reg.tickets > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-saddle" />
                        <span>
                          {format(
                            new Date(reg.registeredAt),
                            "MMM d, h:mm a"
                          )}
                        </span>
                      </div>
                    </div>

                    {reg.status === "confirmed" && (
                      <div className="mt-4 flex gap-2">
                        {cancelId === reg.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle size={14} />
                              Cancel this registration?
                            </span>
                            <button
                              onClick={() => handleCancel(reg.id)}
                              className="text-sm px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Yes, Cancel
                            </button>
                            <button
                              onClick={() => setCancelId(null)}
                              className="text-sm px-3 py-1 rounded-lg border border-dust hover:bg-cream-dark transition-colors"
                            >
                              No, Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCancelId(reg.id)}
                            className="text-sm text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
                          >
                            <XCircle size={14} />
                            Cancel Registration
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
