import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { closeDbPool, resetDb } from "../db";
import { findOrCreateBinomio, getBinomioById } from "@/lib/db/queries/binomios";

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDbPool();
});

describe("findOrCreateBinomio", () => {
  it("creates a new binomio when the email+horse pair doesn't exist", async () => {
    const binomio = await findOrCreateBinomio({
      participantName: "Juan Pérez",
      participantEmail: "juan@test.local",
      horseName: "Relámpago",
      licenseNumber: "LIC-1",
    });

    expect(binomio.participantName).toBe("Juan Pérez");
    expect(binomio.horseName).toBe("Relámpago");
    expect(binomio.licenseNumber).toBe("LIC-1");
  });

  it("reuses the same binomio id for the same email+horse pair (dedup rule)", async () => {
    const first = await findOrCreateBinomio({
      participantName: "Juan Pérez",
      participantEmail: "juan@test.local",
      horseName: "Relámpago",
    });
    const second = await findOrCreateBinomio({
      participantName: "Juan Pérez",
      participantEmail: "juan@test.local",
      horseName: "Relámpago",
    });

    expect(second.id).toBe(first.id);
  });

  it("most-recent-submission-wins on participant_name for the same pair", async () => {
    const first = await findOrCreateBinomio({
      participantName: "Juan Pérez",
      participantEmail: "juan@test.local",
      horseName: "Relámpago",
    });
    const updated = await findOrCreateBinomio({
      participantName: "Juan A. Pérez",
      participantEmail: "juan@test.local",
      horseName: "Relámpago",
    });

    expect(updated.id).toBe(first.id);
    expect(updated.participantName).toBe("Juan A. Pérez");
  });

  it("keeps the existing license_number when a later submission omits it (COALESCE)", async () => {
    const first = await findOrCreateBinomio({
      participantName: "Juan Pérez",
      participantEmail: "juan@test.local",
      horseName: "Relámpago",
      licenseNumber: "LIC-1",
    });
    const updated = await findOrCreateBinomio({
      participantName: "Juan Pérez",
      participantEmail: "juan@test.local",
      horseName: "Relámpago",
    });

    expect(updated.id).toBe(first.id);
    expect(updated.licenseNumber).toBe("LIC-1");
  });

  it("treats the same email with a different horse as a different binomio", async () => {
    const first = await findOrCreateBinomio({
      participantName: "Juan Pérez",
      participantEmail: "juan@test.local",
      horseName: "Relámpago",
    });
    const second = await findOrCreateBinomio({
      participantName: "Juan Pérez",
      participantEmail: "juan@test.local",
      horseName: "Trueno",
    });

    expect(second.id).not.toBe(first.id);
  });

  it("is race-safe: concurrent findOrCreate calls for a brand-new pair converge to one id", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        findOrCreateBinomio({
          participantName: "Concurrent Rider",
          participantEmail: "concurrent@test.local",
          horseName: "Veloz",
        })
      )
    );

    const uniqueIds = new Set(results.map((r) => r.id));
    expect(uniqueIds.size).toBe(1);
  });
});

describe("getBinomioById", () => {
  it("returns null for a non-existent id", async () => {
    const binomio = await getBinomioById("00000000-0000-0000-0000-000000000000");
    expect(binomio).toBeNull();
  });

  it("returns the binomio for an existing id", async () => {
    const created = await findOrCreateBinomio({
      participantName: "Juan Pérez",
      participantEmail: "juan@test.local",
      horseName: "Relámpago",
    });
    const found = await getBinomioById(created.id);
    expect(found).toEqual(created);
  });
});
