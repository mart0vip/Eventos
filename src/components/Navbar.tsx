"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Calendar, Plus, Home, User } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <nav className="bg-stable text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🐴</span>
            <div>
              <span className="text-xl font-heading font-bold text-leather-light tracking-wide">
                Equestrian Events
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-dust hover:text-white hover:bg-stable-light transition-colors"
            >
              <Home size={16} />
              {t("nav.home")}
            </Link>
            <Link
              href="/events"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-dust hover:text-white hover:bg-stable-light transition-colors"
            >
              <Calendar size={16} />
              {t("nav.events")}
            </Link>
            <Link
              href="/my-events"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-dust hover:text-white hover:bg-stable-light transition-colors"
            >
              <User size={16} />
              {t("nav.myEvents")}
            </Link>
            <Link href="/events/create" className="btn-primary ml-2 text-sm py-2">
              <Plus size={16} />
              {t("nav.createEvent")}
            </Link>
            <div className="ml-2 pl-2 border-l border-white/10">
              <LanguageSelector />
            </div>
          </div>

          <div className="md:hidden flex items-center gap-1">
            <LanguageSelector />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-stable-light transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-stable-light border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-dust hover:text-white hover:bg-stable transition-colors"
            >
              <Home size={18} />
              {t("nav.home")}
            </Link>
            <Link
              href="/events"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-dust hover:text-white hover:bg-stable transition-colors"
            >
              <Calendar size={18} />
              {t("nav.browseEvents")}
            </Link>
            <Link
              href="/my-events"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-dust hover:text-white hover:bg-stable transition-colors"
            >
              <User size={18} />
              {t("nav.myEvents")}
            </Link>
            <Link
              href="/events/create"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-saddle text-white hover:bg-saddle-light transition-colors"
            >
              <Plus size={18} />
              {t("nav.createEvent")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
