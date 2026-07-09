"use client";

import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageContext";
import { FacebookIcon, InstagramIcon } from "@/components/icons/SocialIcons";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-dust mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo-white.png" alt="Club Hípico Argentino" width={48} height={48} className="h-12 w-12" />
              <span className="text-lg font-heading font-bold text-white">
                Club Hípico Argentino
              </span>
            </div>
            <p className="text-sm text-dust/70 leading-relaxed">
              {t("footer.tagline")}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://facebook.com/hipicoargentinofanpage"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-leather-light transition-colors"
              >
                <FacebookIcon size={20} />
              </a>
              <a
                href="https://instagram.com/clubhipicoargentino"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-leather-light transition-colors"
              >
                <InstagramIcon size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-leather-light mb-4">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/concursos" className="hover:text-leather-light transition-colors">
                  {t("footer.concursos")}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-leather-light transition-colors">
                  {t("footer.adminPanel")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-leather-light mb-4">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:secretaria@clubhipicoargentino.org.ar"
                  className="hover:text-leather-light transition-colors"
                >
                  secretaria@clubhipicoargentino.org.ar
                </a>
              </li>
              <li>
                <a href="tel:+541147871003" className="hover:text-leather-light transition-colors">
                  +54 11-4787-1003
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-dust/50">
          <p>&copy; {year} Club Hípico Argentino. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
