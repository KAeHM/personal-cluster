import { embed } from "ai";

import type { Kind } from "../../../domain/kind";
import type {
  CodexEntry,
  CodexSimilarChunk,
} from "../../../domain/codex-entry";
import type {
  CodexRepository,
  CodexSimilarSearchOptions,
} from "../../../domain/codex.repository";
import type { KindRepository } from "../../../domain/kind.repository";
import type { ContentFacetType } from "../../../domain/facet-type";
import {
  GEMINI_EMBEDDING_DIMENSIONS,
  getGeminiEmbeddingModel,
} from "../../../infrastructure/ai/gemini.client";
import { validateFacetData } from "../../schemas/compile-facet-zod";

export async function listKinds(repo: KindRepository): Promise<Kind[]> {
  return repo.list();
}

export async function getKindBySlug(
  repo: KindRepository,
  slug: string,
): Promise<Kind | null> {
  return repo.findBySlug(slug);
}

export async function searchCodexEntries(
  repo: CodexRepository,
  query: string,
  kindSlug?: string,
) {
  return repo.search({ query, kindSlug, limit: 20 });
}

/** Busca semântica no codex: embeda a query e consulta match_codex_entries. */
export async function searchCodexSemantic(
  repo: CodexRepository,
  text: string,
  options?: CodexSimilarSearchOptions,
): Promise<CodexSimilarChunk[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const { embedding } = await embed({
    model: getGeminiEmbeddingModel(),
    value: trimmed,
    providerOptions: {
      google: {
        outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS,
        taskType: "RETRIEVAL_QUERY",
      },
    },
  });

  return repo.searchSimilar(embedding, options);
}

export async function getCodexEntryBySlug(
  repo: CodexRepository,
  slug: string,
): Promise<CodexEntry | null> {
  return repo.findBySlug(slug);
}

export async function resolveEntrySlugs(
  repo: CodexRepository,
  slugs: string[],
  kindRepo?: KindRepository,
): Promise<{
  resolved: Array<{ slug: string; title: string; kindSlug: string }>;
  missing: string[];
}> {
  const resolved: Array<{ slug: string; title: string; kindSlug: string }> = [];
  const missing: string[] = [];

  for (const slug of slugs) {
    const entry = await repo.findBySlug(slug);
    if (!entry) {
      missing.push(slug);
      continue;
    }

    let kindSlug = "";
    if (kindRepo) {
      const kind = await kindRepo.findById(entry.kindId);
      kindSlug = kind?.slug ?? "";
    }

    resolved.push({
      slug: entry.slug,
      title: entry.title,
      kindSlug,
    });
  }

  return { resolved, missing };
}

export async function getWriterVoiceContext(
  codexRepo: CodexRepository,
  kindRepo: KindRepository,
  slugs: string[],
): Promise<string[]> {
  const notes: string[] = [];

  for (const slug of slugs) {
    const entry = await codexRepo.findBySlug(slug);
    if (!entry) {
      continue;
    }

    const kind = await kindRepo.findById(entry.kindId);
    const lore = entry.facets.find((facet) => facet.facetType === "lore");
    const lexicon = entry.facets.find((facet) => facet.facetType === "lexicon");

    if (lore?.data.lore_md && typeof lore.data.lore_md === "string") {
      notes.push(
        `Voz de ${entry.title} (${kind?.slug ?? "kind"}): ${lore.data.lore_md.slice(0, 500)}`,
      );
    }
    if (lexicon?.data.term && typeof lexicon.data.term === "string") {
      notes.push(`Léxico de ${entry.title}: ${String(lexicon.data.term)}`);
    }
  }

  return notes;
}

export function validateDraftFacet(
  kind: Kind,
  facetType: ContentFacetType,
  data: Record<string, unknown>,
) {
  return validateFacetData(kind, facetType, data);
}

export {
  buildEntryDossier,
  collectCandidateSlugs,
  enrichCandidatesDeterministically,
  formatEdgesOnly,
  formatEntryDossier,
  loadEntryEdges,
} from "./entry-dossier";
export {
  CONTEXT_DEEPEN_MAX_STEPS,
  createContextEnrichmentTools,
  deepenCanonWithTools,
} from "./deepen-canon";
