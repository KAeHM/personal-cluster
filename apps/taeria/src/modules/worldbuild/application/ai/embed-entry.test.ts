import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CodexEntry } from "../../domain/codex-entry";
import type { Kind } from "../../domain/kind";

const embedMany = vi.fn();
const isGeminiConfigured = vi.fn();
const getGeminiEmbeddingModel = vi.fn();
const logError = vi.fn();

const codexRepo = {
  replaceEmbeddings: vi.fn(),
};

vi.mock("ai", () => ({
  embedMany: (...args: unknown[]) => embedMany(...args),
}));

vi.mock("../../infrastructure/ai/gemini.client", () => ({
  GEMINI_EMBEDDING_DIMENSIONS: 1536,
  isGeminiConfigured: () => isGeminiConfigured(),
  getGeminiEmbeddingModel: () => getGeminiEmbeddingModel(),
}));

vi.mock("../../infrastructure/codex.repository.factory", () => ({
  getCodexRepository: () => Promise.resolve(codexRepo),
}));

vi.mock("@/common/errors", () => ({
  logError: (...args: unknown[]) => logError(...args),
}));

import {
  embedCodexEntry,
  embedCodexEntrySafe,
  isEmbeddingEnabled,
} from "./embed-entry";

function makeKind(embeddingsEnabled: boolean): Kind {
  return {
    id: "k1",
    slug: "lenda",
    name: "Lenda",
    description: null,
    aiPrompt: null,
    isBuiltin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    facets: [
      {
        id: "f1",
        kindId: "k1",
        facetType: "embeddings",
        enabled: embeddingsEnabled,
        required: false,
        schema: null,
        aiPrompt: null,
        displayOrder: 5,
      },
    ],
  };
}

function makeEntry(overrides?: Partial<CodexEntry>): CodexEntry {
  return {
    id: "entry-1",
    kindId: "k1",
    slug: "genese",
    title: "A Gênese",
    visibility: "public",
    createdAt: new Date(),
    updatedAt: new Date(),
    facets: [
      {
        id: "fc1",
        entryId: "entry-1",
        facetType: "lore",
        data: { lore_md: "No princípio era o vento." },
      },
    ],
    edges: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  isGeminiConfigured.mockReturnValue(true);
  getGeminiEmbeddingModel.mockReturnValue("embedding-model");
  embedMany.mockResolvedValue({ embeddings: [[0.1, 0.2]] });
  codexRepo.replaceEmbeddings.mockResolvedValue(undefined);
});

describe("isEmbeddingEnabled", () => {
  it("reflete a facet embeddings do kind", () => {
    expect(isEmbeddingEnabled(makeKind(true))).toBe(true);
    expect(isEmbeddingEnabled(makeKind(false))).toBe(false);
  });
});

describe("embedCodexEntry", () => {
  it("embeda chunks e substitui embeddings da entrada", async () => {
    await embedCodexEntry(makeEntry(), makeKind(true));

    expect(embedMany).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "embedding-model",
        values: ["# A Gênese\n\nNo princípio era o vento."],
        providerOptions: {
          google: {
            outputDimensionality: 1536,
            taskType: "RETRIEVAL_DOCUMENT",
          },
        },
      }),
    );
    expect(codexRepo.replaceEmbeddings).toHaveBeenCalledWith("entry-1", [
      {
        chunkIndex: 0,
        content: "# A Gênese\n\nNo princípio era o vento.",
        embedding: [0.1, 0.2],
      },
    ]);
  });

  it("não faz nada com facet embeddings desligada", async () => {
    await embedCodexEntry(makeEntry(), makeKind(false));

    expect(embedMany).not.toHaveBeenCalled();
    expect(codexRepo.replaceEmbeddings).not.toHaveBeenCalled();
  });

  it("não faz nada sem Gemini configurado", async () => {
    isGeminiConfigured.mockReturnValue(false);

    await embedCodexEntry(makeEntry(), makeKind(true));

    expect(embedMany).not.toHaveBeenCalled();
  });

  it("não faz nada sem conteúdo para chunkar", async () => {
    await embedCodexEntry(
      makeEntry({ title: "  ", facets: [] }),
      makeKind(true),
    );

    expect(embedMany).not.toHaveBeenCalled();
  });
});

describe("embedCodexEntrySafe", () => {
  it("engole a falha e loga (não-fatal)", async () => {
    embedMany.mockRejectedValue(new Error("quota"));

    await expect(
      embedCodexEntrySafe(makeEntry(), makeKind(true)),
    ).resolves.toBeUndefined();

    expect(logError).toHaveBeenCalledWith(expect.any(Error), {
      entryId: "entry-1",
      context: "embed_codex_entry",
    });
  });

  it("não loga quando o embed funciona", async () => {
    await embedCodexEntrySafe(makeEntry(), makeKind(true));
    expect(logError).not.toHaveBeenCalled();
  });
});
