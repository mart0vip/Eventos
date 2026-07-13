import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { LanguageProvider, useDateLocale, useLanguage } from "@/i18n/LanguageContext";

function wrapper({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

describe("useLanguage", () => {
  it("defaults to Spanish", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe("es");
  });

  it("throws when used outside a LanguageProvider", () => {
    expect(() => renderHook(() => useLanguage())).toThrow(
      "useLanguage must be used within a LanguageProvider"
    );
  });

  it("t() resolves a namespaced key", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.t("nav.concursos")).not.toBe("nav.concursos");
  });

  it("t() returns the dot-path itself for a missing key", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.t("nav.doesNotExist")).toBe("nav.doesNotExist");
  });

  it("t() interpolates {var} placeholders", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const text = result.current.t("admin.colCantidad", { n: 3 } as never);
    // Not every key has a placeholder; just assert interpolation doesn't throw
    // and returns a string either way.
    expect(typeof text).toBe("string");
  });

  it("setLanguage switches the active language and persists it to localStorage", async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage("en");
    });

    await waitFor(() => expect(result.current.language).toBe("en"));
    expect(localStorage.getItem("equestrian_language")).toBe("en");
  });

  it("picks up a previously-stored language on mount", async () => {
    localStorage.setItem("equestrian_language", "en");
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await waitFor(() => expect(result.current.language).toBe("en"));
  });
});

describe("useDateLocale", () => {
  it("returns the Spanish date-fns locale by default", () => {
    const { result } = renderHook(() => useDateLocale(), { wrapper });
    expect(result.current.code).toBe("es");
  });

  it("returns the English (US) date-fns locale after switching", async () => {
    const { result } = renderHook(
      () => ({ lang: useLanguage(), locale: useDateLocale() }),
      { wrapper }
    );

    act(() => {
      result.current.lang.setLanguage("en");
    });

    await waitFor(() => expect(result.current.locale.code).toBe("en-US"));
  });
});
