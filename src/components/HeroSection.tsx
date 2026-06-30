"use client";

import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/events?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <section className="relative min-h-[600px] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=1600&h=900&fit=crop')",
        }}
      />
      <div className="hero-gradient absolute inset-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-4xl">🐴</span>
            <span className="text-leather-light font-heading text-lg tracking-widest uppercase">
              Equestrian Events
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
            Discover Your Next{" "}
            <span className="text-leather-light">Equestrian</span> Adventure
          </h1>

          <p className="text-lg text-dust/90 mb-8 leading-relaxed">
            From championship show jumping to peaceful trail rides, find and
            manage equestrian events that match your passion. Create, share, and
            join a community of riders.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 mb-8">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stable-light"
              />
              <input
                type="text"
                placeholder="Search events, locations, or categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-11 py-3.5 rounded-lg shadow-lg"
              />
            </div>
            <button type="submit" className="btn-primary shadow-lg px-6">
              Search
            </button>
          </form>

          <div className="flex flex-wrap gap-3">
            <Link href="/events" className="btn-secondary bg-white/90 text-sm">
              Browse All Events
              <ArrowRight size={16} />
            </Link>
            <Link href="/events/create" className="btn-green text-sm">
              Create an Event
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream to-transparent" />
    </section>
  );
}
