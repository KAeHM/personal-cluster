import { beforeEach, describe, expect, it, vi } from "vitest";

const generateText = vi.fn();
const enrichCandidatesDeterministically = vi.fn();
const buildEntryDossier = vi.fn();
const formatEntryDossier = vi.fn();
const formatEdgesOnly = vi.fn();
const loadEntryEdges = vi.fn();

vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => generateText(...args),
  stepCountIs: (n: number) => n,
  tool: (def: unknown) => def,
}));

vi.mock("../../../infrastructure/ai/gemini.client", () => ({
  getGeminiModel: vi.fn(() => "fast-model"),
  getGeminiMaxOutputTokens: vi.fn(() => 8192),
}));

vi.mock("./entry-dossier", async () => {
  const actual =
    await vi.importActual<typeof import("./entry-dossier")>("./entry-dossier");
  return {
    ...actual,
    enrichCandidatesDeterministically: (...args: unknown[]) =>
      enrichCandidatesDeterministically(...args),
    buildEntryDossier: (...args: unknown[]) => buildEntryDossier(...args),
    formatEntryDossier: (...args: unknown[]) => formatEntryDossier(...args),
    formatEdgesOnly: (...args: unknown[]) => formatEdgesOnly(...args),
    loadEntryEdges: (...args: unknown[]) => loadEntryEdges(...args),
  };
});

import { deepenCanonWithTools } from "./deepen-canon";

beforeEach(() => {
  vi.clearAllMocks();
  enrichCandidatesDeterministically.mockResolvedValue(["fallback-dossier"]);
});

describe("deepenCanonWithTools", () => {
  it("retorna vazio sem candidatas", async () => {
    const notes = await deepenCanonWithTools({
      codexRepo: {} as never,
      kindRepo: {} as never,
      relatedSection: "",
      candidateSlugs: [],
      plannerSummary: "x",
    });
    expect(notes).toEqual([]);
    expect(generateText).not.toHaveBeenCalled();
  });

  it("usa resultados das tools quando o LLM aprofunda", async () => {
    generateText.mockResolvedValue({
      text: "ok",
      steps: [
        {
          toolResults: [
            {
              output: {
                ok: true,
                dossier: "## Escola\nLore: vento",
              },
            },
          ],
        },
      ],
    });

    const notes = await deepenCanonWithTools({
      codexRepo: {} as never,
      kindRepo: {} as never,
      relatedSection: "trechos",
      candidateSlugs: ["escola-do-vento"],
      plannerSummary: "criar habilidade",
    });

    expect(notes).toEqual(["## Escola\nLore: vento"]);
    expect(enrichCandidatesDeterministically).not.toHaveBeenCalled();
  });

  it("cai no fallback determinístico se o LLM falhar", async () => {
    generateText.mockRejectedValue(new Error("quota"));

    const notes = await deepenCanonWithTools({
      codexRepo: {} as never,
      kindRepo: {} as never,
      relatedSection: "trechos",
      candidateSlugs: ["escola-do-vento"],
      plannerSummary: "criar habilidade",
    });

    expect(notes).toEqual(["fallback-dossier"]);
    expect(enrichCandidatesDeterministically).toHaveBeenCalled();
  });

  it("cai no fallback se o LLM não chamar tools", async () => {
    generateText.mockResolvedValue({
      text: "nada",
      steps: [{ toolResults: [] }],
    });

    const notes = await deepenCanonWithTools({
      codexRepo: {} as never,
      kindRepo: {} as never,
      relatedSection: "trechos",
      candidateSlugs: ["escola-do-vento"],
      plannerSummary: "criar habilidade",
    });

    expect(notes).toEqual(["fallback-dossier"]);
  });
});
