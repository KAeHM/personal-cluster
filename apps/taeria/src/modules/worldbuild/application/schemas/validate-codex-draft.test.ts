import { describe, expect, it } from "vitest";

import { createEmptyCodexDraft } from "../../domain/codex-draft";
import type { Kind } from "../../domain/kind";
import {
  isDraftReadyForCreate,
  listEnabledRequiredFacets,
  validateCodexDraft,
} from "./validate-codex-draft";

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
        properties: { lore_md: { type: "string", format: "markdown" } },
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
      enabled: true,
      required: false,
      schema: { allowedTypes: ["related_to"] },
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

describe("validateCodexDraft edges", () => {
  it("reporta erros em relações incompletas", () => {
    const draft = createEmptyCodexDraft("s1");
    draft.kindSlug = "weapon";
    draft.title = "Espada";
    draft.slug = "espada";
    draft.facets.lore = { lore_md: "Texto." };
    draft.edges = [{ type: "", toSlug: "" }];

    const result = validateCodexDraft(draft, baseKind);
    expect(result.valid).toBe(false);
    expect(result.identityErrors.length).toBeGreaterThan(0);
  });
});

describe("isDraftReadyForCreate", () => {
  it("retorna false quando kindSlug diverge", () => {
    const draft = createEmptyCodexDraft("s1");
    draft.kindSlug = "npc";
    expect(isDraftReadyForCreate(draft, baseKind)).toBe(false);
  });
});

describe("listEnabledRequiredFacets", () => {
  it("lista facetas obrigatórias habilitadas", () => {
    expect(listEnabledRequiredFacets(baseKind)).toEqual(["lore"]);
  });
});
