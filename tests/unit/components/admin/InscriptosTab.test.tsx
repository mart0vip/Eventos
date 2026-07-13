import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";
import InscriptosTab from "@/components/admin/InscriptosTab";

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
  {
    eventName: "Prueba 2",
    dayLabel: "Día 1",
    participantName: "María Gómez",
    participantEmail: "maria@test.local",
    horseName: "Trueno",
    licenseNumber: null,
    boxRequested: false,
    drawOrder: null,
    confirmedAt: "2026-01-01T00:06:00.000Z",
  },
];

function Harness() {
  const [selected, setSelected] = useState("");
  return (
    <InscriptosTab
      secret="test-admin-secret"
      competitions={competitions}
      selectedCompetitionId={selected}
      onSelectCompetition={setSelected}
    />
  );
}

describe("InscriptosTab", () => {
  it("shows the empty state before a competition is selected", () => {
    render(
      <LanguageProvider>
        <Harness />
      </LanguageProvider>
    );
    expect(screen.getByText("No hay inscriptos confirmados todavía.")).toBeInTheDocument();
  });

  it("loads and lists confirmed registrations once a competition is selected", async () => {
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
    await waitFor(() => expect(screen.getByText("Juan Pérez")).toBeInTheDocument());
    expect(screen.getByText("María Gómez")).toBeInTheDocument();
  });

  it("filters by prueba once a competition with multiple pruebas is loaded", async () => {
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
    await waitFor(() => expect(screen.getByText("Juan Pérez")).toBeInTheDocument());

    const selects = screen.getAllByRole("combobox");
    const pruebaSelect = selects[selects.length - 1];
    await user.selectOptions(pruebaSelect, "Prueba 1");

    expect(screen.getByText("Juan Pérez")).toBeInTheDocument();
    expect(screen.queryByText("María Gómez")).not.toBeInTheDocument();
  });
});
