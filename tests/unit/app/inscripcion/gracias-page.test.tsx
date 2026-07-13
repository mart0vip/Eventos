import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import InscripcionGraciasPage from "@/app/inscripcion/gracias/page";
import { LanguageProvider } from "@/i18n/LanguageContext";

describe("InscripcionGraciasPage", () => {
  it("renders Navbar/Footer around the gracias content without crashing", async () => {
    server.use(http.get("/api/registrations/*", () => HttpResponse.json({ status: "cancelled" })));

    render(
      <LanguageProvider>
        <InscripcionGraciasPage />
      </LanguageProvider>
    );
    expect(screen.getByText("El pago no fue procesado")).toBeInTheDocument();
  });
});
