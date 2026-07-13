import { describe, expect, it } from "vitest";
import translations from "@/i18n/translations";

/** Recursively collects every leaf key path (e.g. "nav.concursos") in an object. */
function collectKeyPaths(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    collectKeyPaths(value, prefix ? `${prefix}.${key}` : key)
  );
}

describe("translations es/en key parity", () => {
  it("has the exact same set of key paths in es and en", () => {
    const esKeys = collectKeyPaths(translations.es).sort();
    const enKeys = collectKeyPaths(translations.en).sort();

    const onlyInEs = esKeys.filter((k) => !enKeys.includes(k));
    const onlyInEn = enKeys.filter((k) => !esKeys.includes(k));

    expect(onlyInEs).toEqual([]);
    expect(onlyInEn).toEqual([]);
  });

  it("has no empty-string translation values in either language", () => {
    for (const lang of ["es", "en"] as const) {
      const keys = collectKeyPaths(translations[lang]);
      for (const path of keys) {
        const [namespace, key] = path.split(".");
        const dict = translations[lang] as Record<string, Record<string, unknown>>;
        expect(dict[namespace][key], `${lang}.${path}`).not.toBe("");
      }
    }
  });
});
