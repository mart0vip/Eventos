"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { es, enUS } from "date-fns/locale";
import translations, { Language } from "./translations";

const LANGUAGE_KEY = "equestrian_language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function interpolate(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    text
  );
}

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>("es");

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === "es" || stored === "en") {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
  }, []);

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const [namespace, key] = path.split(".");
      const dict = translations[language] as Record<
        string,
        Record<string, string>
      >;
      const text = dict[namespace]?.[key];
      if (text === undefined) return path;
      return interpolate(text, vars);
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

export function useDateLocale() {
  const { language } = useLanguage();
  return language === "es" ? es : enUS;
}
