"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import EventCard from "@/components/EventCard";
import { Event, categoryLabels, categoryIcons, EventCategory } from "@/types/event";
import { getEvents, getFeaturedEvents, initializeEvents } from "@/store/events";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Users,
  MapPin,
  Star,
  Shield,
  Zap,
} from "lucide-react";

export default function Home() {
  const [featured, setFeatured] = useState<Event[]>([]);
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initializeEvents();
    setFeatured(getFeaturedEvents());
    setUpcoming(
      getEvents()
        .filter((e) => e.status === "upcoming")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6)
    );
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <span className="text-6xl block mb-4 animate-bounce">🐴</span>
          <p className="text-stable-light font-heading text-lg">
            Saddling up...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <HeroSection />

      {/* Featured Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="horseshoe-divider text-sm font-heading mb-2 w-48">
              FEATURED
            </div>
            <h2 className="text-3xl font-heading font-bold text-stable">
              Featured Events
            </h2>
          </div>
          <Link
            href="/events"
            className="hidden sm:flex items-center gap-1 text-saddle font-semibold hover:text-saddle-light transition-colors"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="space-y-6">
          {featured.map((event) => (
            <EventCard key={event.id} event={event} featured />
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="horseshoe-divider text-sm font-heading mb-2 max-w-xs mx-auto">
              UPCOMING
            </div>
            <h2 className="text-3xl font-heading font-bold text-stable mb-3">
              Upcoming Events
            </h2>
            <p className="text-stable-light max-w-lg mx-auto">
              Don&apos;t miss out on these exciting equestrian events happening
              soon
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/events" className="btn-primary">
              Browse All Events
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="horseshoe-divider text-sm font-heading mb-2 max-w-xs mx-auto">
            CATEGORIES
          </div>
          <h2 className="text-3xl font-heading font-bold text-stable mb-3">
            Explore by Category
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Link
              key={key}
              href={`/events?category=${key}`}
              className="card-hover bg-white rounded-xl p-6 text-center border border-dust/50"
            >
              <span className="text-4xl block mb-3">
                {categoryIcons[key as EventCategory]}
              </span>
              <span className="font-heading font-semibold text-stable text-sm">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-stable text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-leather-light mb-3">
              Why Choose Equestrian Events?
            </h2>
            <p className="text-dust/80 max-w-lg mx-auto">
              Everything you need to discover, create, and manage equestrian
              events
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Calendar size={28} />,
                title: "Easy Event Creation",
                desc: "Create and publish your event in minutes with our intuitive event builder",
              },
              {
                icon: <Users size={28} />,
                title: "Guest Management",
                desc: "Track registrations, manage capacity, and communicate with attendees",
              },
              {
                icon: <MapPin size={28} />,
                title: "Local Discovery",
                desc: "Find events near you with powerful search and category filters",
              },
              {
                icon: <Shield size={28} />,
                title: "Secure Registration",
                desc: "Safe and reliable registration system with instant confirmation",
              },
            ].map((feature, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-xl bg-saddle flex items-center justify-center mx-auto mb-4 text-leather-light">
                  {feature.icon}
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-dust/70 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-saddle to-saddle-dark rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-4 right-8 text-8xl opacity-10">🐴</div>
          <h2 className="text-3xl font-heading font-bold mb-4">
            Ready to Host Your Own Event?
          </h2>
          <p className="text-leather-light mb-8 max-w-lg mx-auto">
            Create your equestrian event in minutes and reach riders from across
            the region
          </p>
          <Link href="/events/create" className="btn-green text-lg px-8 py-4">
            <Zap size={20} />
            Create Your Event
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
