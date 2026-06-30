"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import EventCard from "@/components/EventCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Event } from "@/types/event";
import { getEvents, initializeEvents, searchEvents } from "@/store/events";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

type SortOption = "date-asc" | "date-desc" | "price-asc" | "price-desc" | "popular";

export default function EventsContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sort, setSort] = useState<SortOption>("date-asc");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    initializeEvents();
    setEvents(getEvents());
    setLoaded(true);
  }, []);

  const filteredEvents = useMemo(() => {
    let result = query ? searchEvents(query) : [...events];

    if (category !== "all") {
      result = result.filter((e) => e.category === category);
    }

    if (priceFilter === "free") {
      result = result.filter((e) => e.price === 0);
    } else if (priceFilter === "paid") {
      result = result.filter((e) => e.price > 0);
    }

    switch (sort) {
      case "date-asc":
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case "date-desc":
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        result.sort((a, b) => b.registered - a.registered);
        break;
    }

    return result;
  }, [events, query, category, sort, priceFilter]);

  if (!loaded) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="text-5xl animate-bounce">🐴</span>
      </div>
    );
  }

  return (
    <>
      <div className="bg-saddle text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-heading font-bold mb-2">Browse Events</h1>
          <p className="text-leather-light">Find the perfect equestrian event for you</p>

          <div className="mt-6 flex gap-2">
            <div className="relative flex-1 max-w-xl">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stable-light" />
              <input
                type="text"
                placeholder="Search events..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input-field pl-11"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary border-white/30 text-white hover:bg-white/10 ${showFilters ? "bg-white/10" : ""}`}
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showFilters && (
          <div className="bg-white rounded-xl p-6 mb-6 border border-dust/50 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-stable mb-2">
                  <ArrowUpDown size={14} className="inline mr-1" />
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="input-field"
                >
                  <option value="date-asc">Date (Soonest First)</option>
                  <option value="date-desc">Date (Latest First)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stable mb-2">Price</label>
                <div className="flex gap-2">
                  {(["all", "free", "paid"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPriceFilter(opt)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        priceFilter === opt
                          ? "bg-saddle text-white"
                          : "bg-cream-dark text-stable-light hover:text-saddle"
                      }`}
                    >
                      {opt === "all" ? "All Prices" : opt === "free" ? "Free" : "Paid"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-stable-light text-sm">
            Showing <span className="font-bold text-stable">{filteredEvents.length}</span>{" "}
            event{filteredEvents.length !== 1 ? "s" : ""}
            {query && (
              <span>
                {" "}for &ldquo;<span className="text-saddle">{query}</span>&rdquo;
              </span>
            )}
          </p>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl block mb-4">🐴</span>
            <h3 className="font-heading text-xl font-bold text-stable mb-2">No events found</h3>
            <p className="text-stable-light mb-6">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("all");
                setPriceFilter("all");
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
