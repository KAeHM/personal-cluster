import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

import type { CodexRepository } from "../../../domain/codex.repository";
import type { KindRepository } from "../../../domain/kind.repository";
import {
  getGeminiMaxOutputTokens,
  getGeminiModel,
} from "../../../infrastructure/ai/gemini.client";
import { TAERIA_GLOBAL_PROMPT } from "../prompts";
import {
  buildEntryDossier,
  enrichCandidatesDeterministically,
  formatEdgesOnly,
  formatEntryDossier,
  loadEntryEdges,
  MAX_DETERMINISTIC_ENRICH,
} from "./entry-dossier";

export const CONTEXT_DEEPEN_MAX_STEPS = 4;

export function createContextEnrichmentTools(
  codexRepo: CodexRepository,
  kindRepo: KindRepository,
) {
  return {
    getCodexEntry: tool({
      description:
        "Carrega a ficha completa de uma entrada do codex pelo slug (lore resumido, system, lexicon e relações). Use quando um trecho RAG mencionar um slug relevante e você precisar de mais cânone.",
      inputSchema: z.object({
        slug: z.string().describe("Slug da entrada (ex.: escola-do-vento)"),
      }),
      execute: async ({ slug }) => {
        const dossier = await buildEntryDossier(codexRepo, kindRepo, slug);
        if (!dossier) {
          return {
            ok: false as const,
            message: `Entrada não encontrada: ${slug}`,
          };
        }
        return {
          ok: true as const,
          dossier: formatEntryDossier(dossier),
        };
      },
    }),
    getEntryEdges: tool({
      description:
        "Lista só as relações (edges) de uma entrada pelo slug — útil para entender taxonomia, crafted_by, related_to, etc.",
      inputSchema: z.object({
        slug: z.string().describe("Slug da entrada"),
      }),
      execute: async ({ slug }) => {
        const entry = await codexRepo.findBySlug(slug.trim());
        if (!entry) {
          return {
            ok: false as const,
            message: `Entrada não encontrada: ${slug}`,
          };
        }
        const edges = await loadEntryEdges(codexRepo, entry);
        return {
          ok: true as const,
          edges: formatEdgesOnly(entry.slug, entry.title, edges),
        };
      },
    }),
  };
}

export type ContextEnrichmentTools = ReturnType<
  typeof createContextEnrichmentTools
>;

function collectNotesFromToolSteps(
  steps: Array<{
    toolResults: Array<{
      output: unknown;
    }>;
  }>,
): string[] {
  const notes: string[] = [];

  for (const step of steps) {
    for (const result of step.toolResults) {
      const output = result.output as
        | { ok?: boolean; dossier?: string; edges?: string; message?: string }
        | undefined;
      if (!output || typeof output !== "object") {
        continue;
      }
      if (output.ok && typeof output.dossier === "string") {
        notes.push(output.dossier);
      } else if (output.ok && typeof output.edges === "string") {
        notes.push(output.edges);
      }
    }
  }

  return notes;
}

/**
 * Loop de tools do context agent: aprofunda candidatas do RAG.
 * Se o LLM falhar ou não chamar tools, enriquece as top candidatas de forma determinística.
 */
export async function deepenCanonWithTools(input: {
  codexRepo: CodexRepository;
  kindRepo: KindRepository;
  relatedSection: string;
  candidateSlugs: string[];
  plannerSummary: string;
  userMessage?: string;
}): Promise<string[]> {
  const {
    codexRepo,
    kindRepo,
    relatedSection,
    candidateSlugs,
    plannerSummary,
    userMessage,
  } = input;

  if (candidateSlugs.length === 0) {
    return [];
  }

  const tools = createContextEnrichmentTools(codexRepo, kindRepo);
  const candidatesList = candidateSlugs.map((slug) => `- ${slug}`).join("\n");

  try {
    const result = await generateText({
      model: getGeminiModel("fast"),
      maxOutputTokens: getGeminiMaxOutputTokens("fast"),
      tools,
      stopWhen: stepCountIs(CONTEXT_DEEPEN_MAX_STEPS),
      system: `${TAERIA_GLOBAL_PROMPT}

Você aprofunda o cânone do codex Taeria para um agente escritor.
Use as tools getCodexEntry e/ou getEntryEdges nos slugs mais relevantes (máx. ~${MAX_DETERMINISTIC_ENRICH} entradas).
Não invente slugs — escolha apenas da lista de candidatas ou mencionados nos trechos.
Quando tiver o suficiente, pare de chamar tools e responda com uma linha curta confirmando o que aprofundou.`,
      prompt: `Intenção: ${plannerSummary}
Mensagem do usuário: ${userMessage?.trim() || "(não informada)"}

${relatedSection}

Candidatas sugeridas:
${candidatesList}`,
    });

    const fromTools = collectNotesFromToolSteps(result.steps);
    if (fromTools.length > 0) {
      return fromTools;
    }
  } catch {
    // cai no fallback determinístico
  }

  return enrichCandidatesDeterministically(
    codexRepo,
    kindRepo,
    candidateSlugs,
    MAX_DETERMINISTIC_ENRICH,
  );
}
