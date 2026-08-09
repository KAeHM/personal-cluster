import { describe, expect, it } from "vitest";

import type { Kind } from "../../domain/kind";
import { createEmptyCodexDraft } from "../../domain/codex-draft";
import { compileFacetZod, validateFacetData } from "./compile-facet-zod";
import { validateCodexDraft } from "./validate-codex-draft";

const baseKind: Kind = {
  id: "kind-1",
  slug: "weapon",
  name: "Arma",
  description: null,
  aiPrompt: null,
  isBuiltin: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  facets: [
    {
      id: "f1",
      kindId: "kind-1",
      facetType: "lore",
      enabled: true,
      required: true,
      schema: {
        type: "object",
        properties: {
          lore_md: { type: "string", format: "markdown", title: "Lore" },
        },
        required: ["lore_md"],
      },
      aiPrompt: null,
      displayOrder: 0,
    },
    {
      id: "f2",
      kindId: "kind-1",
      facetType: "system",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 1,
    },
    {
      id: "f3",
      kindId: "kind-1",
      facetType: "lexicon",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 2,
    },
    {
      id: "f4",
      kindId: "kind-1",
      facetType: "visual",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 3,
    },
    {
      id: "f5",
      kindId: "kind-1",
      facetType: "edges",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 4,
    },
    {
      id: "f6",
      kindId: "kind-1",
      facetType: "embeddings",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 5,
    },
  ],
};

describe("compileFacetZod", () => {
  it("valida campos obrigatórios da faceta lore", () => {
    const schema = compileFacetZod(baseKind, "lore");
    const result = schema.safeParse({ lore_md: "Uma lâmina antiga." });
    expect(result.success).toBe(true);
  });

  it("rejeita lore sem campo obrigatório", () => {
    const result = validateFacetData(baseKind, "lore", {});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("compila e valida campos number e boolean", () => {
    const kindWithSystem: Kind = {
      ...baseKind,
      facets: baseKind.facets.map((facet) =>
        facet.facetType === "system"
          ? {
              ...facet,
              enabled: true,
              schema: {
                type: "object",
                properties: {
                  power: { type: "number", title: "Poder" },
                  cursed: { type: "boolean", title: "Amaldiçoada" },
                },
              },
            }
          : facet,
      ),
    };

    const result = validateFacetData(kindWithSystem, "system", {
      power: 10,
      cursed: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("validateCodexDraft", () => {
  it("exige título, slug e faceta obrigatória", () => {
    const draft = createEmptyCodexDraft("session-1");
    draft.kindSlug = "weapon";

    const result = validateCodexDraft(draft, baseKind);
    expect(result.valid).toBe(false);
    expect(result.identityErrors.length).toBeGreaterThan(0);
    expect(result.errors.lore).toBeDefined();
  });

  it("aceita draft completo", () => {
    const draft = createEmptyCodexDraft("session-1");
    draft.kindSlug = "weapon";
    draft.title = "Espada de Valdris";
    draft.slug = "espada-de-valdris";
    draft.facets.lore = { lore_md: "Forjada nas chamas do norte." };

    const result = validateCodexDraft(draft, baseKind);
    expect(result.valid).toBe(true);
  });
});
