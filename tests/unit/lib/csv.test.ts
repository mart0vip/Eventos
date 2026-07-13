import { describe, expect, it, vi } from "vitest";
import { downloadCsv, escapeCsvValue } from "@/lib/csv";

describe("escapeCsvValue", () => {
  it("leaves plain values untouched", () => {
    expect(escapeCsvValue("Juan Pérez")).toBe("Juan Pérez");
    expect(escapeCsvValue(42)).toBe("42");
  });

  it("quotes and doubles embedded quotes", () => {
    expect(escapeCsvValue('Say "hi"')).toBe('"Say ""hi"""');
  });

  it("quotes values containing commas", () => {
    expect(escapeCsvValue("Buenos Aires, Argentina")).toBe('"Buenos Aires, Argentina"');
  });

  it("quotes values containing newlines", () => {
    expect(escapeCsvValue("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("downloadCsv", () => {
  it("does nothing when there are no rows", () => {
    const clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy;
    downloadCsv("empty.csv", []);
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("triggers a download with a .csv extension appended when missing", () => {
    const clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy;
    const createObjectURLSpy = vi.fn(() => "blob:mock-url");
    URL.createObjectURL = createObjectURLSpy;
    URL.revokeObjectURL = vi.fn();

    downloadCsv("inscriptos", [{ nombre: "Juan Pérez", caballo: "Relámpago" }]);

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
  });
});
