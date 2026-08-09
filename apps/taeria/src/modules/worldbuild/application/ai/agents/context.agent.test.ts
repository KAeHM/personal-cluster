import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyCodexDraft } from "../../../domain/codex-draft";
import type { Kind } from "../../../domain/kind";
import type { PlannerOutput } from "../types";

const generateObject = vi.fn();
const searchCodexSemantic = vi.fn();
const searchCodexEntries = vi.fn();
const resolveEntrySlugs = vi.fn();
const getWriterVoiceContext = vi.fn();
const deepenCanonWithTools = vi.fn();
const collectCandidateSlugs = vi.fn();

const codexRepo = {
  list: vi.fn(),
};

vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => generateObject(...args),
}));

vi.mock("../../../infrastructure/ai/gemini.client", () => ({
  getGeminiModel: vi.fn(() => "fast-model"),
  getGeminiMaxOutputTokens: vi.fn(() => 8192),
}));

vi.mock("../../../infrastructure/codex.repository.factory", () => ({
  getCodexRepository: () => Promise.resolve(codexRepo),
}));

vi.mock("../../../infrastructure/kind.repository.factory", () => ({
  getKindRepository: () => Promise.resolve({}),
}));

vi.mock("../tools", () => ({
  searchCodexSemantic: (...args: unknown[]) => searchCodexSemantic(...args),
  searchCodexEntries: (...args: unknown[]) => searchCodexEntries(...args),
  resolveEntrySlugs: (...args: unknown[]) => resolveEntrySlugs(...args),
  getWriterVoiceContext: (...args: unknown[]) => getWriterVoiceContext(...args),
  deepenCanonWithTools: (...args: unknown[]) => deepenCanonWithTools(...args),
  collectCandidateSlugs: (...args: unknown[]) => collectCandidateSlugs(...args),
}));

import {
  formatSemanticExcerpts,
  isTaxonomyAllowedForKind,
  runContextAgent,
} from "./context.agent";

function makeKind(overrides?: Partial<Kind>): Kind {
  return {
    id: "k1",
    slug: "habilidade",
    name: "Habilidade",
    description: null,
    aiPrompt: null,
    isBuiltin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    facets: [
      {
        id: "f-edges",
        kindId: "k1",
        facetType: "edges",
        enabled: true,
        required: false,
        schema: { allowedTypes: ["related_to", "taxonomy"] },
        aiPrompt: null,
        displayOrder: 4,
      },
    ],
    ...overrides,
  };
}

const planner: PlannerOutput = {
  intent: "create",
  kindSlug: "habilidade",
  title: "Corte Ascendente",
  slug: "corte-ascendente",
  slots: {},
  agentsToRun: ["lore"],
  summary: "Criar habilidade da escola do vento",
};

const baseObject = {
  userIntent: "criar habilidade",
  styleNotes: [],
  systemRules: [],
  constraints: [],
  refSlugs: [],
  taxonomyParentSlug: null,
};

const semanticChunk = {
  entryId: "e1",
  slug: "escola-do-vento",
  title: "Escola do Vento",
  kindSlug: "escola",
  chunkIndex: 0,
  content: "# Escola do Vento\n\nA escola valoriza leveza e precisão.",
  similarity: 0.91,
};

beforeEach(() => {
  vi.clearAllMocks();
  generateObject.mockResolvedValue({ object: { ...baseObject } });
  searchCodexSemantic.mockResolvedValue([]);
  searchCodexEntries.mockResolvedValue([]);
  resolveEntrySlugs.mockResolvedValue({ resolved: [], missing: [] });
  getWriterVoiceContext.mockResolvedValue([]);
  deepenCanonWithTools.mockResolvedValue([]);
  collectCandidateSlugs.mockImplementation(
    (input: { semanticSlugs?: string[]; keywordSlugs?: string[] }) => [
      ...(input.semanticSlugs ?? []),
      ...(input.keywordSlugs ?? []),
    ],
  );
  codexRepo.list.mockResolvedValue({ entries: [], total: 0 });
});

describe("formatSemanticExcerpts", () => {
  it("formata trechos com slug, kind, similaridade e conteúdo achatado", () => {
    const formatted = formatSemanticExcerpts([semanticChunk]);
    expect(formatted).toContain("Escola do Vento");
    expect(formatted).toContain("slug: escola-do-vento");
    expect(formatted).toContain("similaridade 0.91");
    expect(formatted).not.toContain("\n\n");
  });
});

describe("isTaxonomyAllowedForKind", () => {
  it("permite quando edges habilitada inclui taxonomy", () => {
    expect(isTaxonomyAllowedForKind(makeKind())).toBe(true);
  });

  it("nega com facet edges desligada", () => {
    const kind = makeKind();
    kind.facets = kind.facets.map((facet) => ({ ...facet, enabled: false }));
    expect(isTaxonomyAllowedForKind(kind)).toBe(false);
  });

  it("nega quando allowedTypes não tem taxonomy", () => {
    const kind = makeKind();
    kind.facets = kind.facets.map((facet) => ({
      ...facet,
      schema: { allowedTypes: ["related_to"] },
    }));
    expect(isTaxonomyAllowedForKind(kind)).toBe(false);
  });
});

describe("runContextAgent", () => {
  it("injeta trechos semânticos no prompt e não usa busca keyword", async () => {
    searchCodexSemantic.mockResolvedValue([semanticChunk]);

    await runContextAgent(
      planner,
      createEmptyCodexDraft("s1"),
      makeKind(),
      "quero uma técnica de vento",
    );

    const call = generateObject.mock.calls[0]![0] as { system: string };
    expect(call.system).toContain("busca semântica");
    expect(call.system).toContain("escola-do-vento");
    expect(searchCodexEntries).not.toHaveBeenCalled();
  });

  it("cai na busca keyword sem resultados semânticos", async () => {
    searchCodexEntries.mockResolvedValue([{ slug: "postura-da-neblina" }]);

    await runContextAgent(planner, createEmptyCodexDraft("s1"), makeKind());

    const call = generateObject.mock.calls[0]![0] as { system: string };
    expect(call.system).toContain("Entradas relacionadas encontradas");
    expect(call.system).toContain("postura-da-neblina");
  });

  it("cai na busca keyword quando a busca semântica falha", async () => {
    searchCodexSemantic.mockRejectedValue(new Error("sem embeddings"));

    await runContextAgent(planner, createEmptyCodexDraft("s1"), makeKind());

    expect(searchCodexEntries).toHaveBeenCalled();
  });

  it("lista candidatos a pai e aceita taxonomyParentSlug válido", async () => {
    codexRepo.list.mockImplementation(({ kindSlug }: { kindSlug: string }) =>
      Promise.resolve(
        kindSlug === "escola"
          ? {
              entries: [
                {
                  slug: "escola-do-vento",
                  title: "Escola do Vento",
                  kindSlug: "escola",
                },
              ],
              total: 1,
            }
          : { entries: [], total: 0 },
      ),
    );
    generateObject.mockResolvedValue({
      object: { ...baseObject, taxonomyParentSlug: "escola-do-vento" },
    });

    const context = await runContextAgent(
      planner,
      createEmptyCodexDraft("s1"),
      makeKind(),
    );

    const call = generateObject.mock.calls[0]![0] as { system: string };
    expect(call.system).toContain("Candidatos a pai");
    expect(call.system).toContain("escola-do-vento — Escola do Vento");
    expect(context.taxonomyParentSlug).toBe("escola-do-vento");
    expect(codexRepo.list).toHaveBeenCalledWith({
      kindSlug: "habilidade",
      limit: 50,
    });
    expect(codexRepo.list).toHaveBeenCalledWith({
      kindSlug: "escola",
      limit: 50,
    });
  });

  it("descarta taxonomyParentSlug fora dos candidatos", async () => {
    generateObject.mockResolvedValue({
      object: { ...baseObject, taxonomyParentSlug: "slug-inventado" },
    });

    const context = await runContextAgent(
      planner,
      createEmptyCodexDraft("s1"),
      makeKind(),
    );

    expect(context.taxonomyParentSlug).toBeNull();
  });

  it("não carrega candidatos quando o kind não permite taxonomy", async () => {
    const kind = makeKind();
    kind.facets = kind.facets.map((facet) => ({
      ...facet,
      schema: { allowedTypes: ["related_to"] },
    }));

    await runContextAgent(planner, createEmptyCodexDraft("s1"), kind);

    expect(codexRepo.list).not.toHaveBeenCalled();
    const call = generateObject.mock.calls[0]![0] as { system: string };
    expect(call.system).toContain("Deixe taxonomyParentSlug como null");
  });

  it("aprofunda o cânone com tools e injeta dossiês no prompt e no contexto", async () => {
    searchCodexSemantic.mockResolvedValue([semanticChunk]);
    deepenCanonWithTools.mockResolvedValue([
      "## Escola do Vento (slug: escola-do-vento)\nRelações:\n- taxonomy → Arte da Espada",
    ]);

    const context = await runContextAgent(
      planner,
      createEmptyCodexDraft("s1"),
      makeKind(),
      "técnica de vento",
    );

    expect(deepenCanonWithTools).toHaveBeenCalled();
    const call = generateObject.mock.calls[0]![0] as { system: string };
    expect(call.system).toContain("Cânone aprofundado");
    expect(call.system).toContain("escola-do-vento");
    expect(context.canonNotes?.[0]).toContain("Escola do Vento");
  });
});
