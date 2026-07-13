import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders children wrapped in the language provider without crashing", () => {
    const { container } = render(
      <RootLayout>
        <div data-testid="child">hello</div>
      </RootLayout>
    );
    expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
  });
});
