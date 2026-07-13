import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { LanguageProvider } from "@/i18n/LanguageContext";
import InscripcionForm, { InscripcionResult } from "@/components/InscripcionForm";

async function fillAndSubmit(onResult: (r: InscripcionResult) => void, boxPriceArs = 0) {
  const user = userEvent.setup();
  render(
    <LanguageProvider>
      <InscripcionForm eventId="event-1" boxPriceArs={boxPriceArs} onResult={onResult} />
    </LanguageProvider>
  );

  const textboxes = screen.getAllByRole("textbox");
  await user.type(textboxes[0], "Juan Pérez"); // fullName
  await user.type(textboxes[1], "juan@test.local"); // email (type="email" -> role=textbox)
  await user.type(textboxes[2], "Relámpago"); // horseName
  await user.click(screen.getByRole("button"));
}

describe("InscripcionForm", () => {
  it("calls onResult with kind=held on a 201", async () => {
    server.use(
      http.post("/api/registrations", () =>
        HttpResponse.json(
          { registrationId: "reg-1", checkoutUrl: "https://mp.test/pref-1", holdsUntil: "2026-01-01T00:15:00.000Z" },
          { status: 201 }
        )
      )
    );

    const onResult = vi.fn();
    await fillAndSubmit(onResult);

    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "held", registrationId: "reg-1" })
    );
  });

  it("calls onResult with kind=waitlisted on a 200 waitlisted response", async () => {
    server.use(
      http.post("/api/registrations", () =>
        HttpResponse.json({ status: "waitlisted", waitlistId: "waitlist-1" }, { status: 200 })
      )
    );

    const onResult = vi.fn();
    await fillAndSubmit(onResult);

    expect(onResult).toHaveBeenCalledWith({ kind: "waitlisted", waitlistId: "waitlist-1" });
  });

  it("calls onResult with kind=already_registered on a 409", async () => {
    server.use(
      http.post("/api/registrations", () =>
        HttpResponse.json({ error: "already_registered" }, { status: 409 })
      )
    );

    const onResult = vi.fn();
    await fillAndSubmit(onResult);

    expect(onResult).toHaveBeenCalledWith({ kind: "already_registered" });
  });

  it("calls onResult with kind=payment_setup_error on a 502", async () => {
    server.use(
      http.post("/api/registrations", () =>
        HttpResponse.json(
          { error: "payment_provider_error", registrationId: "reg-1", holdsUntil: "2026-01-01T00:15:00.000Z" },
          { status: 502 }
        )
      )
    );

    const onResult = vi.fn();
    await fillAndSubmit(onResult);

    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "payment_setup_error", registrationId: "reg-1" })
    );
  });

  it("calls onResult with kind=error on a network failure", async () => {
    server.use(http.post("/api/registrations", () => HttpResponse.error()));

    const onResult = vi.fn();
    await fillAndSubmit(onResult);

    expect(onResult).toHaveBeenCalledWith({ kind: "error" });
  });

  it("shows the box-reservation checkbox only when boxPriceArs > 0", () => {
    render(
      <LanguageProvider>
        <InscripcionForm eventId="event-1" boxPriceArs={500000} onResult={vi.fn()} />
      </LanguageProvider>
    );
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("hides the box-reservation checkbox when boxPriceArs is 0", () => {
    render(
      <LanguageProvider>
        <InscripcionForm eventId="event-1" boxPriceArs={0} onResult={vi.fn()} />
      </LanguageProvider>
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
