import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const replaceMock = vi.fn();
let searchParamsValue = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParamsValue,
}));

import InscripcionRedirect from "@/components/InscripcionRedirect";

beforeEach(() => {
  replaceMock.mockClear();
});

describe("InscripcionRedirect", () => {
  it("redirects to /inscripcion/gracias?id=... when an id is present", () => {
    searchParamsValue = new URLSearchParams({ id: "reg-1" });
    render(<InscripcionRedirect />);
    expect(replaceMock).toHaveBeenCalledWith("/inscripcion/gracias?id=reg-1");
  });

  it("redirects to /inscripcion/gracias without a query string when no id is present", () => {
    searchParamsValue = new URLSearchParams();
    render(<InscripcionRedirect />);
    expect(replaceMock).toHaveBeenCalledWith("/inscripcion/gracias");
  });
});
