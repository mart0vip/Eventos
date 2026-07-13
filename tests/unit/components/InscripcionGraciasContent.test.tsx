import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";

let searchParamsValue = new URLSearchParams({ id: "reg-1" });
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsValue,
}));

import InscripcionGraciasContent from "@/components/InscripcionGraciasContent";

function renderContent() {
  return render(
    <LanguageProvider>
      <InscripcionGraciasContent />
    </LanguageProvider>
  );
}

beforeEach(() => {
  searchParamsValue = new URLSearchParams({ id: "reg-1" });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("InscripcionGraciasContent", () => {
  it("shows the cancelled state immediately when there's no id", () => {
    searchParamsValue = new URLSearchParams();
    renderContent();
    expect(screen.getByText("El pago no fue procesado")).toBeInTheDocument();
  });

  it("shows the confirmed state with competition/binomio details once polling resolves", async () => {
    server.use(
      http.get("/api/registrations/reg-1", () =>
        HttpResponse.json({
          status: "confirmed",
          eventName: "Prueba 1",
          competitionTitle: "Concurso de Primavera",
          participantName: "Juan Pérez",
          horseName: "Relámpago",
          confirmedAt: "2026-01-01T00:05:00.000Z",
        })
      )
    );

    renderContent();
    await waitFor(() => expect(screen.getByText("Concurso de Primavera")).toBeInTheDocument());
    expect(screen.getByText("Juan Pérez / Relámpago")).toBeInTheDocument();
  });

  it("shows the cancelled state with a retry link when the registration was cancelled", async () => {
    server.use(
      http.get("/api/registrations/reg-1", () =>
        HttpResponse.json({
          status: "cancelled",
          eventName: null,
          competitionTitle: null,
          participantName: null,
          horseName: null,
          confirmedAt: null,
        })
      )
    );

    renderContent();
    await waitFor(() => expect(screen.getByRole("link")).toHaveAttribute("href", "/concursos"));
  });

  it("keeps polling while pending_payment, stopping once confirmed", async () => {
    let callCount = 0;
    server.use(
      http.get("/api/registrations/reg-1", () => {
        callCount += 1;
        if (callCount < 3) {
          return HttpResponse.json({
            status: "pending_payment",
            eventName: null,
            competitionTitle: null,
            participantName: null,
            horseName: null,
            confirmedAt: null,
          });
        }
        return HttpResponse.json({
          status: "confirmed",
          eventName: "Prueba 1",
          competitionTitle: "Concurso de Primavera",
          participantName: "Juan Pérez",
          horseName: "Relámpago",
          confirmedAt: "2026-01-01T00:05:00.000Z",
        });
      })
    );

    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderContent();
    await vi.waitFor(() => expect(callCount).toBe(1));

    await vi.advanceTimersByTimeAsync(3000);
    await vi.waitFor(() => expect(callCount).toBe(2));

    await vi.advanceTimersByTimeAsync(3000);
    await vi.waitFor(() => expect(callCount).toBe(3));
    await vi.waitFor(() =>
      expect(screen.getByText("Concurso de Primavera")).toBeInTheDocument()
    );
  });
});
