import { describe, expect, it } from "vitest";

import {
  buildWikiTaxonomyTree,
  type WikiTaxonomyBuildEntry,
} from "./build-wiki-taxonomy-tree";
import type { WikiTaxonomyEdge } from "../../domain/wiki-codex.repository";

function entry(
  id: string,
  slug: string,
  title: string,
  kindSlug: string,
  systemData?: Record<string, unknown>,
): WikiTaxonomyBuildEntry {
  return { id, slug, title, kindSlug, systemData };
}

function edge(
  child: WikiTaxonomyBuildEntry,
  parent: WikiTaxonomyBuildEntry,
  payload: Record<string, unknown> | null = null,
): WikiTaxonomyEdge {
  return {
    id: `${child.id}->${parent.id}`,
    childEntryId: child.id,
    childSlug: child.slug,
    childTitle: child.title,
    childKindSlug: child.kindSlug,
    parent: {
      id: parent.id,
      slug: parent.slug,
      title: parent.title,
      kindSlug: parent.kindSlug,
    },
    payload,
  };
}

describe("buildWikiTaxonomyTree", () => {
  it("trata entradas cujo pai não está no conjunto visível como raízes", () => {
    const root = entry("r1", "raiz", "Raiz", "lugar");
    const child = entry("c1", "filho", "Filho", "lugar");
    const parentOutside = entry("p1", "continente", "Continente", "lugar");

    const result = buildWikiTaxonomyTree({
      kindSlug: "lugar",
      mode: "tree",
      entries: [root, child],
      edges: [edge(child, parentOutside), edge(root, parentOutside)],
    });

    expect(result.mode).toBe("tree");
    if (result.mode !== "tree") {
      return;
    }

    expect(result.roots.map((node) => node.entry.slug).sort()).toEqual([
      "filho",
      "raiz",
    ]);
  });

  it("aninha filhos com pai do mesmo kind visível", () => {
    const root = entry("r1", "taeria", "Taeria", "lugar");
    const child = entry("c1", "capital", "Capital", "lugar");

    const result = buildWikiTaxonomyTree({
      kindSlug: "lugar",
      mode: "tree",
      entries: [root, child],
      edges: [edge(child, root)],
    });

    expect(result.mode).toBe("tree");
    if (result.mode !== "tree") {
      return;
    }

    expect(result.roots).toHaveLength(1);
    expect(result.roots[0]?.entry.slug).toBe("taeria");
    expect(result.roots[0]?.children[0]?.entry.slug).toBe("capital");
  });

  it("ordena irmãos por rank, ordem e título", () => {
    const parent = entry("p1", "pai", "Pai", "escola");
    const beta = entry("b1", "beta", "Beta", "escola", { ordem: 2 });
    const alpha = entry("a1", "alpha", "Alpha", "escola", { ordem: 1 });
    const ranked = entry("r1", "ranked", "Ranked", "escola");

    const result = buildWikiTaxonomyTree({
      kindSlug: "escola",
      mode: "tree",
      entries: [parent, beta, alpha, ranked],
      edges: [
        edge(beta, parent),
        edge(alpha, parent),
        edge(ranked, parent, { rank: 0 }),
      ],
    });

    expect(result.mode).toBe("tree");
    if (result.mode !== "tree") {
      return;
    }

    expect(result.roots[0]?.children.map((node) => node.entry.slug)).toEqual([
      "ranked",
      "alpha",
      "beta",
    ]);
  });

  it("treeGrouped agrupa habilidades por escola e aninha hab→hab", () => {
    const escolaA = entry("s1", "neblina", "Postura da Neblina", "escola");
    const escolaB = entry("s2", "brasa", "Postura da Brasa", "escola");
    const habRoot = entry("h1", "passo-nevoa", "Passo da Névoa", "habilidade");
    const habChild = entry("h2", "corte-nevoa", "Corte da Névoa", "habilidade");
    const habOther = entry("h3", "chama-baixa", "Chama Baixa", "habilidade");

    const result = buildWikiTaxonomyTree({
      kindSlug: "habilidade",
      mode: "treeGrouped",
      entries: [habRoot, habChild, habOther],
      edges: [
        edge(habRoot, escolaA),
        edge(habChild, habRoot),
        edge(habOther, escolaB),
      ],
    });

    expect(result.mode).toBe("treeGrouped");
    if (result.mode !== "treeGrouped") {
      return;
    }

    expect(result.groups).toHaveLength(2);
    expect(result.groups[0]?.groupEntry.slug).toBe("brasa");
    expect(result.groups[1]?.groupEntry.slug).toBe("neblina");
    expect(result.groups[1]?.roots[0]?.entry.slug).toBe("passo-nevoa");
    expect(result.groups[1]?.roots[0]?.children[0]?.entry.slug).toBe(
      "corte-nevoa",
    );
  });

  it("treeGrouped coloca habilidades sem escola em seção fallback", () => {
    const orphan = entry("h1", "orphan", "Órfã", "habilidade");

    const result = buildWikiTaxonomyTree({
      kindSlug: "habilidade",
      mode: "treeGrouped",
      entries: [orphan],
      edges: [],
    });

    expect(result.mode).toBe("treeGrouped");
    if (result.mode !== "treeGrouped") {
      return;
    }

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]?.groupEntry.slug).toBe("outras-habilidades");
    expect(result.groups[0]?.roots[0]?.entry.slug).toBe("orphan");
  });

  it("tree trata pai de outro kind como raiz", () => {
    const criatura = entry("c1", "lobo", "Lobo", "criatura");
    const raca = entry("r1", "canino", "Canino", "raca");

    const result = buildWikiTaxonomyTree({
      kindSlug: "criatura",
      mode: "tree",
      entries: [criatura],
      edges: [edge(criatura, raca)],
    });

    expect(result.mode).toBe("tree");
    if (result.mode !== "tree") {
      return;
    }

    expect(result.roots).toHaveLength(1);
    expect(result.roots[0]?.entry.slug).toBe("lobo");
  });

  it("treeGrouped aninha habilidades órfãs entre si na seção fallback", () => {
    const parent = entry("h1", "base", "Base", "habilidade");
    const child = entry("h2", "avancada", "Avançada", "habilidade");

    const result = buildWikiTaxonomyTree({
      kindSlug: "habilidade",
      mode: "treeGrouped",
      entries: [parent, child],
      edges: [edge(child, parent)],
    });

    expect(result.mode).toBe("treeGrouped");
    if (result.mode !== "treeGrouped") {
      return;
    }

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]?.groupEntry.slug).toBe("outras-habilidades");
    expect(result.groups[0]?.roots[0]?.entry.slug).toBe("base");
    expect(result.groups[0]?.roots[0]?.children[0]?.entry.slug).toBe(
      "avancada",
    );
  });

  it("ignora ciclos ao resolver escola na cadeia taxonômica", () => {
    const habA = entry("h1", "a", "A", "habilidade");
    const habB = entry("h2", "b", "B", "habilidade");

    const result = buildWikiTaxonomyTree({
      kindSlug: "habilidade",
      mode: "treeGrouped",
      entries: [habA, habB],
      edges: [edge(habA, habB), edge(habB, habA)],
    });

    expect(result.mode).toBe("treeGrouped");
    if (result.mode !== "treeGrouped") {
      return;
    }

    expect(result.groups[0]?.groupEntry.slug).toBe("outras-habilidades");
  });

  it("treeGrouped trata habilidade ligada só à escola como raiz do grupo", () => {
    const escola = entry("s1", "neblina", "Postura da Neblina", "escola");
    const hab = entry("h1", "passo", "Passo", "habilidade");

    const result = buildWikiTaxonomyTree({
      kindSlug: "habilidade",
      mode: "treeGrouped",
      entries: [hab],
      edges: [edge(hab, escola)],
    });

    expect(result.mode).toBe("treeGrouped");
    if (result.mode !== "treeGrouped") {
      return;
    }

    expect(result.groups[0]?.roots[0]?.entry.slug).toBe("passo");
  });

  it("treeGrouped torna raiz habilidade cujo pai está em outro grupo", () => {
    const escolaA = entry("s1", "neblina", "Postura da Neblina", "escola");
    const escolaB = entry("s2", "brasa", "Postura da Brasa", "escola");
    const habRootA = entry("h1", "passo", "Passo", "habilidade");
    const habInB = entry("h2", "gancho", "Gancho", "habilidade");

    const result = buildWikiTaxonomyTree({
      kindSlug: "habilidade",
      mode: "treeGrouped",
      entries: [habRootA, habInB],
      edges: [
        edge(habRootA, escolaA),
        edge(habInB, escolaB),
        edge(habInB, habRootA),
      ],
    });

    expect(result.mode).toBe("treeGrouped");
    if (result.mode !== "treeGrouped") {
      return;
    }

    const groupB = result.groups.find(
      (group) => group.groupEntry.slug === "brasa",
    );
    expect(groupB?.roots[0]?.entry.slug).toBe("gancho");
  });

  it("suporta múltiplas edges taxonômicas por habilidade", () => {
    const escola = entry("s1", "neblina", "Postura da Neblina", "escola");
    const habRoot = entry("h1", "passo", "Passo", "habilidade");
    const habChild = entry("h2", "corte", "Corte", "habilidade");

    const result = buildWikiTaxonomyTree({
      kindSlug: "habilidade",
      mode: "treeGrouped",
      entries: [habRoot, habChild],
      edges: [
        edge(habRoot, escola),
        edge(habChild, escola),
        edge(habChild, habRoot),
      ],
    });

    expect(result.mode).toBe("treeGrouped");
    if (result.mode !== "treeGrouped") {
      return;
    }

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]?.roots[0]?.entry.slug).toBe("passo");
    expect(result.groups[0]?.roots[0]?.children[0]?.entry.slug).toBe("corte");
  });

  it("ordena irmãos só por ordem quando rank ausente", () => {
    const parent = entry("p1", "pai", "Pai", "habilidade");
    const second = entry("h2", "segunda", "Segunda", "habilidade", {
      ordem: 2,
    });
    const first = entry("h1", "primeira", "Primeira", "habilidade", {
      ordem: 1,
    });

    const result = buildWikiTaxonomyTree({
      kindSlug: "habilidade",
      mode: "tree",
      entries: [parent, second, first],
      edges: [edge(first, parent), edge(second, parent)],
    });

    expect(result.mode).toBe("tree");
    if (result.mode !== "tree") {
      return;
    }

    expect(result.roots[0]?.children.map((node) => node.entry.slug)).toEqual([
      "primeira",
      "segunda",
    ]);
  });

  it("ordena irmãos por rank e prioriza quem tem ordem definida", () => {
    const parent = entry("p1", "pai", "Pai", "lugar");
    const rankedLow = entry("l1", "ranked-low", "Ranked low", "lugar");
    const rankedHigh = entry("h1", "ranked-high", "Ranked high", "lugar");
    const withOrdem = entry("o1", "com-ordem", "Com ordem", "lugar", {
      ordem: 1,
    });
    const withoutOrdem = entry("s1", "sem-ordem", "Sem ordem", "lugar");

    const result = buildWikiTaxonomyTree({
      kindSlug: "lugar",
      mode: "tree",
      entries: [parent, rankedLow, rankedHigh, withOrdem, withoutOrdem],
      edges: [
        edge(rankedLow, parent, { rank: "2" }),
        edge(rankedHigh, parent, { rank: 1 }),
        edge(withOrdem, parent),
        edge(withoutOrdem, parent),
      ],
    });

    expect(result.mode).toBe("tree");
    if (result.mode !== "tree") {
      return;
    }

    expect(result.roots[0]?.children.map((node) => node.entry.slug)).toEqual([
      "ranked-high",
      "ranked-low",
      "com-ordem",
      "sem-ordem",
    ]);
  });

  it("agrupa espécies por taxon via classified_as", () => {
    const mamiferos = entry("t1", "classe-mamiferos", "Mamíferos", "taxon");
    const aves = entry("t2", "classe-aves", "Aves", "taxon");
    const lobo = entry("c1", "lobo", "Lobo", "criatura");
    const urso = entry("c2", "urso", "Urso", "criatura");
    const aguia = entry("c3", "aguia", "Águia", "criatura");
    const solta = entry("c4", "sombra", "Sombra", "criatura");

    const result = buildWikiTaxonomyTree({
      kindSlug: "criatura",
      mode: "treeGrouped",
      groupParentKindSlug: "taxon",
      ungroupedSlug: "outras-criaturas",
      ungroupedTitle: "Outras criaturas",
      entries: [lobo, urso, aguia, solta],
      edges: [edge(lobo, mamiferos), edge(urso, mamiferos), edge(aguia, aves)],
    });

    expect(result.mode).toBe("treeGrouped");
    if (result.mode !== "treeGrouped") {
      return;
    }

    expect(result.groups.map((group) => group.groupEntry.slug)).toEqual([
      "classe-aves",
      "classe-mamiferos",
      "outras-criaturas",
    ]);
    expect(
      result.groups
        .find((group) => group.groupEntry.slug === "classe-mamiferos")
        ?.roots.map((node) => node.entry.slug)
        .sort(),
    ).toEqual(["lobo", "urso"]);
    expect(
      result.groups.find(
        (group) => group.groupEntry.slug === "outras-criaturas",
      )?.roots[0]?.entry.slug,
    ).toBe("sombra");
  });
});
