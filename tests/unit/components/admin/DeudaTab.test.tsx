import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";
import DeudaTab from "@/components/admin/DeudaTab";

const competitions = [
  {
    id: "comp-1",
    title: "Concurso de Primavera",
    dateFrom: "2026-09-05",
    dateTo: "2026-09-06",
    location: "CHA",
    description: null,
    status: "open" as const,
    boxPriceArs: 500000,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function Harness() {
  const [selected, setSelected] = useState("");
  return (
    <DeudaTab
      secret="test-admin-secret"
      competitions={competitions}
      selectedCompetitionId={selected}
      onSelectCompetition={setSelected}
    />
  );
}

describe("DeudaTab", () => {
  it("loads binomios for the selected competition and shows the debt breakdown once one is picked", async () => {
    server.use(
      http.get("/api/admin/competitions/comp-1/registrations", () =>
        HttpResponse.json([
          { binomioId: "binomio-1", participantName: "Juan Pérez", horseName: "Relámpago" },
        ])
      ),
      http.get("/api/competitions/comp-1/debt/binomio-1", () =>
        HttpResponse.json({
          binomioName: "Juan Pérez",
          horseName: "Relámpago",
          items: [{ concept: "Prueba 1", amountArs: 1000000 }],
          totalArs: 1000000,
          paid: true,
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
    await waitFor(() => expect(screen.getAllByRole("combobox")).toHaveLength(2));

    const binomioSelect = screen.getAllByRole("combobox")[1];
    await user.selectOptions(binomioSelect, "binomio-1");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Juan Pérez / Relámpago" })).toBeInTheDocument()
    );
    expect(screen.getByText("Pagado")).toBeInTheDocument();
  });
});
