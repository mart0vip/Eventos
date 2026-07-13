import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";
import AnteprogramaTab from "@/components/admin/AnteprogramaTab";

const draftCompetition = {
  id: "comp-1",
  title: "Concurso de Primavera",
  dateFrom: "2026-09-05",
  dateTo: "2026-09-06",
  location: "CHA",
  description: null,
  status: "draft" as const,
  boxPriceArs: 500000,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const detailWithOneDay = {
  ...draftCompetition,
  days: [
    {
      id: "day-1",
      competitionId: "comp-1",
      dayDate: "2026-09-05",
      dayLabel: "Día 1",
      sortOrder: 0,
      pruebas: [],
    },
  ],
};

function Harness({ initialCompetitions = [draftCompetition] }: { initialCompetitions?: typeof draftCompetition[] }) {
  const [competitions, setCompetitions] = useState(initialCompetitions);
  const [selected, setSelected] = useState(initialCompetitions[0]?.id ?? "");
  return (
    <AnteprogramaTab
      secret="test-admin-secret"
      competitions={competitions}
      selectedCompetitionId={selected}
      onSelectCompetition={setSelected}
      onCompetitionsChanged={() => setCompetitions([...competitions])}
    />
  );
}

describe("AnteprogramaTab", () => {
  it("shows the empty state when there are no competitions yet", () => {
    render(
      <LanguageProvider>
        <Harness initialCompetitions={[]} />
      </LanguageProvider>
    );
    expect(screen.getByText("No hay concursos creados todavía.")).toBeInTheDocument();
  });

  it("shows the legal status transitions for a draft competition (open/cancel, not close)", async () => {
    server.use(http.get("/api/competitions/comp-1", () => HttpResponse.json(detailWithOneDay)));

    render(
      <LanguageProvider>
        <Harness />
      </LanguageProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Abrir Inscripciones" })).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Cancelar Concurso" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cerrar Inscripciones" })).not.toBeInTheDocument();
  });

  it("transitions the competition status when a transition button is clicked", async () => {
    let status: string = "draft";
    server.use(
      http.get("/api/competitions/comp-1", () =>
        HttpResponse.json({ ...detailWithOneDay, status })
      ),
      http.patch("/api/admin/competitions/comp-1", async ({ request }) => {
        const body = (await request.json()) as { status: string };
        status = body.status;
        return HttpResponse.json({ ...draftCompetition, status });
      })
    );

    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Harness />
      </LanguageProvider>
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Abrir Inscripciones" })).toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "Abrir Inscripciones" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cerrar Inscripciones" })).toBeInTheDocument()
    );
  });

  it("adds a day to the anteprograma", async () => {
    let days = detailWithOneDay.days;
    server.use(
      http.get("/api/competitions/comp-1", () =>
        HttpResponse.json({ ...detailWithOneDay, days })
      ),
      http.post("/api/admin/competitions/comp-1/days", async ({ request }) => {
        const body = (await request.json()) as { dayDate: string; dayLabel: string };
        const newDay = {
          id: "day-2",
          competitionId: "comp-1",
          dayDate: body.dayDate,
          dayLabel: body.dayLabel,
          sortOrder: 1,
          pruebas: [] as never[],
        };
        days = [...days, newDay];
        return HttpResponse.json(newDay, { status: 201 });
      })
    );

    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Harness />
      </LanguageProvider>
    );

    await waitFor(() => expect(screen.getByText("Día 1")).toBeInTheDocument());

    // The always-rendered "create competition" form above also has 2 date
    // inputs (dateFrom/dateTo) — the "add day" form's date input is the last one.
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[dateInputs.length - 1], { target: { value: "2026-09-06" } });
    await user.type(screen.getByPlaceholderText("Etiqueta *"), "Día 2");
    await user.click(screen.getByRole("button", { name: "Agregar Día" }));

    await waitFor(() => expect(screen.getByText("Día 2")).toBeInTheDocument());
  });

  it("creates a new competition and selects it", async () => {
    server.use(
      http.post("/api/admin/competitions", () =>
        HttpResponse.json({ ...draftCompetition, id: "comp-new" }, { status: 201 })
      ),
      http.get("/api/competitions/comp-new", () =>
        HttpResponse.json({ ...draftCompetition, id: "comp-new", days: [] })
      )
    );

    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <Harness initialCompetitions={[]} />
      </LanguageProvider>
    );

    await user.type(screen.getByPlaceholderText("Título *"), "Concurso Nuevo");
    await user.type(screen.getByPlaceholderText("Ubicación *"), "CHA");
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: "2026-10-01" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-10-02" } });
    await user.click(screen.getByRole("button", { name: "Crear" }));

    await waitFor(() => expect(screen.getByText(/Estado:/)).toBeInTheDocument());
  });
});
