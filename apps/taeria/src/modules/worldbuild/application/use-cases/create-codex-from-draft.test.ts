import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyCodexDraft } from "../../domain/codex-draft";
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
import { createCodexFromDraft } from "./create-codex-from-draft";

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
    visibility: "private",
    facets: [],
    edges: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

describe("createCodexFromDraft", () => {
  it("persiste entrada válida", async () => {
    const draft = createEmptyCodexDraft("s1");
    draft.kindSlug = "weapon";
    draft.title = "Espada";
    draft.slug = "espada";
    draft.facets.lore = { lore_md: "Lore da espada." };

    const entry = await createCodexFromDraft(draft);
    expect(entry.id).toBe("entry-1");
    expect(codexRepo.create).toHaveBeenCalledOnce();
    expect(embedCodexEntrySafe).toHaveBeenCalledWith(
      expect.objectContaining({ id: "entry-1" }),
      weaponKind,
    );
  });

  it("persiste faceta visual opcional", async () => {
    const kindWithVisual: typeof weaponKind = {
      ...weaponKind,
      facets: weaponKind.facets.map((facet) =>
        facet.facetType === "visual"
          ? {
              ...facet,
              enabled: true,
              schema: {
                type: "object",
                properties: {
                  banner_url: {
                    type: "string",
                    format: "image",
                    title: "Banner",
                  },
                },
              },
            }
          : facet,
      ),
    };
    kindRepo.findBySlug.mockResolvedValue(kindWithVisual);

    const draft = createEmptyCodexDraft("s1");
    draft.kindSlug = "weapon";
    draft.title = "Espada";
    draft.slug = "espada";
    draft.facets.lore = { lore_md: "Lore da espada." };
    draft.facets.visual = {
      banner_url: "https://example.com/banner.jpg",
    };

    await createCodexFromDraft(draft);

    expect(codexRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        facets: expect.arrayContaining([
          expect.objectContaining({
            facetType: "visual",
            data: { banner_url: "https://example.com/banner.jpg" },
          }),
        ]),
      }),
    );
  });

  it("rejeita slug duplicado", async () => {
    codexRepo.slugExists.mockResolvedValue(true);
    const draft = createEmptyCodexDraft("s1");
    draft.kindSlug = "weapon";
    draft.title = "Espada";
    draft.slug = "espada";
    draft.facets.lore = { lore_md: "Lore." };

    await expect(createCodexFromDraft(draft)).rejects.toMatchObject({
      code: "CODEX_SLUG_TAKEN",
    });
  });

  it("falha quando destino da relação não existe", async () => {
    codexRepo.findBySlug.mockResolvedValue(null);
    const draft = createEmptyCodexDraft("s1");
    draft.kindSlug = "weapon";
    draft.title = "Espada";
    draft.slug = "espada";
    draft.facets.lore = { lore_md: "Lore." };
    draft.edges = [{ type: "related_to", toSlug: "inexistente" }];

    const kindWithEdges: typeof weaponKind = {
      ...weaponKind,
      facets: weaponKind.facets.map((facet) =>
        facet.facetType === "edges" ? { ...facet, enabled: true } : facet,
      ),
    };
    kindRepo.findBySlug.mockResolvedValue(kindWithEdges);

    await expect(createCodexFromDraft(draft)).rejects.toMatchObject({
      code: "CODEX_NOT_FOUND",
    });
  });

  it("rejeita identidade incompleta", async () => {
    const draft = createEmptyCodexDraft("s1");
    await expect(createCodexFromDraft(draft)).rejects.toMatchObject({
      code: "CODEX_VALIDATION_FAILED",
    });
  });

  it("rejeita kind inexistente", async () => {
    kindRepo.findBySlug.mockResolvedValue(null);
    const draft = createEmptyCodexDraft("s1");
    draft.kindSlug = "desconhecido";
    draft.title = "Espada";
    draft.slug = "espada";
    draft.facets.lore = { lore_md: "Lore." };

    await expect(createCodexFromDraft(draft)).rejects.toMatchObject({
      code: "CODEX_KIND_NOT_FOUND",
    });
  });
});
