import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";
import SorteoTab from "@/components/admin/SorteoTab";

const competitions = [
  {
    id: "comp-1",
    title: "Concurso de Primavera",
    dateFrom: "2026-09-05",
    dateTo: "2026-09-06",
    location: "CHA",
    description: null,
    status: "closed" as const,
    boxPriceArs: 500000,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const detail = {
  ...competitions[0],
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

function Harness() {
  const [selected, setSelected] = useState("");
  return (
    <SorteoTab
      secret="test-admin-secret"
      competitions={competitions}
      selectedCompetitionId={selected}
      onSelectCompetition={setSelected}
    />
  );
}

describe("SorteoTab", () => {
  it("enables the draw button only once the competition is closed and has pruebas pending sorteo", async () => {
    server.use(http.get("/api/competitions/comp-1", () => HttpResponse.json(detail)));

    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Harness />
      </LanguageProvider>
    );

    await user.selectOptions(screen.getByRole("combobox"), "comp-1");
    await waitFor(() => expect(screen.getByRole("button", { name: /sorteo/i })).toBeEnabled());
  });

  it("runs the draw and shows the resulting order", async () => {
    server.use(
      http.get("/api/competitions/comp-1", () => HttpResponse.json(detail)),
      http.post("/api/admin/competitions/comp-1/draw", () =>
        HttpResponse.json({
          results: [
            {
              eventId: "event-1",
              eventName: "Prueba 1",
              order: [{ binomioName: "Juan Pérez", horseName: "Relámpago", drawOrder: 1 }],
            },
          ],
        })
      )
    );

    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Harness />
      </LanguageProvider>
    );

    await user.selectOptions(screen.getByRole("combobox"), "comp-1");
    await waitFor(() => expect(screen.getByRole("button", { name: /sorteo/i })).toBeEnabled());

    await user.click(screen.getByRole("button", { name: /sorteo/i }));
    await waitFor(() =>
      expect(screen.getByText("Juan Pérez / Relámpago")).toBeInTheDocument()
    );
  });
});
