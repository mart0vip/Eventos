import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Navbar from "@/components/Navbar";

beforeEach(() => {
  localStorage.clear();
});

function renderNavbar() {
  return render(
    <LanguageProvider>
      <Navbar />
    </LanguageProvider>
  );
}

describe("Navbar", () => {
  it("only links internally to /concursos and /admin (no leftover demo-app routes)", () => {
    renderNavbar();
    const internalLinks = screen
      .getAllByRole("link")
      .map((el) => el.getAttribute("href"))
      .filter((href): href is string => href !== null && href.startsWith("/"));
    expect(new Set(internalLinks)).toEqual(new Set(["/concursos", "/admin"]));
  });

  it("the logo links to /concursos", () => {
    renderNavbar();
    const logo = screen.getByAltText("Club Hípico Argentino");
    expect(logo.closest("a")).toHaveAttribute("href", "/concursos");
  });

  it("toggles the mobile menu, adding a second Concursos/Admin link pair", async () => {
    const user = userEvent.setup();
    renderNavbar();

    const toggle = document.querySelector("button.p-2") as HTMLElement;
    const closedCount = screen.getAllByRole("link").length;

    await user.click(toggle);
    expect(screen.getAllByRole("link")).toHaveLength(closedCount + 2);

    await user.click(toggle);
    expect(screen.getAllByRole("link")).toHaveLength(closedCount);
  });
});
