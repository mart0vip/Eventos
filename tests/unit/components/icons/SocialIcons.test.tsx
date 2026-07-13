import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FacebookIcon, InstagramIcon } from "@/components/icons/SocialIcons";

describe("SocialIcons", () => {
  it("renders FacebookIcon with the default size", () => {
    const { container } = render(<FacebookIcon />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("height", "16");
  });

  it("renders InstagramIcon with a custom size", () => {
    const { container } = render(<InstagramIcon size={24} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
  });
});
