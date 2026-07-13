import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TopBar from "@/components/TopBar";

describe("TopBar", () => {
  it("renders the club's real contact and social links", () => {
    render(<TopBar />);

    expect(screen.getByRole("link", { name: /secretaria@clubhipicoargentino\.org\.ar/ })).toHaveAttribute(
      "href",
      "mailto:secretaria@clubhipicoargentino.org.ar"
    );
    expect(screen.getByRole("link", { name: /\+54 11-4787-1003/ })).toHaveAttribute(
      "href",
      "tel:+541147871003"
    );
    expect(screen.getByRole("link", { name: "Facebook" })).toHaveAttribute(
      "href",
      "https://facebook.com/hipicoargentinofanpage"
    );
    expect(screen.getByRole("link", { name: "Instagram" })).toHaveAttribute(
      "href",
      "https://instagram.com/clubhipicoargentino"
    );
  });
});
