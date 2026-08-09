import { describe, expect, it } from "vitest";

import {
  getWikiBrowseMode,
  getWikiEntryLayoutMode,
  getWikiHubGroupForKind,
  getWikiHubGroups,
  getWikiUncategorizedKindSlugs,
} from "./wiki-kind-config";

describe("wiki-kind-config", () => {
  it("agrupa kinds do seed em quatro seções do hub", () => {
    const sections = getWikiHubGroups();
    expect(sections.map((section) => section.id)).toEqual([
      "historia",
      "mundo",
      "sistema",
      "referencia",
    ]);
    expect(
      sections.find((section) => section.id === "historia")?.kindSlugs,
    ).toEqual(["lenda", "personagem", "livro", "divindade", "organizacao"]);
    expect(
      sections.find((section) => section.id === "referencia")?.kindSlugs,
    ).toEqual(["termo", "taxon"]);
  });

  it("filtra seções do hub por slugs disponíveis", () => {
    const sections = getWikiHubGroups({ availableSlugs: ["termo", "lenda"] });
    expect(sections).toHaveLength(2);
    expect(sections[0]?.kindSlugs).toEqual(["lenda"]);
    expect(sections[1]?.kindSlugs).toEqual(["termo"]);
  });

  it("resolve browse mode por kind", () => {
    expect(getWikiBrowseMode("habilidade")).toBe("treeGrouped");
    expect(getWikiBrowseMode("criatura")).toBe("treeGrouped");
    expect(getWikiBrowseMode("planta")).toBe("treeGrouped");
    expect(getWikiBrowseMode("taxon")).toBe("tree");
    expect(getWikiBrowseMode("receita")).toBe("recipe");
    expect(getWikiBrowseMode("equipamento")).toBe("equipamento");
    expect(getWikiBrowseMode("lugar")).toBe("tree");
    expect(getWikiBrowseMode("personagem")).toBe("grid");
  });

  it("resolve entry layout mode por kind", () => {
    expect(getWikiEntryLayoutMode("personagem")).toBe("statBlock");
    expect(getWikiEntryLayoutMode("habilidade")).toBe("technique");
    expect(getWikiEntryLayoutMode("termo")).toBe("lexicon");
    expect(getWikiEntryLayoutMode("divindade")).toBe("reading");
    expect(getWikiEntryLayoutMode("escola")).toBe("default");
  });

  it("mapeia grupo do hub e kinds sem grupo", () => {
    expect(getWikiHubGroupForKind("termo")).toBe("referencia");
    expect(getWikiHubGroupForKind("taxon")).toBe("referencia");
    expect(getWikiHubGroupForKind("desconhecido")).toBeNull();
    expect(getWikiUncategorizedKindSlugs(["termo", "custom"])).toEqual([
      "custom",
    ]);
  });
});
