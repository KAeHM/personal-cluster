import { describe, expect, it } from "vitest";

import { createEmptyCodexDraft } from "../../domain/codex-draft";
import {
  mergeDraftEdges,
  mergeDraftIdentity,
  mergeFacetPatches,
  shouldSkipFacetGeneration,
} from "./merge-draft";

describe("mergeFacetPatches userEdited policy", () => {
  it("mescla objetos aninhados em facetas", () => {
    const draft = createEmptyCodexDraft("s1");
    draft.facets.system = { stats: { power: 1 } };

    const merged = mergeFacetPatches(draft, [
      {
        facetType: "system",
        data: { stats: { defense: 2 } },
      },
    ]);

    expect(merged.facets.system).toEqual({ stats: { power: 1, defense: 2 } });
  });

  it("não sobrescreve faceta editada manualmente", () => {
    const draft = createEmptyCodexDraft("s1");
    draft.facets.lore = { lore_md: "Texto do usuário." };
    draft.meta.userEdited.lore = true;

    const merged = mergeFacetPatches(draft, [
      { facetType: "lore", data: { lore_md: "Texto da IA." } },
    ]);

    expect(merged.facets.lore?.lore_md).toBe("Texto do usuário.");
  });

  it("sobrescreve quando forçado por regenerate", () => {
    const draft = createEmptyCodexDraft("s1");
    draft.facets.lore = { lore_md: "Texto do usuário." };
    draft.meta.userEdited.lore = true;

    const merged = mergeFacetPatches(
      draft,
      [{ facetType: "lore", data: { lore_md: "Texto da IA." } }],
      { forceFacetTypes: ["lore"] },
    );

    expect(merged.facets.lore?.lore_md).toBe("Texto da IA.");
  });
});

describe("shouldSkipFacetGeneration", () => {
  it("respeita regenerate explícito", () => {
    const draft = createEmptyCodexDraft("s1");
    draft.meta.userEdited.lore = true;
    expect(shouldSkipFacetGeneration(draft, "lore", true)).toBe(false);
  });
});

describe("mergeDraftIdentity", () => {
  it("preenche campos ausentes", () => {
    const draft = createEmptyCodexDraft("s1");
    const merged = mergeDraftIdentity(draft, {
      kindSlug: "weapon",
      title: "Espada",
    });
    expect(merged.kindSlug).toBe("weapon");
    expect(merged.title).toBe("Espada");
  });
});

describe("mergeDraftEdges", () => {
  it("deduplica arestas por tipo e destino", () => {
    const draft = createEmptyCodexDraft("s1");
    draft.edges = [{ type: "related_to", toSlug: "npc-a" }];
    const merged = mergeDraftEdges(draft, [
      { type: "related_to", toSlug: "npc-a" },
      { type: "crafted_by", toSlug: "ferreiro" },
    ]);
    expect(merged.edges).toHaveLength(2);
  });

  it("substitui arestas quando replace=true", () => {
    const draft = createEmptyCodexDraft("s1");
    draft.edges = [{ type: "related_to", toSlug: "npc-a" }];
    const merged = mergeDraftEdges(
      draft,
      [{ type: "crafted_by", toSlug: "ferreiro" }],
      true,
    );
    expect(merged.edges).toHaveLength(1);
    expect(merged.edges[0]?.type).toBe("crafted_by");
  });
});
