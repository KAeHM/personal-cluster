import { generateObject } from "ai";
import { z } from "zod";

import type { CodexDraft } from "../../../domain/codex-draft";
import type {
  CodexEntrySummary,
  CodexSimilarChunk,
} from "../../../domain/codex-entry";
import type { CodexRepository } from "../../../domain/codex.repository";
import type { Kind } from "../../../domain/kind";
import {
  getGeminiMaxOutputTokens,
  getGeminiModel,
} from "../../../infrastructure/ai/gemini.client";
import { getCodexRepository } from "../../../infrastructure/codex.repository.factory";
import { getKindRepository } from "../../../infrastructure/kind.repository.factory";
import { parseEdgesFacetSchema } from "../../schemas/facet-schema";
import {
  collectCandidateSlugs,
  deepenCanonWithTools,
  getWriterVoiceContext,
  resolveEntrySlugs,
  searchCodexEntries,
  searchCodexSemantic,
} from "../tools";
import { TAERIA_GLOBAL_PROMPT } from "../prompts";
import type { GenerationContext, PlannerOutput } from "../types";
import { resolveTaxonClassSlugFromText } from "../../wiki/taxon-class-synonyms";

const contextSchema = z.object({
  userIntent: z.string(),
  styleNotes: z.array(z.string()).default([]),
  systemRules: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  worldTone: z.string().optional(),
  refSlugs: z.array(z.string()).default([]),
  taxonomyParentSlug: z.string().nullable().default(null),
  classifiedAsParentSlug: z.string().nullable().default(null),
});

const SEMANTIC_RESULT_LIMIT = 8;
const SEMANTIC_EXCERPT_CHARS = 400;
const TAXONOMY_CANDIDATE_LIMIT = 50;

/** Kind agrupador de pais taxonomy além do próprio kind (ex.: escola ⊃ habilidade). */
const TAXONOMY_GROUPING_KINDS: Record<string, string> = {
  habilidade: "escola",
};

/** Espécies que classificam via classified_as → taxon. */
const SPECIES_SHEET_KINDS = new Set(["criatura", "planta"]);

function isEdgeTypeAllowed(kind: Kind, edgeType: string): boolean {
  const edgesFacet = kind.facets.find(
    (facet) => facet.facetType === "edges" && facet.enabled,
  );
  if (!edgesFacet) {
    return false;
  }
  return parseEdgesFacetSchema(edgesFacet.schema ?? null).includes(edgeType);
}

export function formatSemanticExcerpts(chunks: CodexSimilarChunk[]): string {
  return chunks
    .map((chunk) => {
      const excerpt = chunk.content
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, SEMANTIC_EXCERPT_CHARS);
      return `- ${chunk.title} (slug: ${chunk.slug}, kind: ${chunk.kindSlug}, similaridade ${chunk.similarity.toFixed(2)}): ${excerpt}`;
    })
    .join("\n");
}

export function isTaxonomyAllowedForKind(kind: Kind): boolean {
  return isEdgeTypeAllowed(kind, "taxonomy");
}

export function isClassifiedAsAllowedForKind(kind: Kind): boolean {
  return isEdgeTypeAllowed(kind, "classified_as");
}

async function loadParentCandidates(
  codexRepo: CodexRepository,
  kindSlugs: string[],
): Promise<CodexEntrySummary[]> {
  const results = await Promise.all(
    kindSlugs.map((kindSlug) =>
      codexRepo.list({ kindSlug, limit: TAXONOMY_CANDIDATE_LIMIT }),
    ),
  );

  return results.flatMap((result) => result.entries);
}

async function loadTaxonomyParentCandidates(
  codexRepo: CodexRepository,
  kind: Kind,
): Promise<CodexEntrySummary[]> {
  const kindSlugs = [kind.slug];
  const groupingKind = TAXONOMY_GROUPING_KINDS[kind.slug];
  if (groupingKind) {
    kindSlugs.push(groupingKind);
  }

  return loadParentCandidates(codexRepo, kindSlugs);
}

async function loadClassifiedAsParentCandidates(
  codexRepo: CodexRepository,
): Promise<CodexEntrySummary[]> {
  return loadParentCandidates(codexRepo, ["taxon"]);
}

async function loadSemanticChunks(
  codexRepo: CodexRepository,
  queryText: string,
): Promise<CodexSimilarChunk[]> {
  try {
    return await searchCodexSemantic(codexRepo, queryText, {
      limit: SEMANTIC_RESULT_LIMIT,
    });
  } catch {
    // Sem embeddings (ou RPC indisponível): cai na busca keyword abaixo.
    return [];
  }
}

function formatCanonSection(canonNotes: string[]): string {
  if (canonNotes.length === 0) {
    return "Cânone aprofundado: (nenhum dossiê carregado).";
  }

  return `Cânone aprofundado (fichas e relações via tools — use como verdade do mundo):
${canonNotes.join("\n\n")}`;
}

export async function runContextAgent(
  planner: PlannerOutput,
  draft: CodexDraft,
  kind: Kind,
  userMessage?: string,
): Promise<GenerationContext> {
  const kindRepo = await getKindRepository();
  const codexRepo = await getCodexRepository();

  const queryText = [userMessage?.trim(), planner.summary]
    .filter(Boolean)
    .join("\n");

  const semanticChunks = await loadSemanticChunks(codexRepo, queryText);

  let keywordSlugs: string[] = [];
  let relatedSection: string;
  if (semanticChunks.length > 0) {
    relatedSection = `Trechos do codex relevantes (busca semântica — use como cânone do mundo):
${formatSemanticExcerpts(semanticChunks)}`;
  } else {
    const related = await searchCodexEntries(
      codexRepo,
      planner.title ?? draft.title ?? planner.kindSlug ?? "",
      kind.slug,
    );
    keywordSlugs = related.map((entry: { slug: string }) => entry.slug);
    relatedSection = `Entradas relacionadas encontradas: ${keywordSlugs.join(", ") || "nenhuma"}`;
  }

  const candidateSlugs = collectCandidateSlugs({
    semanticSlugs: semanticChunks.map((chunk) => chunk.slug),
    keywordSlugs,
    slotValues: Object.values(planner.slots),
  });

  const canonNotes = await deepenCanonWithTools({
    codexRepo,
    kindRepo,
    relatedSection,
    candidateSlugs,
    plannerSummary: planner.summary,
    userMessage,
  });

  const classifiedAsAllowed = isClassifiedAsAllowedForKind(kind);
  const isSpeciesSheet = SPECIES_SHEET_KINDS.has(kind.slug);
  // Espécies usam classified_as → taxon; taxonomy same-kind é secundário.
  const taxonomyAllowed = isTaxonomyAllowedForKind(kind) && !isSpeciesSheet;

  const [taxonomyCandidates, classifiedAsCandidates] = await Promise.all([
    taxonomyAllowed
      ? loadTaxonomyParentCandidates(codexRepo, kind)
      : Promise.resolve([]),
    classifiedAsAllowed
      ? loadClassifiedAsParentCandidates(codexRepo)
      : Promise.resolve([]),
  ]);

  const taxonomySection =
    taxonomyAllowed && taxonomyCandidates.length > 0
      ? `Este kind aceita relação taxonomy (filho → pai). Candidatos a pai:
${taxonomyCandidates
  .map(
    (candidate) =>
      `- ${candidate.slug} — ${candidate.title} (${candidate.kindSlug})`,
  )
  .join("\n")}
Se a nova entrada claramente pertence a um desses pais, preencha taxonomyParentSlug com o slug exato; caso contrário, use null.`
      : "Deixe taxonomyParentSlug como null (este kind não usa taxonomy same-kind como classificação principal).";

  const classifiedAsSection =
    classifiedAsAllowed && classifiedAsCandidates.length > 0
      ? `Este kind é uma Espécie: classifique com classified_as → um taxon (Classe). Candidatos:
${classifiedAsCandidates
  .map(
    (candidate) =>
      `- ${candidate.slug} — ${candidate.title} (${candidate.kindSlug})`,
  )
  .join("\n")}
NÃO crie Selos/Reinos/termos; use o slug de Classe adequado. Preencha classifiedAsParentSlug; se não souber, null.
Sinônimos: mamífero→classe-mamiferos, ave→classe-aves, réptil→classe-repteis, peixe→classe-peixes, inseto→classe-artropodes, árvore→classe-arvores, erva→classe-ervas.`
      : "Deixe classifiedAsParentSlug como null.";

  const { object } = await generateObject({
    model: getGeminiModel("fast"),
    maxOutputTokens: getGeminiMaxOutputTokens("fast"),
    schema: contextSchema,
    system: `${TAERIA_GLOBAL_PROMPT}

Você coleta contexto para geração de entidades do codex Taeria.
Kind: ${kind.name} (${kind.slug})
${kind.aiPrompt ? `Instruções do kind: ${kind.aiPrompt}` : ""}
${relatedSection}

${formatCanonSection(canonNotes)}

${taxonomySection}

${classifiedAsSection}

Em userIntent, capture a intenção sem descartar detalhes importantes do texto do usuário.
Em refSlugs, priorize slugs do cânone aprofundado e dos trechos RAG quando forem relevantes.`,
    prompt: `Intenção resumida: ${planner.summary}
Mensagem completa do usuário:
${userMessage?.trim() || "(não informada)"}
Slots: ${JSON.stringify(planner.slots)}
Draft: ${JSON.stringify(draft)}`,
  });

  const { resolved, missing } = await resolveEntrySlugs(
    codexRepo,
    object.refSlugs,
    kindRepo,
  );

  if (missing.length > 0) {
    object.constraints.push(
      `Referências não encontradas: ${missing.join(", ")}`,
    );
  }

  const voiceNotes = await getWriterVoiceContext(
    codexRepo,
    kindRepo,
    object.refSlugs,
  );

  const taxonomyParentSlug =
    object.taxonomyParentSlug &&
    taxonomyCandidates.some(
      (candidate) => candidate.slug === object.taxonomyParentSlug,
    )
      ? object.taxonomyParentSlug
      : null;

  let classifiedAsParentSlug =
    object.classifiedAsParentSlug &&
    classifiedAsCandidates.some(
      (candidate) => candidate.slug === object.classifiedAsParentSlug,
    )
      ? object.classifiedAsParentSlug
      : null;

  if (!classifiedAsParentSlug && classifiedAsAllowed) {
    const inferred = resolveTaxonClassSlugFromText(
      [userMessage, planner.summary, object.userIntent]
        .filter(Boolean)
        .join(" "),
    );
    if (
      inferred &&
      classifiedAsCandidates.some((candidate) => candidate.slug === inferred)
    ) {
      classifiedAsParentSlug = inferred;
    }
  }

  return {
    kind,
    userIntent: object.userIntent,
    userMessage: userMessage?.trim() || undefined,
    resolvedRefs: resolved,
    styleNotes: [...object.styleNotes, ...voiceNotes],
    systemRules: object.systemRules,
    constraints: object.constraints,
    worldTone: object.worldTone,
    taxonomyParentSlug,
    classifiedAsParentSlug,
    canonNotes,
  };
}

export function buildFallbackContext(
  planner: PlannerOutput,
  kind: Kind,
  userMessage?: string,
): GenerationContext {
  return {
    kind,
    userIntent: planner.summary,
    userMessage: userMessage?.trim() || undefined,
    resolvedRefs: [],
    styleNotes: kind.aiPrompt ? [kind.aiPrompt] : [],
    systemRules: [],
    constraints: [],
    taxonomyParentSlug: null,
    classifiedAsParentSlug: null,
    canonNotes: [],
  };
}
