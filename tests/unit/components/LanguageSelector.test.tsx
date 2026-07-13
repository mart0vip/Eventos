import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

beforeEach(() => {
  localStorage.clear();
});

function renderSelector() {
  return render(
    <LanguageProvider>
      <LanguageSelector />
    </LanguageProvider>
  );
}

describe("LanguageSelector", () => {
  it("shows the current language and no dropdown initially", () => {
    renderSelector();
    expect(screen.getByText("es")).toBeInTheDocument();
    expect(screen.queryByText("English")).not.toBeInTheDocument();
  });

  it("opens the dropdown on click, showing both options", async () => {
    const user = userEvent.setup();
    renderSelector();

    await user.click(screen.getByRole("button", { name: /select language/i }));
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
  });

  it("switches language and persists it when an option is clicked", async () => {
    const user = userEvent.setup();
    renderSelector();

    await user.click(screen.getByRole("button", { name: /select language/i }));
    await user.click(screen.getByText("English"));

    expect(localStorage.getItem("equestrian_language")).toBe("en");
    expect(screen.queryByText("Español")).not.toBeInTheDocument(); // dropdown closed
  });

  it("closes the dropdown on outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <LanguageProvider>
          <LanguageSelector />
        </LanguageProvider>
        <div data-testid="outside">outside</div>
      </div>
    );

    await user.click(screen.getByRole("button", { name: /select language/i }));
    expect(screen.getByText("English")).toBeInTheDocument();

    await user.click(screen.getByTestId("outside"));
    expect(screen.queryByText("English")).not.toBeInTheDocument();
  });
});
