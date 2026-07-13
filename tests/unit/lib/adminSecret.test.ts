import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminFetch, getStoredAdminSecret, storeAdminSecret } from "@/lib/adminSecret";

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getStoredAdminSecret / storeAdminSecret", () => {
  it("returns null when nothing is stored", () => {
    expect(getStoredAdminSecret()).toBeNull();
  });

  it("round-trips a stored secret via sessionStorage", () => {
    storeAdminSecret("s3cr3t");
    expect(getStoredAdminSecret()).toBe("s3cr3t");
  });
});

describe("adminFetch", () => {
  it("attaches the secret as the x-admin-secret header", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));

    await adminFetch("/api/admin/competitions", "s3cr3t");

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/competitions",
      expect.objectContaining({ headers: expect.objectContaining({ "x-admin-secret": "s3cr3t" }) })
    );
  });

  it("preserves other init options while adding the header", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));

    await adminFetch("/api/admin/competitions", "s3cr3t", {
      method: "POST",
      body: JSON.stringify({ title: "Test" }),
    });

    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ title: "Test" }));
  });
});
