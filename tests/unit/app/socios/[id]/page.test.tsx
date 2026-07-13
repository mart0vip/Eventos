import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";

let searchParamsValue = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "member-1" }),
  useSearchParams: () => searchParamsValue,
}));

import SocioPortalPage from "@/app/socios/[id]/page";

const memberWithDebts = {
  id: "member-1",
  name: "María Gómez",
  email: "maria@test.local",
  memberNumber: "SOC-001",
  createdAt: "2026-01-01T00:00:00.000Z",
  pendingTotalArs: 500000,
  debts: [
    {
      id: "debt-1",
      memberId: "member-1",
      concept: "cuota" as const,
      amountArs: 500000,
      dueDate: "2026-02-01",
      paidAt: null,
      mpPreferenceId: null,
      mpPaymentId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

function renderPage() {
  return render(
    <LanguageProvider>
      <SocioPortalPage />
    </LanguageProvider>
  );
}

beforeEach(() => {
  searchParamsValue = new URLSearchParams();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SocioPortalPage", () => {
  it("shows the not-found state for a non-existent member", async () => {
    server.use(http.get("/api/members/member-1/debts", () => HttpResponse.json(null, { status: 404 })));
    renderPage();
    await waitFor(() => expect(screen.getByText("Socio No Encontrado")).toBeInTheDocument());
  });

  it("shows the member's name, member number, and debt breakdown", async () => {
    server.use(http.get("/api/members/member-1/debts", () => HttpResponse.json(memberWithDebts)));
    renderPage();
    await waitFor(() => expect(screen.getByText("María Gómez")).toBeInTheDocument());
    expect(screen.getByText("Cuota social")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("shows the paid status and no pay button for a paid debt", async () => {
    server.use(
      http.get("/api/members/member-1/debts", () =>
        HttpResponse.json({
          ...memberWithDebts,
          pendingTotalArs: 0,
          debts: [{ ...memberWithDebts.debts[0], paidAt: "2026-01-15T00:00:00.000Z" }],
        })
      )
    );
    renderPage();
    await waitFor(() => expect(screen.getByText("Pagado")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /pagar/i })).not.toBeInTheDocument();
  });

  it("redirects to the Mercado Pago checkout URL when paying a debt", async () => {
    server.use(
      http.get("/api/members/member-1/debts", () => HttpResponse.json(memberWithDebts)),
      http.post("/api/members/debts/debt-1/pay", () =>
        HttpResponse.json({ debtId: "debt-1", checkoutUrl: "https://mp.test/pref-1" })
      )
    );
    const assignSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, assign: assignSpy },
      writable: true,
    });

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: /pagar/i })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /pagar/i }));
    await waitFor(() => expect(assignSpy).toHaveBeenCalledWith("https://mp.test/pref-1"));
  });

  it("shows a payment error banner when the pay request fails", async () => {
    server.use(
      http.get("/api/members/member-1/debts", () => HttpResponse.json(memberWithDebts)),
      http.post("/api/members/debts/debt-1/pay", () =>
        HttpResponse.json({ error: "payment_provider_error" }, { status: 502 })
      )
    );

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: /pagar/i })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /pagar/i }));
    await waitFor(() =>
      expect(screen.getByText("No pudimos generar el link de pago. Intentá de nuevo más tarde.")).toBeInTheDocument()
    );
  });

  it("shows the success banner when returning from Mercado Pago with pago=exito", async () => {
    searchParamsValue = new URLSearchParams({ pago: "exito" });
    server.use(http.get("/api/members/member-1/debts", () => HttpResponse.json(memberWithDebts)));

    renderPage();
    await waitFor(() =>
      expect(screen.getByText("¡Pago recibido! Puede tardar unos segundos en reflejarse. Te enviamos el comprobante por correo.")).toBeInTheDocument()
    );
  });
});
