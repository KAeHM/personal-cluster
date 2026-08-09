import { beforeEach, describe, expect, it, vi } from "vitest";

import { getWikiKindBrowse, listWikiKindIndex } from "./get-wiki-kind-browse";

const mockWikiRepo = {
  findBySlug: vi.fn(),
  findByIds: vi.fn(),
  list: vi.fn(),
  listVisibleKindSlugs: vi.fn(),
  findKindBySlug: vi.fn(),
  listVisibleKinds: vi.fn(),
  listTaxonomyEdgesForKind: vi.fn(),
  listTaxonomyChildren: vi.fn(),
};

vi.mock("../../infrastructure/wiki-codex.repository.factory", () => ({
  getWikiCodexRepository: vi.fn(async () => mockWikiRepo),
}));

describe("listWikiKindIndex", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delega ao repositório wiki", async () => {
    mockWikiRepo.listVisibleKinds.mockResolvedValue([
      {
        slug: "lenda",
        name: "Lenda",
        description: "Mitos",
        entryCount: 2,
      },
    ]);

    await expect(listWikiKindIndex()).resolves.toEqual([
      {
        slug: "lenda",
        name: "Lenda",
        description: "Mitos",
        entryCount: 2,
      },
    ]);
  });
});

describe("getWikiKindBrowse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna null quando kind não existe", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue(null);

    await expect(getWikiKindBrowse("desconhecido")).resolves.toBeNull();
  });

  it("retorna kind com lista vazia quando não há entradas visíveis", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue({
      slug: "lenda",
      name: "Lenda",
      description: null,
      entryCount: 0,
    });
    mockWikiRepo.list.mockResolvedValue({ entries: [], total: 0 });

    await expect(getWikiKindBrowse("lenda")).resolves.toEqual({
      kind: {
        slug: "lenda",
        name: "Lenda",
        description: null,
        entryCount: 0,
      },
      entries: [],
      total: 0,
    });
  });

  it("retorna entradas filtradas pelo kind", async () => {
    mockWikiRepo.findKindBySlug.mockResolvedValue({
      slug: "lenda",
      name: "Lenda",
      description: null,
      entryCount: 0,
    });
    mockWikiRepo.list.mockResolvedValue({
      entries: [
        {
          id: "e1",
          kindId: "k1",
          kindSlug: "lenda",
          slug: "genese",
          title: "Gênese",
          visibility: "public",
          shareCount: 0,
          updatedAt: new Date(),
        },
      ],
      total: 1,
    });

    const result = await getWikiKindBrowse("lenda", { query: "gen" });

    expect(mockWikiRepo.list).toHaveBeenCalledWith({
      query: "gen",
      kindSlug: "lenda",
    });
    expect(result?.entries).toHaveLength(1);
    expect(result?.kind.entryCount).toBe(1);
  });
});
