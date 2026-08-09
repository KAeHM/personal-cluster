import { describe, expect, it } from "vitest";

import { TAXON_ENTRIES } from "./seed-taxonomy";

describe("TAXON_ENTRIES", () => {
  it("tem Selos, Reinos e Classes com slugs únicos", () => {
    const slugs = TAXON_ENTRIES.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(TAXON_ENTRIES.length);
    expect(
      TAXON_ENTRIES.filter((entry) => entry.nivel === "selo"),
    ).toHaveLength(3);
    expect(
      TAXON_ENTRIES.filter((entry) => entry.nivel === "reino").length,
    ).toBeGreaterThanOrEqual(9);
    expect(
      TAXON_ENTRIES.filter((entry) => entry.nivel === "classe").length,
    ).toBeGreaterThanOrEqual(5);
  });

  it("reinos e classes apontam para pais existentes", () => {
    const bySlug = new Set(TAXON_ENTRIES.map((entry) => entry.slug));
    for (const entry of TAXON_ENTRIES) {
      if (entry.parentSlug) {
        expect(bySlug.has(entry.parentSlug)).toBe(true);
      }
    }
  });
});
