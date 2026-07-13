import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/admin/AnteprogramaTab", () => ({
  default: () => <div data-testid="tab-anteprograma" />,
}));
vi.mock("@/components/admin/InscriptosTab", () => ({
  default: () => <div data-testid="tab-inscriptos" />,
}));
vi.mock("@/components/admin/SorteoTab", () => ({ default: () => <div data-testid="tab-sorteo" /> }));
vi.mock("@/components/admin/DeudaTab", () => ({ default: () => <div data-testid="tab-deuda" /> }));
vi.mock("@/components/admin/SociosTab", () => ({ default: () => <div data-testid="tab-socios" /> }));
vi.mock("@/components/admin/ExportarTab", () => ({
  default: () => <div data-testid="tab-exportar" />,
}));
vi.mock("@/components/admin/DashboardTab", () => ({
  default: () => <div data-testid="tab-dashboard" />,
}));

import AdminPage from "@/app/admin/page";

function renderPage() {
  return render(
    <LanguageProvider>
      <AdminPage />
    </LanguageProvider>
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

describe("AdminPage", () => {
  it("shows the login form when there's no stored secret", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument());
  });

  it("shows a login error on a wrong secret", async () => {
    server.use(
      http.get("/api/admin/competitions", () => HttpResponse.json({ error: "unauthorized" }, { status: 401 }))
    );

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByPlaceholderText(/clave/i));

    await user.type(screen.getByPlaceholderText(/clave/i), "wrong-secret");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => expect(screen.getByText(/incorrect|inválid/i)).toBeInTheDocument());
  });

  it("logs in with the correct secret and shows the tabs, switching between them", async () => {
    server.use(http.get("/api/admin/competitions", () => HttpResponse.json([])));

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => screen.getByPlaceholderText(/clave/i));

    await user.type(screen.getByPlaceholderText(/clave/i), "test-admin-secret");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    await waitFor(() => expect(screen.getByTestId("tab-anteprograma")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /sorteo/i }));
    expect(screen.getByTestId("tab-sorteo")).toBeInTheDocument();
    expect(screen.queryByTestId("tab-anteprograma")).not.toBeInTheDocument();
  });
});
