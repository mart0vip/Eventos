"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegistrationModal from "@/components/RegistrationModal";
import { Event, categoryLabels, categoryIcons } from "@/types/event";
import { getEvent, getEvents, initializeEvents } from "@/store/events";
import EventCard from "@/components/EventCard";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Ticket,
  Share2,
  ArrowLeft,
  Tag,
  User,
  CheckCircle,
} from "lucide-react";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [related, setRelated] = useState<Event[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    initializeEvents();
    const id = params.id as string;
    const found = getEvent(id);
    if (found) {
      setEvent(found);
      const allEvents = getEvents();
      setRelated(
        allEvents
          .filter((e) => e.category === found.category && e.id !== found.id)
          .slice(0, 3)
      );
    }
    setLoaded(true);
  }, [params.id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegistrationSuccess = () => {
    setShowModal(false);
    setRegistered(true);
    const updated = getEvent(params.id as string);
    if (updated) setEvent(updated);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <span className="text-5xl animate-bounce">🐴</span>
      </div>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <span className="text-6xl mb-4">🐴</span>
          <h2 className="font-heading text-2xl font-bold text-stable mb-2">
            Event Not Found
          </h2>
          <p className="text-stable-light mb-6">
            This event may have been removed or the link is incorrect.
          </p>
          <Link href="/events" className="btn-primary">
            <ArrowLeft size={16} />
            Back to Events
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const spotsLeft = event.capacity - event.registered;
  const percentFilled = (event.registered / event.capacity) * 100;

  return (
    <>
      <Navbar />

      {/* Hero Image */}
      <div className="relative h-72 md:h-96">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stable/80 via-stable/30 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <span className="category-badge bg-white/90 text-saddle-dark mb-2 inline-block">
            {categoryIcons[event.category]} {categoryLabels[event.category]}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 md:p-8 border border-dust/50 mb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-stable">
                  {event.title}
                </h1>
                <button
                  onClick={handleShare}
                  className="shrink-0 p-2 rounded-lg border border-dust hover:border-saddle hover:text-saddle transition-colors relative"
                >
                  <Share2 size={18} />
                  {copied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-stable text-white px-2 py-1 rounded whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
              </div>

              {event.isFeatured && (
                <span className="inline-flex items-center gap-1 text-gold text-sm font-semibold mb-4">
                  <span>FEATURED EVENT</span>
                </span>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3 p-3 bg-cream-dark rounded-lg">
                  <Calendar size={20} className="text-saddle mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-stable text-sm">Date</p>
                    <p className="text-stable-light text-sm">
                      {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                      {event.endDate && (
                        <>
                          <br />
                          to {format(new Date(event.endDate), "EEEE, MMMM d, yyyy")}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-cream-dark rounded-lg">
                  <Clock size={20} className="text-saddle mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-stable text-sm">Time</p>
                    <p className="text-stable-light text-sm">
                      {event.time}
                      {event.endTime && ` - ${event.endTime}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-cream-dark rounded-lg">
                  <MapPin size={20} className="text-saddle mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-stable text-sm">Location</p>
                    <p className="text-stable-light text-sm">{event.location}</p>
                    <p className="text-stable-light/70 text-xs">{event.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-cream-dark rounded-lg">
                  <User size={20} className="text-saddle mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-stable text-sm">
                      Organizer
                    </p>
                    <p className="text-stable-light text-sm">
                      {event.organizer}
                    </p>
                  </div>
                </div>
              </div>

              <div className="horseshoe-divider text-sm font-heading mb-4">
                ABOUT THIS EVENT
              </div>

              <div className="prose prose-sm max-w-none text-stable-light leading-relaxed whitespace-pre-line">
                {event.description}
              </div>

              {event.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cream-dark text-sm text-stable-light"
                    >
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Related Events */}
            {related.length > 0 && (
              <div>
                <h3 className="font-heading text-xl font-bold text-stable mb-4">
                  Similar Events
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {related.map((e) => (
                    <EventCard key={e.id} event={e} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-dust/50 overflow-hidden sticky top-20">
              <div className="bg-saddle text-white p-6">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={20} />
                  <span className="text-3xl font-bold font-heading">
                    {event.price === 0 ? "FREE" : `$${event.price}`}
                  </span>
                </div>
                <p className="text-leather-light text-sm">per person</p>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="flex items-center gap-1 text-stable-light">
                      <Users size={14} />
                      Capacity
                    </span>
                    <span className="font-semibold text-stable">
                      {event.registered} / {event.capacity}
                    </span>
                  </div>
                  <div className="progress-bar h-2">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(percentFilled, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-stable-light mt-1">
                    {spotsLeft > 0
                      ? `${spotsLeft} spots remaining`
                      : "This event is sold out"}
                  </p>
                </div>

                {registered ? (
                  <div className="bg-forest/10 rounded-xl p-4 text-center">
                    <CheckCircle
                      size={32}
                      className="text-forest mx-auto mb-2"
                    />
                    <p className="font-heading font-bold text-forest mb-1">
                      You&apos;re Registered!
                    </p>
                    <p className="text-sm text-forest/70">
                      Check your email for confirmation
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowModal(true)}
                    disabled={spotsLeft === 0}
                    className="btn-green w-full justify-center py-3.5 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Ticket size={20} />
                    {spotsLeft === 0 ? "Sold Out" : "Register Now"}
                  </button>
                )}

                <div className="mt-4 pt-4 border-t border-dust/30 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-stable-light">
                    <Calendar size={14} className="text-saddle shrink-0" />
                    <span>
                      {format(new Date(event.date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stable-light">
                    <Clock size={14} className="text-saddle shrink-0" />
                    <span>
                      {event.time}
                      {event.endTime && ` - ${event.endTime}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stable-light">
                    <MapPin size={14} className="text-saddle shrink-0" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <RegistrationModal
          event={event}
          onClose={() => setShowModal(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      <Footer />
    </>
  );
}
