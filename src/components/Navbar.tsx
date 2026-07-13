"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Trophy, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import TopBar from "@/components/TopBar";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <>
      <TopBar />
      <nav className="bg-white text-stable shadow-sm sticky top-0 z-40 border-b border-dust">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/concursos" className="flex items-center gap-2">
              <img src="/logo.png" alt="Club Hípico Argentino" width={40} height={40} className="h-10 w-10" />
              <span className="text-lg font-heading font-bold text-stable tracking-wide hidden sm:block">
                Club Hípico Argentino
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/concursos"
                className="nav-link flex items-center gap-1.5 px-4 py-2 text-stable-light hover:text-saddle transition-colors"
              >
                <Trophy size={16} />
                {t("nav.concursos")}
              </Link>
              <Link
                href="/admin"
                className="nav-link flex items-center gap-1.5 px-4 py-2 text-stable-light hover:text-saddle transition-colors"
              >
                <ShieldCheck size={16} />
                {t("nav.adminPanel")}
              </Link>
              <div className="ml-2 pl-2 border-l border-dust">
                <LanguageSelector />
              </div>
            </div>

            <div className="md:hidden flex items-center gap-1">
              <LanguageSelector />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-stable hover:text-saddle transition-colors"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-white border-t border-dust">
            <div className="px-4 py-3 space-y-1">
              <Link
                href="/concursos"
                onClick={() => setIsOpen(false)}
                className="nav-link flex items-center gap-2 px-3 py-2 text-stable-light hover:text-saddle hover:bg-cream-dark transition-colors"
              >
                <Trophy size={18} />
                {t("nav.concursos")}
              </Link>
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="nav-link flex items-center gap-2 px-3 py-2 text-stable-light hover:text-saddle hover:bg-cream-dark transition-colors"
              >
                <ShieldCheck size={18} />
                {t("nav.adminPanel")}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
