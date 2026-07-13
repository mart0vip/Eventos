import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Footer from "@/components/Footer";

beforeEach(() => {
  localStorage.clear();
});

function renderFooter() {
  return render(
    <LanguageProvider>
      <Footer />
    </LanguageProvider>
  );
}

describe("Footer", () => {
  it("Enlaces Rápidos points at /concursos and /admin, not old demo routes", () => {
    renderFooter();
    const links = screen
      .getAllByRole("link")
      .map((el) => el.getAttribute("href"))
      .filter((href): href is string => href !== null && !href.startsWith("mailto:") && !href.startsWith("tel:") && !href.startsWith("https://"));
    expect(new Set(links)).toEqual(new Set(["/concursos", "/admin"]));
  });

  it("renders the real contact email and phone", () => {
    renderFooter();
    expect(screen.getByRole("link", { name: /secretaria@clubhipicoargentino\.org\.ar/ })).toHaveAttribute(
      "href",
      "mailto:secretaria@clubhipicoargentino.org.ar"
    );
    expect(screen.getByRole("link", { name: /\+54 11-4787-1003/ })).toHaveAttribute(
      "href",
      "tel:+541147871003"
    );
  });

  it("shows the current year in the rights line", () => {
    renderFooter();
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
