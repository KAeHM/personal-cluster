import { beforeEach, describe, expect, it, vi } from "vitest";

import { getWikiKindTreeBrowse } from "./get-wiki-kind-tree-browse";

const mockWikiRepo = {
  findBySlug: vi.fn(),
  findByIds: vi.fn(),
  list: vi.fn(),
  listVisibleKindSlugs: vi.fn(),
  findKindBySlug: vi.fn(),
  listVisibleKinds: vi.fn(),
  listTaxonomyEdgesForKind: vi.fn(),
  listClassifiedAsEdgesForKind: vi.fn(),
  listTaxonomyChildren: vi.fn(),
};

vi.mock("../../infrastructure/wiki-codex.repository.factory", () => ({
  getWikiCodexRepository: vi.fn(async () => mockWikiRepo),
}));

const kindSummary = {
  slug: "lugar",
  name: "Lugar",
  description: null,
  entryCount: 0,
};

const entries = [
  {
    id: "e1",
    kindId: "k1",
    kindSlug: "lugar",
    slug: "taeria",
    title: "Taeria",
    visibility: "public" as const,
    shareCount: 0,
    updatedAt: new Date(),
  },
  {
    id: "e2",
    kindId: "k1",
    kindSlug: "lugar",
    slug: "capital",
    title: "Capital",
    visibility: "public" as const,
    shareCount: 0,
    updatedAt: new Date(),
  },
];

describe("getWikiKindTreeBrowse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null quando kind não existe", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue(null);

    await expect(getWikiKindTreeBrowse("desconhecido")).resolves.toBeNull();
  });

  it("com busca textual retorna grid sem árvore", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue(kindSummary);
    mockWikiRepo.list.mockResolvedValue({ entries: [entries[0]], total: 1 });

    const result = await getWikiKindTreeBrowse("lugar", { query: "tae" });

    expect(result?.browseMode).toBe("grid");
    expect(result?.tree).toBeNull();
    expect(mockWikiRepo.listTaxonomyEdgesForKind).not.toHaveBeenCalled();
  });

  it("sem edges taxonômicas faz fallback para grid", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue(kindSummary);
    mockWikiRepo.list.mockResolvedValue({ entries, total: 2 });
    mockWikiRepo.listTaxonomyEdgesForKind.mockResolvedValue([]);

    const result = await getWikiKindTreeBrowse("lugar");

    expect(result?.browseMode).toBe("grid");
    expect(result?.tree).toBeNull();
  });

  it("monta árvore quando kind usa browse tree e há edges", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue(kindSummary);
    mockWikiRepo.list.mockResolvedValue({ entries, total: 2 });
    mockWikiRepo.listTaxonomyEdgesForKind.mockResolvedValue([
      {
        id: "edge-1",
        childEntryId: "e2",
        childSlug: "capital",
        childTitle: "Capital",
        childKindSlug: "lugar",
        parent: {
          id: "e1",
          slug: "taeria",
          title: "Taeria",
          kindSlug: "lugar",
        },
        payload: null,
      },
    ]);
    mockWikiRepo.findByIds.mockResolvedValue([]);

    const result = await getWikiKindTreeBrowse("lugar");

    expect(result?.browseMode).toBe("tree");
    expect(result?.tree?.mode).toBe("tree");
    if (result?.tree?.mode === "tree") {
      expect(result.tree.roots).toHaveLength(1);
      expect(result.tree.roots[0]?.children[0]?.entry.slug).toBe("capital");
    }
  });

  it("monta grupos para habilidade com browse treeGrouped", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue({
      slug: "habilidade",
      name: "Habilidade",
      description: null,
      entryCount: 0,
    });
    mockWikiRepo.list.mockResolvedValue({
      entries: [
        {
          id: "h1",
          kindId: "k2",
          kindSlug: "habilidade",
          slug: "passo-nevoa",
          title: "Passo da Névoa",
          visibility: "public",
          shareCount: 0,
          updatedAt: new Date(),
        },
      ],
      total: 1,
    });
    mockWikiRepo.listTaxonomyEdgesForKind.mockResolvedValue([
      {
        id: "edge-1",
        childEntryId: "h1",
        childSlug: "passo-nevoa",
        childTitle: "Passo da Névoa",
        childKindSlug: "habilidade",
        parent: {
          id: "s1",
          slug: "neblina",
          title: "Postura da Neblina",
          kindSlug: "escola",
        },
        payload: null,
      },
    ]);
    mockWikiRepo.findByIds.mockResolvedValue([]);

    const result = await getWikiKindTreeBrowse("habilidade");

    expect(result?.browseMode).toBe("treeGrouped");
    expect(result?.tree?.mode).toBe("treeGrouped");
    if (result?.tree?.mode === "treeGrouped") {
      expect(result.tree.groups[0]?.groupEntry.slug).toBe("neblina");
    }
  });

  it("monta grupos para criatura via classified_as → taxon", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue({
      slug: "criatura",
      name: "Criatura",
      description: null,
      entryCount: 0,
    });
    mockWikiRepo.list.mockResolvedValue({
      entries: [
        {
          id: "c1",
          kindId: "k3",
          kindSlug: "criatura",
          slug: "lobo",
          title: "Lobo",
          visibility: "public",
          shareCount: 0,
          updatedAt: new Date(),
        },
      ],
      total: 1,
    });
    mockWikiRepo.listClassifiedAsEdgesForKind.mockResolvedValue([
      {
        id: "edge-1",
        childEntryId: "c1",
        childSlug: "lobo",
        childTitle: "Lobo",
        childKindSlug: "criatura",
        parent: {
          id: "t1",
          slug: "classe-mamiferos",
          title: "Mamíferos",
          kindSlug: "taxon",
        },
        payload: null,
      },
    ]);
    mockWikiRepo.findByIds.mockResolvedValue([]);

    const result = await getWikiKindTreeBrowse("criatura");

    expect(result?.browseMode).toBe("treeGrouped");
    expect(result?.tree?.mode).toBe("treeGrouped");
    expect(mockWikiRepo.listClassifiedAsEdgesForKind).toHaveBeenCalledWith(
      "criatura",
    );
    expect(mockWikiRepo.listTaxonomyEdgesForKind).not.toHaveBeenCalled();
    if (result?.tree?.mode === "treeGrouped") {
      expect(result.tree.groups[0]?.groupEntry.slug).toBe("classe-mamiferos");
      expect(result.tree.groups[0]?.roots[0]?.entry.slug).toBe("lobo");
    }
  });

  it("kinds com browse grid não montam árvore", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue({
      slug: "lenda",
      name: "Lenda",
      description: null,
      entryCount: 0,
    });
    mockWikiRepo.list.mockResolvedValue({ entries: [], total: 0 });

    const result = await getWikiKindTreeBrowse("lenda");

    expect(result?.browseMode).toBe("grid");
    expect(result?.tree).toBeNull();
    expect(mockWikiRepo.listTaxonomyEdgesForKind).not.toHaveBeenCalled();
  });

  it("carrega system facet para ordenação da árvore", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue(kindSummary);
    mockWikiRepo.list.mockResolvedValue({ entries: [entries[0]], total: 1 });
    mockWikiRepo.listTaxonomyEdgesForKind.mockResolvedValue([
      {
        id: "edge-1",
        childEntryId: "e1",
        childSlug: "taeria",
        childTitle: "Taeria",
        childKindSlug: "lugar",
        parent: {
          id: "e9",
          slug: "mundo",
          title: "Mundo",
          kindSlug: "lugar",
        },
        payload: null,
      },
    ]);
    mockWikiRepo.findByIds.mockResolvedValue([
      {
        id: "e1",
        kindId: "k1",
        slug: "taeria",
        title: "Taeria",
        visibility: "public",
        createdAt: new Date(),
        updatedAt: new Date(),
        facets: [
          {
            id: "f1",
            entryId: "e1",
            facetType: "system",
            data: { ordem: 3 },
          },
        ],
        edges: [],
      },
    ]);

    const result = await getWikiKindTreeBrowse("lugar");

    expect(mockWikiRepo.findByIds).toHaveBeenCalledWith(["e1"]);
    expect(result?.tree).not.toBeNull();
  });

  it("browse equipamento retorna modo equipamento sem árvore", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue({
      slug: "equipamento",
      name: "Equipamento",
      description: null,
      entryCount: 0,
    });
    mockWikiRepo.list.mockResolvedValue({ entries: [], total: 0 });

    const result = await getWikiKindTreeBrowse("equipamento");

    expect(result?.browseMode).toBe("equipamento");
    expect(result?.tree).toBeNull();
  });

  it("não busca system facet quando não há entradas visíveis", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue(kindSummary);
    mockWikiRepo.list.mockResolvedValue({ entries: [], total: 0 });
    mockWikiRepo.listTaxonomyEdgesForKind.mockResolvedValue([
      {
        id: "edge-1",
        childEntryId: "e1",
        childSlug: "fantasma",
        childTitle: "Fantasma",
        childKindSlug: "lugar",
        parent: {
          id: "e9",
          slug: "mundo",
          title: "Mundo",
          kindSlug: "lugar",
        },
        payload: null,
      },
    ]);

    const result = await getWikiKindTreeBrowse("lugar");

    expect(result?.tree?.mode).toBe("tree");
    expect(mockWikiRepo.findByIds).not.toHaveBeenCalled();
  });
});
