"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";

const footerCategories = [
  "show-jumping",
  "dressage",
  "cross-country",
  "trail-ride",
  "polo",
] as const;

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-stable text-dust mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🐴</span>
              <span className="text-xl font-heading font-bold text-leather-light">
                Equestrian Events
              </span>
            </div>
            <p className="text-sm text-dust/70 leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <h4 className="font-heading font-bold text-leather-light mb-4">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/events" className="hover:text-leather-light transition-colors">
                  {t("footer.browseEvents")}
                </Link>
              </li>
              <li>
                <Link href="/events/create" className="hover:text-leather-light transition-colors">
                  {t("footer.createEvent")}
                </Link>
              </li>
              <li>
                <Link href="/my-events" className="hover:text-leather-light transition-colors">
                  {t("footer.myRegistrations")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-leather-light mb-4">
              {t("footer.eventTypes")}
            </h4>
            <ul className="space-y-2 text-sm">
              {footerCategories.map((cat) => (
                <li key={cat}>{t(`categories.${cat}`)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-leather-light mb-4">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>info@equestrianevents.com</li>
              <li>+1 (555) HORSE-01</li>
              <li>Wellington, FL</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-dust/50">
          <p>&copy; 2026 Equestrian Events. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
