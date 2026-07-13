import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import CompetitionCard from "@/components/CompetitionCard";
import type { CompetitionListItem } from "@/lib/db/queries/competitions";

const competition: CompetitionListItem = {
  id: "comp-1",
  title: "Concurso de Primavera",
  dateFrom: "2026-09-05",
  dateTo: "2026-09-06",
  location: "Club Hípico Buenos Aires",
  description: null,
  status: "open",
  boxPriceArs: 500000,
  createdAt: "2026-01-01T00:00:00.000Z",
  pruebaCount: 2,
};

function renderCard() {
  return render(
    <LanguageProvider>
      <CompetitionCard competition={competition} />
    </LanguageProvider>
  );
}

describe("CompetitionCard", () => {
  it("links to the competition's detail page", () => {
    renderCard();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/concursos/comp-1");
  });

  it("renders the title and location", () => {
    renderCard();
    expect(screen.getByText("Concurso de Primavera")).toBeInTheDocument();
    expect(screen.getByText("Club Hípico Buenos Aires")).toBeInTheDocument();
  });
});
