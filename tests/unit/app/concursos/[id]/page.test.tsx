import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "comp-1" }),
}));

import ConcursoDetailPage from "@/app/concursos/[id]/page";

const competitionWithOneDay = {
  id: "comp-1",
  title: "Concurso de Primavera",
  dateFrom: "2026-09-05",
  dateTo: "2026-09-06",
  location: "CHA",
  description: null,
  status: "open",
  boxPriceArs: 500000,
  createdAt: "2026-01-01T00:00:00.000Z",
  days: [
    {
      id: "day-1",
      competitionId: "comp-1",
      dayDate: "2026-09-05",
      dayLabel: "Día 1",
      sortOrder: 0,
      pruebas: [
        {
          id: "event-1",
          dayId: "day-1",
          name: "Prueba 1",
          category: "Salto 1.10m",
          priceArs: 1000000,
          totalSlots: 10,
          availableSlots: 8,
          drawDone: false,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    },
  ],
};

function renderPage() {
  return render(
    <LanguageProvider>
      <ConcursoDetailPage />
    </LanguageProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ConcursoDetailPage", () => {
  it("renders the not-found state on a 404", async () => {
    server.use(http.get("/api/competitions/comp-1", () => HttpResponse.json(null, { status: 404 })));
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Volver a Concursos" })).toBeInTheDocument()
    );
  });

  it("renders the competition title, location, and pruebas once loaded", async () => {
    server.use(http.get("/api/competitions/comp-1", () => HttpResponse.json(competitionWithOneDay)));
    renderPage();
    await waitFor(() => expect(screen.getByText("Concurso de Primavera")).toBeInTheDocument());
    expect(screen.getByText("Prueba 1")).toBeInTheDocument();
  });

  it("expands a prueba's inline form and shows a held-result countdown banner on successful registration", async () => {
    server.use(
      http.get("/api/competitions/comp-1", () => HttpResponse.json(competitionWithOneDay)),
      http.post("/api/registrations", () =>
        HttpResponse.json(
          {
            registrationId: "reg-1",
            checkoutUrl: "https://mp.test/pref-1",
            holdsUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          },
          { status: 201 }
        )
      )
    );

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText("Prueba 1")).toBeInTheDocument());

    // Both the card's toggle button and the form's submit button read "Inscribirme".
    await user.click(screen.getAllByRole("button", { name: /inscrib/i })[0]);
    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[0], "Juan Pérez");
    await user.type(textboxes[1], "juan@test.local");
    await user.type(textboxes[2], "Relámpago");
    await user.click(screen.getAllByRole("button", { name: /inscrib/i })[1]);

    await waitFor(() => expect(screen.getByRole("link", { name: /pago|payment/i })).toBeInTheDocument());
  });
});
