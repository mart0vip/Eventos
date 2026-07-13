import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";
import DashboardTab from "@/components/admin/DashboardTab";

function renderTab() {
  return render(
    <LanguageProvider>
      <DashboardTab secret="test-admin-secret" />
    </LanguageProvider>
  );
}

describe("DashboardTab", () => {
  it("shows totals and recent payments once loaded", async () => {
    server.use(
      http.get("/api/admin/dashboard", () =>
        HttpResponse.json({
          totalCollectedArs: 1500000,
          collectedRegistrationsArs: 1000000,
          collectedMemberDebtsArs: 500000,
          paymentsCount: 2,
          pendingMemberDebtArs: 300000,
          recentPayments: [
            {
              source: "registration",
              amountArs: 1000000,
              mpPaymentId: "mp-1",
              receivedAt: "2026-01-01T00:00:00.000Z",
              payerLabel: "Juan Pérez / Relámpago",
            },
          ],
        })
      )
    );

    renderTab();
    await waitFor(() => expect(screen.getByText("$15.000")).toBeInTheDocument());
    expect(screen.getByText("Juan Pérez / Relámpago")).toBeInTheDocument();
  });

  it("shows the empty state when there are no recent payments", async () => {
    server.use(
      http.get("/api/admin/dashboard", () =>
        HttpResponse.json({
          totalCollectedArs: 0,
          collectedRegistrationsArs: 0,
          collectedMemberDebtsArs: 0,
          paymentsCount: 0,
          pendingMemberDebtArs: 0,
          recentPayments: [],
        })
      )
    );

    renderTab();
    await waitFor(() =>
      expect(screen.getByText("Todavía no hay pagos registrados.")).toBeInTheDocument()
    );
  });
});
