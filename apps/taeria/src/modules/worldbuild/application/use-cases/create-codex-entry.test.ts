import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Kind } from "../../domain/kind";

const codexRepo = {
  slugExists: vi.fn(),
  findBySlug: vi.fn(),
  create: vi.fn(),
};

const kindRepo = {
  findBySlug: vi.fn(),
};

vi.mock("../../infrastructure/codex.repository.factory", () => ({
  getCodexRepository: () => Promise.resolve(codexRepo),
}));

vi.mock("../../infrastructure/kind.repository.factory", () => ({
  getKindRepository: () => Promise.resolve(kindRepo),
}));

vi.mock("../ai/embed-entry", () => ({
  embedCodexEntrySafe: vi.fn().mockResolvedValue(undefined),
}));

import { embedCodexEntrySafe } from "../ai/embed-entry";
import { createCodexEntry } from "./create-codex-entry";

const weaponKind: Kind = {
  id: "k1",
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
      kindId: "k1",
      facetType: "lore",
      enabled: true,
      required: true,
      schema: {
        type: "object",
        properties: {
          lore_md: { type: "string", format: "markdown" },
        },
        required: ["lore_md"],
      },
      aiPrompt: null,
      displayOrder: 0,
    },
    {
      id: "f2",
      kindId: "k1",
      facetType: "system",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 1,
    },
    {
      id: "f3",
      kindId: "k1",
      facetType: "lexicon",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 2,
    },
    {
      id: "f4",
      kindId: "k1",
      facetType: "visual",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 3,
    },
    {
      id: "f5",
      kindId: "k1",
      facetType: "edges",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 4,
    },
    {
      id: "f6",
      kindId: "k1",
      facetType: "embeddings",
      enabled: false,
      required: false,
      schema: null,
      aiPrompt: null,
      displayOrder: 5,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  kindRepo.findBySlug.mockResolvedValue(weaponKind);
  codexRepo.slugExists.mockResolvedValue(false);
  codexRepo.create.mockResolvedValue({
    id: "entry-1",
    kindId: "k1",
    slug: "espada",
    title: "Espada",
    visibility: "public",
    facets: [],
    edges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

describe("createCodexEntry", () => {
  it("persiste entrada válida com visibilidade e shares", async () => {
    const entry = await createCodexEntry("weapon", {
      title: "Espada",
      slug: "espada",
      visibility: "public",
      sharedUserIds: ["u1"],
      facets: { lore: { lore_md: "Lore da espada." } },
      edges: [],
    });

    expect(entry.id).toBe("entry-1");
    expect(codexRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        kindId: "k1",
        title: "Espada",
        slug: "espada",
        visibility: "public",
        sharedUserIds: ["u1"],
      }),
    );
    expect(embedCodexEntrySafe).toHaveBeenCalled();
  });

  it("rejeita kind inexistente", async () => {
    kindRepo.findBySlug.mockResolvedValue(null);

    await expect(
      createCodexEntry("desconhecido", {
        title: "Espada",
        slug: "espada",
        facets: { lore: { lore_md: "Lore." } },
        edges: [],
      }),
    ).rejects.toMatchObject({ code: "CODEX_KIND_NOT_FOUND" });
  });

  it("rejeita slug duplicado", async () => {
    codexRepo.slugExists.mockResolvedValue(true);

    await expect(
      createCodexEntry("weapon", {
        title: "Espada",
        slug: "espada",
        facets: { lore: { lore_md: "Lore." } },
        edges: [],
      }),
    ).rejects.toMatchObject({ code: "CODEX_SLUG_TAKEN" });
  });

  it("rejeita validação de faceta", async () => {
    await expect(
      createCodexEntry("weapon", {
        title: "Espada",
        slug: "espada",
        facets: {},
        edges: [],
      }),
    ).rejects.toMatchObject({ code: "CODEX_VALIDATION_FAILED" });
  });
});
