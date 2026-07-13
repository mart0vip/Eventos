import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";
import SociosTab from "@/components/admin/SociosTab";

const members = [
  {
    id: "member-1",
    name: "María Gómez",
    email: "maria@test.local",
    memberNumber: "SOC-001",
    createdAt: "2026-01-01T00:00:00.000Z",
    pendingTotalArs: 300000,
  },
];

function renderTab() {
  return render(
    <LanguageProvider>
      <SociosTab secret="test-admin-secret" />
    </LanguageProvider>
  );
}

describe("SociosTab", () => {
  it("shows the empty state before any members load", async () => {
    server.use(http.get("/api/members", () => HttpResponse.json([])));
    renderTab();
    await waitFor(() =>
      expect(screen.getByText("No hay socios cargados todavía.")).toBeInTheDocument()
    );
  });

  it("lists members with their pending debt", async () => {
    server.use(http.get("/api/members", () => HttpResponse.json(members)));
    renderTab();
    await waitFor(() => expect(screen.getByText("María Gómez")).toBeInTheDocument());
    expect(screen.getByText("$3.000")).toBeInTheDocument();
  });

  it("creates a member and refreshes the list", async () => {
    let created = false;
    server.use(
      http.get("/api/members", () => HttpResponse.json(created ? members : [])),
      http.post("/api/members", () => {
        created = true;
        return HttpResponse.json(members[0], { status: 201 });
      })
    );

    const user = userEvent.setup();
    renderTab();
    await waitFor(() =>
      expect(screen.getByText("No hay socios cargados todavía.")).toBeInTheDocument()
    );

    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[0], "María Gómez");
    await user.type(textboxes[1], "maria@test.local");
    await user.type(textboxes[2], "SOC-001");
    await user.click(screen.getByRole("button", { name: "Crear Socio" }));

    await waitFor(() => expect(screen.getByText("María Gómez")).toBeInTheDocument());
  });

  it("shows an error when creating a member with a duplicate email/number", async () => {
    server.use(
      http.get("/api/members", () => HttpResponse.json([])),
      http.post("/api/members", () => HttpResponse.json({ error: "member_exists" }, { status: 409 }))
    );

    const user = userEvent.setup();
    renderTab();
    await waitFor(() =>
      expect(screen.getByText("No hay socios cargados todavía.")).toBeInTheDocument()
    );

    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[0], "María Gómez");
    await user.type(textboxes[1], "maria@test.local");
    await user.type(textboxes[2], "SOC-001");
    await user.click(screen.getByRole("button", { name: "Crear Socio" }));

    await waitFor(() =>
      expect(screen.getByText("Ya existe un socio con ese email o número.")).toBeInTheDocument()
    );
  });

  it("copies the member's portal link to the clipboard and shows confirmation", async () => {
    server.use(http.get("/api/members", () => HttpResponse.json(members)));
    const user = userEvent.setup();

    // userEvent.setup() installs its own clipboard stub — define ours after,
    // so it isn't clobbered.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    renderTab();
    await waitFor(() => expect(screen.getByText("María Gómez")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Copiar link del portal" }));
    await waitFor(() => expect(screen.getByText("Link copiado")).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/socios/member-1"));
  });
});
