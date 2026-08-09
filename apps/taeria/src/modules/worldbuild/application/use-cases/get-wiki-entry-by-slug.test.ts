import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CodexEntry } from "../../domain/codex-entry";
import type { Kind } from "../../domain/kind";
import {
  getWikiEntryBySlug,
  listWikiEntries,
  listWikiKindSlugs,
} from "./get-wiki-entry-by-slug";

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

const mockKindRepo = {
  findById: vi.fn(),
  findBySlug: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  slugExists: vi.fn(),
};

vi.mock("../../infrastructure/wiki-codex.repository.factory", () => ({
  getWikiCodexRepository: vi.fn(async () => mockWikiRepo),
}));

vi.mock("../../infrastructure/kind.repository.factory", () => ({
  getKindRepository: vi.fn(async () => mockKindRepo),
}));

const entry: CodexEntry = {
  id: "entry-1",
  kindId: "kind-1",
  slug: "espada",
  title: "Espada",
  visibility: "public",
  createdAt: new Date(),
  updatedAt: new Date(),
  facets: [
    {
      id: "f1",
      entryId: "entry-1",
      facetType: "lore",
      data: { lore_md: "Lore." },
    },
  ],
  edges: [
    {
      id: "e1",
      fromEntryId: "entry-1",
      toEntryId: "entry-2",
      edgeType: "related_to",
      payload: null,
      createdAt: new Date(),
    },
  ],
};

const kind: Kind = {
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
          lore_md: { type: "string", format: "markdown" },
        },
      },
      aiPrompt: null,
      displayOrder: 0,
    },
    {
      id: "f2",
      kindId: "kind-1",
      facetType: "edges",
      enabled: true,
      required: false,
      schema: { allowedTypes: ["related_to"] },
      aiPrompt: null,
      displayOrder: 1,
    },
  ],
};

describe("getWikiEntryBySlug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWikiRepo.listTaxonomyChildren.mockResolvedValue([]);
  });

  it("retorna null quando RLS não expõe a entrada", async () => {
    mockWikiRepo.findBySlug.mockResolvedValue(null);

    await expect(getWikiEntryBySlug("privada")).resolves.toBeNull();
  });

  it("retorna null quando kind não existe", async () => {
    mockWikiRepo.findBySlug.mockResolvedValue(entry);
    mockKindRepo.findById.mockResolvedValue(null);

    await expect(getWikiEntryBySlug("espada")).resolves.toBeNull();
  });

  it("monta layout com targets visíveis", async () => {
    mockWikiRepo.findBySlug.mockResolvedValue(entry);
    mockKindRepo.findById.mockImplementation(async (id: string) => {
      if (id === "kind-1") {
        return kind;
      }
      if (id === "kind-2") {
        return { ...kind, id: "kind-2", slug: "npc", name: "NPC" };
      }
      return null;
    });
    mockWikiRepo.findByIds.mockResolvedValue([
      {
        ...entry,
        id: "entry-2",
        slug: "heroi",
        title: "Herói",
        kindId: "kind-2",
        edges: [],
        facets: [
          {
            id: "vf1",
            entryId: "entry-2",
            facetType: "visual",
            data: { banner_url: "https://example.com/hero.jpg" },
          },
        ],
      },
    ]);

    const detail = await getWikiEntryBySlug("espada");

    expect(detail?.entry.slug).toBe("espada");
    expect(detail?.layout.related[0]?.targets[0]?.slug).toBe("heroi");
    expect(detail?.layout.related[0]?.targets[0]?.bannerUrl).toBe(
      "https://example.com/hero.jpg",
    );
    expect(detail?.layoutMode).toBe("default");
    expect(detail?.taxonomy).toEqual({ ancestors: [], children: [] });
  });

  it("lista entradas via repositório wiki", async () => {
    mockWikiRepo.list.mockResolvedValue({ entries: [], total: 0 });
    await expect(listWikiEntries({ query: "x" })).resolves.toEqual({
      entries: [],
      total: 0,
    });
  });

  it("lista kinds visíveis", async () => {
    mockWikiRepo.listVisibleKindSlugs.mockResolvedValue(["weapon"]);
    await expect(listWikiKindSlugs()).resolves.toEqual(["weapon"]);
  });

  it("carrega ancestrais e filhos para habilidade (layout technique)", async () => {
    const habilidadeEntry: CodexEntry = {
      ...entry,
      id: "hab-1",
      slug: "corte-ascendente",
      title: "Corte Ascendente",
      edges: [
        {
          id: "tax-1",
          fromEntryId: "hab-1",
          toEntryId: "escola-1",
          edgeType: "taxonomy",
          payload: null,
          createdAt: new Date(),
        },
      ],
    };
    const escolaEntry: CodexEntry = {
      ...entry,
      id: "escola-1",
      slug: "escola-do-vento",
      title: "Escola do Vento",
      kindId: "kind-escola",
      edges: [],
    };
    const habilidadeKind: Kind = {
      ...kind,
      slug: "habilidade",
      name: "Habilidade",
    };
    const escolaKind: Kind = {
      ...kind,
      id: "kind-escola",
      slug: "escola",
      name: "Escola",
    };
    const childTarget = {
      id: "hab-2",
      slug: "corte-descendente",
      title: "Corte Descendente",
      kindSlug: "habilidade",
    };

    mockWikiRepo.findBySlug.mockResolvedValue(habilidadeEntry);
    mockWikiRepo.findByIds.mockResolvedValue([escolaEntry]);
    mockWikiRepo.listTaxonomyChildren.mockResolvedValue([childTarget]);
    mockKindRepo.findById.mockImplementation(async (id: string) => {
      if (id === "kind-1") {
        return habilidadeKind;
      }
      if (id === "kind-escola") {
        return escolaKind;
      }
      return null;
    });

    const detail = await getWikiEntryBySlug("corte-ascendente");

    expect(detail?.layoutMode).toBe("technique");
    expect(detail?.taxonomy.ancestors).toEqual([
      {
        id: "escola-1",
        slug: "escola-do-vento",
        title: "Escola do Vento",
        kindSlug: "escola",
      },
    ]);
    expect(detail?.taxonomy.children).toEqual([childTarget]);
    expect(mockWikiRepo.listTaxonomyChildren).toHaveBeenCalledWith("hab-1");
  });

  it("carrega ancestrais via classified_as + taxonomy do taxon", async () => {
    const criaturaEntry: CodexEntry = {
      ...entry,
      id: "cri-1",
      slug: "lobo-sombrio",
      title: "Lobo Sombrio",
      edges: [
        {
          id: "class-1",
          fromEntryId: "cri-1",
          toEntryId: "taxon-classe",
          edgeType: "classified_as",
          payload: null,
          createdAt: new Date(),
        },
      ],
    };
    const classeEntry: CodexEntry = {
      ...entry,
      id: "taxon-classe",
      slug: "classe-mamiferos",
      title: "Mamíferos",
      kindId: "kind-taxon",
      edges: [
        {
          id: "tax-1",
          fromEntryId: "taxon-classe",
          toEntryId: "taxon-reino",
          edgeType: "taxonomy",
          payload: null,
          createdAt: new Date(),
        },
      ],
    };
    const reinoEntry: CodexEntry = {
      ...entry,
      id: "taxon-reino",
      slug: "reino-hayoth",
      title: "Reino ḤAYOTH",
      kindId: "kind-taxon",
      edges: [
        {
          id: "tax-2",
          fromEntryId: "taxon-reino",
          toEntryId: "taxon-selo",
          edgeType: "taxonomy",
          payload: null,
          createdAt: new Date(),
        },
      ],
    };
    const seloEntry: CodexEntry = {
      ...entry,
      id: "taxon-selo",
      slug: "selo-hayim",
      title: "Selo ḤAYIM",
      kindId: "kind-taxon",
      edges: [],
    };
    const criaturaKind: Kind = {
      ...kind,
      slug: "criatura",
      name: "Criatura",
    };
    const taxonKind: Kind = {
      ...kind,
      id: "kind-taxon",
      slug: "taxon",
      name: "Classificação",
    };

    mockWikiRepo.findBySlug.mockResolvedValue(criaturaEntry);
    mockWikiRepo.findByIds.mockImplementation(async (ids: string[]) => {
      const byId: Record<string, CodexEntry> = {
        "taxon-classe": classeEntry,
        "taxon-reino": reinoEntry,
        "taxon-selo": seloEntry,
      };
      return ids.map((id) => byId[id]).filter(Boolean);
    });
    mockKindRepo.findById.mockImplementation(async (id: string) => {
      if (id === "kind-1") {
        return criaturaKind;
      }
      if (id === "kind-taxon") {
        return taxonKind;
      }
      return null;
    });

    const detail = await getWikiEntryBySlug("lobo-sombrio");

    expect(detail?.layoutMode).toBe("statBlock");
    expect(detail?.taxonomy.ancestors.map((item) => item.slug)).toEqual([
      "selo-hayim",
      "reino-hayoth",
      "classe-mamiferos",
    ]);
    expect(detail?.taxonomy.children).toEqual([]);
    expect(mockWikiRepo.listTaxonomyChildren).not.toHaveBeenCalled();
  });

  it("interrompe ancestrais quando pai não é encontrado", async () => {
    const criaturaEntry: CodexEntry = {
      ...entry,
      id: "cri-2",
      slug: "rato",
      title: "Rato",
      edges: [
        {
          id: "class-1",
          fromEntryId: "cri-2",
          toEntryId: "missing-parent",
          edgeType: "classified_as",
          payload: null,
          createdAt: new Date(),
        },
      ],
    };
    const criaturaKind: Kind = {
      ...kind,
      slug: "criatura",
      name: "Criatura",
    };

    mockWikiRepo.findBySlug.mockResolvedValue(criaturaEntry);
    mockWikiRepo.findByIds.mockResolvedValue([]);
    mockKindRepo.findById.mockResolvedValue(criaturaKind);

    const detail = await getWikiEntryBySlug("rato");

    expect(detail?.taxonomy).toEqual({ ancestors: [], children: [] });
  });
});
