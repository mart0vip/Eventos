import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ExportarTab from "@/components/admin/ExportarTab";

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

const rows = [
  {
    eventName: "Prueba 1",
    dayLabel: "Día 1",
    participantName: "Juan Pérez",
    participantEmail: "juan@test.local",
    horseName: "Relámpago",
    licenseNumber: "LIC-1",
    boxRequested: true,
    drawOrder: 1,
    confirmedAt: "2026-01-01T00:05:00.000Z",
  },
];

function Harness() {
  const [selected, setSelected] = useState("");
  return (
    <ExportarTab
      secret="test-admin-secret"
      competitions={competitions}
      selectedCompetitionId={selected}
      onSelectCompetition={setSelected}
    />
  );
}

describe("ExportarTab", () => {
  it("enables the CSV download button once registrations are loaded", async () => {
    server.use(
      http.get("/api/admin/competitions/comp-1/registrations", () => HttpResponse.json(rows))
    );

    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Harness />
      </LanguageProvider>
    );

    await user.selectOptions(screen.getByRole("combobox"), "comp-1");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /descargar csv|download csv/i })).toBeEnabled()
    );
  });

  it("shows a no_rows error when the XLSX export has nothing to export", async () => {
    server.use(
      http.get("/api/admin/competitions/comp-1/registrations", () => HttpResponse.json(rows)),
      http.get("/api/admin/export", () => HttpResponse.json({ error: "no_rows" }, { status: 404 }))
    );

    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Harness />
      </LanguageProvider>
    );

    await user.selectOptions(screen.getByRole("combobox"), "comp-1");
    await waitFor(() =>
      expect(document.querySelector('input[type="date"]')).not.toBeNull()
    );

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, "2026-09-05");
    await user.click(screen.getByRole("button", { name: "Descargar XLSX del día" }));

    await waitFor(() =>
      expect(
        screen.getByText("No hay inscriptos confirmados para esa fecha.")
      ).toBeInTheDocument()
    );
  });
});
