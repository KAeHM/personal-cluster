import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Kind } from "../../domain/kind";

const repo = {
  findById: vi.fn(),
  findBySlug: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../../infrastructure/kind.repository.factory", () => ({
  getKindRepository: () => Promise.resolve(repo),
}));

import { createKind } from "./create-kind";
import { deleteKind } from "./delete-kind";
import { getKind, getKindBySlug } from "./get-kind";
import { listKinds } from "./list-kinds";
import { updateKind } from "./update-kind";

const defaultFacets = [
  {
    facetType: "lore" as const,
    enabled: true,
    required: false,
    schema: null,
    aiPrompt: null,
  },
  {
    facetType: "system" as const,
    enabled: false,
    required: false,
    schema: null,
    aiPrompt: null,
  },
  {
    facetType: "lexicon" as const,
    enabled: false,
    required: false,
    schema: null,
    aiPrompt: null,
  },
  {
    facetType: "visual" as const,
    enabled: false,
    required: false,
    schema: null,
    aiPrompt: null,
  },
  {
    facetType: "edges" as const,
    enabled: false,
    required: false,
    schema: null,
    aiPrompt: null,
  },
  {
    facetType: "embeddings" as const,
    enabled: false,
    required: false,
    schema: null,
    aiPrompt: null,
  },
];

const sampleKind: Kind = {
  id: "k1",
  slug: "weapon",
  name: "Arma",
  description: null,
  aiPrompt: null,
  isBuiltin: false,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  facets: defaultFacets.map((f, i) => ({
    id: `f${i}`,
    kindId: "k1",
    facetType: f.facetType,
    enabled: f.enabled,
    required: f.required,
    schema: f.schema,
    aiPrompt: f.aiPrompt,
    displayOrder: i,
  })),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createKind", () => {
  it("cria quando o slug está livre", async () => {
    repo.findBySlug.mockResolvedValue(null);
    repo.create.mockResolvedValue(sampleKind);

    const result = await createKind({
      slug: "weapon",
      name: "Arma",
      description: null,
      aiPrompt: null,
      facets: defaultFacets,
    });

    expect(repo.findBySlug).toHaveBeenCalledWith("weapon");
    expect(repo.create).toHaveBeenCalled();
    expect(result).toEqual(sampleKind);
  });

  it("lança KIND_SLUG_TAKEN quando o slug já existe", async () => {
    repo.findBySlug.mockResolvedValue(sampleKind);

    await expect(
      createKind({
        slug: "weapon",
        name: "Arma",
        description: null,
        aiPrompt: null,
        facets: defaultFacets,
      }),
    ).rejects.toMatchObject({
      code: "KIND_SLUG_TAKEN",
    });
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe("getKind", () => {
  it("retorna o kind quando existe", async () => {
    repo.findById.mockResolvedValue(sampleKind);
    await expect(getKind("k1")).resolves.toEqual(sampleKind);
  });

  it("lança KIND_NOT_FOUND quando não existe", async () => {
    repo.findById.mockResolvedValue(null);
    await expect(getKind("missing")).rejects.toMatchObject({
      code: "KIND_NOT_FOUND",
    });
  });
});

describe("getKindBySlug", () => {
  it("retorna o kind quando existe", async () => {
    repo.findBySlug.mockResolvedValue(sampleKind);
    await expect(getKindBySlug("weapon")).resolves.toEqual(sampleKind);
  });

  it("lança KIND_NOT_FOUND quando não existe", async () => {
    repo.findBySlug.mockResolvedValue(null);
    await expect(getKindBySlug("missing")).rejects.toMatchObject({
      code: "KIND_NOT_FOUND",
    });
  });
});

describe("updateKind", () => {
  it("retorna o kind atualizado", async () => {
    const updated = { ...sampleKind, name: "Armas" };
    repo.findById.mockResolvedValue(sampleKind);
    repo.findBySlug.mockResolvedValue(null);
    repo.update.mockResolvedValue(updated);

    await expect(
      updateKind("k1", {
        slug: "weapon",
        name: "Armas",
        description: null,
        aiPrompt: null,
        facets: defaultFacets,
      }),
    ).resolves.toEqual(updated);
  });

  it("lança KIND_NOT_FOUND quando o id não existe", async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      updateKind("missing", {
        slug: "weapon",
        name: "Arma",
        description: null,
        aiPrompt: null,
        facets: defaultFacets,
      }),
    ).rejects.toMatchObject({
      code: "KIND_NOT_FOUND",
    });
  });

  it("bloqueia alteração de slug em kind integrado", async () => {
    repo.findById.mockResolvedValue({ ...sampleKind, isBuiltin: true });

    await expect(
      updateKind("k1", {
        slug: "new-slug",
        name: "Arma",
        description: null,
        aiPrompt: null,
        facets: defaultFacets,
      }),
    ).rejects.toMatchObject({
      code: "KIND_BUILTIN_SLUG_IMMUTABLE",
    });
  });

  it("lança KIND_SLUG_TAKEN ao renomear para slug existente", async () => {
    repo.findById.mockResolvedValue(sampleKind);
    repo.findBySlug.mockResolvedValue({ ...sampleKind, id: "k2" });

    await expect(
      updateKind("k1", {
        slug: "taken-slug",
        name: "Arma",
        description: null,
        aiPrompt: null,
        facets: defaultFacets,
      }),
    ).rejects.toMatchObject({
      code: "KIND_SLUG_TAKEN",
    });
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("lança KIND_NOT_FOUND quando update retorna null", async () => {
    repo.findById.mockResolvedValue(sampleKind);
    repo.update.mockResolvedValue(null);

    await expect(
      updateKind("k1", {
        slug: "weapon",
        name: "Arma",
        description: null,
        aiPrompt: null,
        facets: defaultFacets,
      }),
    ).rejects.toMatchObject({
      code: "KIND_NOT_FOUND",
    });
  });
});

describe("deleteKind", () => {
  it("remove kind não integrado", async () => {
    repo.findById.mockResolvedValue(sampleKind);
    repo.delete.mockResolvedValue(true);
    await expect(deleteKind("k1")).resolves.toBeUndefined();
  });

  it("lança KIND_BUILTIN_DELETE para kind integrado", async () => {
    repo.findById.mockResolvedValue({ ...sampleKind, isBuiltin: true });
    await expect(deleteKind("k1")).rejects.toMatchObject({
      code: "KIND_BUILTIN_DELETE",
    });
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it("lança KIND_NOT_FOUND quando não existe", async () => {
    repo.findById.mockResolvedValue(null);
    await expect(deleteKind("missing")).rejects.toMatchObject({
      code: "KIND_NOT_FOUND",
    });
  });

  it("lança KIND_NOT_FOUND quando delete retorna false", async () => {
    repo.findById.mockResolvedValue(sampleKind);
    repo.delete.mockResolvedValue(false);

    await expect(deleteKind("k1")).rejects.toMatchObject({
      code: "KIND_NOT_FOUND",
    });
  });
});

describe("listKinds", () => {
  it("repassa a lista do repositório", async () => {
    repo.list.mockResolvedValue([sampleKind]);
    await expect(listKinds()).resolves.toEqual([sampleKind]);
  });
});
