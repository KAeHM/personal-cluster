import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Kind } from "../../domain/kind";

const codexRepo = {
  findById: vi.fn(),
  findBySlug: vi.fn(),
  slugExists: vi.fn(),
  update: vi.fn(),
};

const kindRepo = {
  findById: vi.fn(),
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
import { updateCodexEntry } from "./update-codex-entry";

const existingEntry = {
  id: "entry-1",
  kindId: "k1",
  slug: "espada",
  title: "Espada",
  visibility: "private" as const,
  facets: [],
  edges: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

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
  codexRepo.findById.mockResolvedValue(existingEntry);
  kindRepo.findById.mockResolvedValue(weaponKind);
  codexRepo.slugExists.mockResolvedValue(false);
  codexRepo.update.mockResolvedValue({
    ...existingEntry,
    title: "Espada Nova",
  });
});

describe("updateCodexEntry", () => {
  it("atualiza entrada válida", async () => {
    const entry = await updateCodexEntry("entry-1", {
      title: "Espada Nova",
      slug: "espada",
      facets: { lore: { lore_md: "Lore atualizada." } },
      edges: [],
    });

    expect(entry.title).toBe("Espada Nova");
    expect(codexRepo.update).toHaveBeenCalledOnce();
    expect(embedCodexEntrySafe).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Espada Nova" }),
      weaponKind,
    );
  });

  it("persiste visibilidade e compartilhamentos", async () => {
    await updateCodexEntry("entry-1", {
      title: "Espada Nova",
      slug: "espada",
      visibility: "public",
      sharedUserIds: ["u1", "u2"],
      facets: { lore: { lore_md: "Lore atualizada." } },
      edges: [],
    });

    expect(codexRepo.update).toHaveBeenCalledWith(
      "entry-1",
      expect.objectContaining({
        visibility: "public",
        sharedUserIds: ["u1", "u2"],
      }),
    );
  });

  it("rejeita slug duplicado", async () => {
    codexRepo.slugExists.mockResolvedValue(true);

    await expect(
      updateCodexEntry("entry-1", {
        title: "Espada",
        slug: "outro-slug",
        facets: { lore: { lore_md: "Lore." } },
        edges: [],
      }),
    ).rejects.toMatchObject({ code: "CODEX_SLUG_TAKEN" });
  });

  it("falha quando entrada não existe", async () => {
    codexRepo.findById.mockResolvedValue(null);

    await expect(
      updateCodexEntry("missing", {
        title: "Espada",
        slug: "espada",
        facets: { lore: { lore_md: "Lore." } },
        edges: [],
      }),
    ).rejects.toMatchObject({ code: "CODEX_NOT_FOUND" });
  });

  it("rejeita validação de faceta", async () => {
    await expect(
      updateCodexEntry("entry-1", {
        title: "Espada",
        slug: "espada",
        facets: {},
        edges: [],
      }),
    ).rejects.toMatchObject({ code: "CODEX_VALIDATION_FAILED" });
  });

  it("resolve alvo de edge por slug", async () => {
    codexRepo.findBySlug.mockResolvedValue({
      ...existingEntry,
      id: "entry-2",
      slug: "alvo",
    });

    await updateCodexEntry("entry-1", {
      title: "Espada Nova",
      slug: "espada",
      facets: { lore: { lore_md: "Lore." } },
      edges: [{ type: "related_to", toSlug: "alvo" }],
    });

    expect(codexRepo.update).toHaveBeenCalledWith(
      "entry-1",
      expect.objectContaining({
        edges: [
          expect.objectContaining({
            edgeType: "related_to",
            toEntryId: "entry-2",
          }),
        ],
      }),
    );
  });
});
