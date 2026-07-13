import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import InscripcionErrorPage from "@/app/inscripcion/error/page";
import InscripcionPendientePage from "@/app/inscripcion/pendiente/page";
import { LanguageProvider } from "@/i18n/LanguageContext";

describe("InscripcionErrorPage", () => {
  it("renders Navbar/Footer around the redirect without crashing", () => {
    render(
      <LanguageProvider>
        <InscripcionErrorPage />
      </LanguageProvider>
    );
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });
});

describe("InscripcionPendientePage", () => {
  it("renders Navbar/Footer around the redirect without crashing", () => {
    render(
      <LanguageProvider>
        <InscripcionPendientePage />
      </LanguageProvider>
    );
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });
});
