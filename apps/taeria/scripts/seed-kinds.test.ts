import { describe, expect, it } from "vitest";

import { TAERIA_KINDS } from "./seed-kinds";

const EXPECTED_FACET_TYPES = [
  "lore",
  "system",
  "lexicon",
  "visual",
  "edges",
  "embeddings",
];

describe("TAERIA_KINDS", () => {
  it("tem 16 kinds com slugs únicos", () => {
    const slugs = TAERIA_KINDS.map((kind) => kind.slug);
    expect(slugs).toHaveLength(16);
    expect(new Set(slugs).size).toBe(16);
  });

  it("cada kind define exatamente 6 facetas na ordem padrão", () => {
    for (const kind of TAERIA_KINDS) {
      expect(kind.facets).toHaveLength(6);
      expect(kind.facets.map((facet) => facet.facetType)).toEqual(
        EXPECTED_FACET_TYPES,
      );
    }
  });

  it("schemas de facetas enabled são JSON válidos", () => {
    for (const kind of TAERIA_KINDS) {
      for (const facet of kind.facets) {
        if (facet.schema) {
          expect(() => JSON.stringify(facet.schema)).not.toThrow();
        }
      }
    }
  });

  it("inclui kinds demo lenda e personagem", () => {
    const slugs = TAERIA_KINDS.map((kind) => kind.slug);
    expect(slugs).toContain("lenda");
    expect(slugs).toContain("personagem");
  });

  it("inclui kinds wiki v3 divindade, organizacao, termo e taxon", () => {
    const slugs = TAERIA_KINDS.map((kind) => kind.slug);
    expect(slugs).toContain("divindade");
    expect(slugs).toContain("organizacao");
    expect(slugs).toContain("termo");
    expect(slugs).toContain("taxon");
  });

  it("criatura e planta permitem classified_as e têm aiPrompt", () => {
    for (const slug of ["criatura", "planta"] as const) {
      const kind = TAERIA_KINDS.find((item) => item.slug === slug);
      expect(kind?.aiPrompt).toBeTruthy();
      const edges = kind!.facets.find((facet) => facet.facetType === "edges");
      expect(edges?.schema).toMatchObject({
        allowedTypes: expect.arrayContaining(["classified_as", "taxonomy"]),
      });
    }
  });

  it("taxon usa system com nivel e edges só taxonomy", () => {
    const taxon = TAERIA_KINDS.find((kind) => kind.slug === "taxon");
    expect(taxon?.aiPrompt).toBeTruthy();
    const system = taxon!.facets.find((facet) => facet.facetType === "system");
    expect(system?.enabled).toBe(true);
    expect(system?.required).toBe(true);
    expect(system?.schema).toMatchObject({
      properties: {
        nivel: expect.any(Object),
        codigo: expect.any(Object),
      },
    });
    const edges = taxon!.facets.find((facet) => facet.facetType === "edges");
    expect(edges?.schema).toMatchObject({
      allowedTypes: ["taxonomy"],
    });
  });

  it("termo habilita faceta lexicon com termo obrigatório", () => {
    const termo = TAERIA_KINDS.find((kind) => kind.slug === "termo");
    expect(termo).toBeDefined();

    const lexicon = termo!.facets.find(
      (facet) => facet.facetType === "lexicon",
    );
    expect(lexicon?.enabled).toBe(true);
    expect(lexicon?.required).toBe(true);
    expect(lexicon?.schema).toMatchObject({
      required: ["term"],
      properties: {
        term: { "x-wiki-placement": "hero" },
        translation: { "x-wiki-placement": "hero" },
      },
    });

    const lore = termo!.facets.find((facet) => facet.facetType === "lore");
    expect(lore?.enabled).toBe(true);
    expect(lore?.required).toBe(false);
  });
});
