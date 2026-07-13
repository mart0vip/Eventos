import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ConcursosPage from "@/app/concursos/page";

function renderPage() {
  return render(
    <LanguageProvider>
      <ConcursosPage />
    </LanguageProvider>
  );
}

describe("ConcursosPage", () => {
  it("shows a loading state, then the list of competitions", async () => {
    server.use(
      http.get("/api/competitions", () =>
        HttpResponse.json([
          {
            id: "comp-1",
            title: "Concurso de Primavera",
            dateFrom: "2026-09-05",
            dateTo: "2026-09-06",
            location: "CHA",
            description: null,
            status: "open",
            boxPriceArs: 500000,
            createdAt: "2026-01-01T00:00:00.000Z",
            pruebaCount: 2,
          },
        ])
      )
    );

    renderPage();
    await waitFor(() => expect(screen.getByText("Concurso de Primavera")).toBeInTheDocument());
  });

  it("shows an empty state when there are no open competitions", async () => {
    server.use(http.get("/api/competitions", () => HttpResponse.json([])));

    renderPage();
    await waitFor(() =>
      expect(screen.getByText("No hay concursos abiertos por el momento.")).toBeInTheDocument()
    );
  });
});
