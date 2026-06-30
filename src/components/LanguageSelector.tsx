"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Language } from "@/i18n/translations";

const options: { value: Language; flag: string; label: string }[] = [
  { value: "es", flag: "🇪🇸", label: "Español" },
  { value: "en", flag: "🇬🇧", label: "English" },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === language) ?? options[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-dust hover:text-white hover:bg-stable-light transition-colors"
        aria-label="Select language"
      >
        <span className="text-base">{current.flag}</span>
        <span className="uppercase">{current.value}</span>
        <ChevronDown size={14} className={open ? "rotate-180" : ""} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-dust/50 overflow-hidden z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setLanguage(opt.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                opt.value === language
                  ? "bg-cream-dark text-saddle font-semibold"
                  : "text-stable hover:bg-cream-dark"
              }`}
            >
              <span className="text-base">{opt.flag}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
