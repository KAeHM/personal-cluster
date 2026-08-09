/**
 * Montagem de "dossiês" de entradas do codex para enriquecer o context agent.
 * Funções puras + loaders — sem chamada LLM.
 */

import type { CodexEntry } from "../../../domain/codex-entry";
import type { CodexRepository } from "../../../domain/codex.repository";
import type { KindRepository } from "../../../domain/kind.repository";

export const DOSSIER_LORE_CHARS = 800;
export const MAX_CANON_CANDIDATES = 8;
export const MAX_DETERMINISTIC_ENRICH = 3;

export type EntryEdgeSummary = {
  edgeType: string;
  toSlug: string;
  toTitle: string;
  payload: Record<string, unknown> | null;
};

export type EntryDossier = {
  slug: string;
  title: string;
  kindSlug: string;
  loreExcerpt: string | null;
  systemSummary: string | null;
  lexiconSummary: string | null;
  edges: EntryEdgeSummary[];
};

function serializeFlatFacet(data: Record<string, unknown>): string {
  return Object.entries(data)
    .filter(([, value]) => {
      if (value === null || value === undefined) {
        return false;
      }
      return typeof value !== "object";
    })
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("; ");
}

export async function loadEntryEdges(
  repo: CodexRepository,
  entry: CodexEntry,
): Promise<EntryEdgeSummary[]> {
  const edges: EntryEdgeSummary[] = [];

  for (const edge of entry.edges) {
    const target = await repo.findById(edge.toEntryId);
    edges.push({
      edgeType: edge.edgeType,
      toSlug: target?.slug ?? "(desconhecido)",
      toTitle: target?.title ?? "(desconhecido)",
      payload: edge.payload,
    });
  }

  return edges;
}

export async function buildEntryDossier(
  codexRepo: CodexRepository,
  kindRepo: KindRepository,
  slug: string,
): Promise<EntryDossier | null> {
  const entry = await codexRepo.findBySlug(slug.trim());
  if (!entry) {
    return null;
  }

  const kind = await kindRepo.findById(entry.kindId);
  const lore = entry.facets.find((facet) => facet.facetType === "lore");
  const system = entry.facets.find((facet) => facet.facetType === "system");
  const lexicon = entry.facets.find((facet) => facet.facetType === "lexicon");

  const loreMd =
    typeof lore?.data.lore_md === "string" ? lore.data.lore_md.trim() : "";
  const systemSummary = system ? serializeFlatFacet(system.data) : "";
  const lexiconSummary = lexicon ? serializeFlatFacet(lexicon.data) : "";
  const edges = await loadEntryEdges(codexRepo, entry);

  return {
    slug: entry.slug,
    title: entry.title,
    kindSlug: kind?.slug ?? "",
    loreExcerpt: loreMd
      ? loreMd.slice(0, DOSSIER_LORE_CHARS).replace(/\s+/g, " ").trim()
      : null,
    systemSummary: systemSummary || null,
    lexiconSummary: lexiconSummary || null,
    edges,
  };
}

export function formatEntryDossier(dossier: EntryDossier): string {
  const lines = [
    `## ${dossier.title} (slug: ${dossier.slug}, kind: ${dossier.kindSlug || "?"})`,
  ];

  if (dossier.loreExcerpt) {
    lines.push(`Lore: ${dossier.loreExcerpt}`);
  }
  if (dossier.systemSummary) {
    lines.push(`Sistema: ${dossier.systemSummary}`);
  }
  if (dossier.lexiconSummary) {
    lines.push(`Léxico: ${dossier.lexiconSummary}`);
  }
  if (dossier.edges.length > 0) {
    lines.push("Relações:");
    for (const edge of dossier.edges) {
      const payload =
        edge.payload && Object.keys(edge.payload).length > 0
          ? ` ${JSON.stringify(edge.payload)}`
          : "";
      lines.push(
        `- ${edge.edgeType} → ${edge.toTitle} (${edge.toSlug})${payload}`,
      );
    }
  } else {
    lines.push("Relações: nenhuma.");
  }

  return lines.join("\n");
}

export function formatEdgesOnly(
  slug: string,
  title: string,
  edges: EntryEdgeSummary[],
): string {
  if (edges.length === 0) {
    return `Relações de ${title} (${slug}): nenhuma.`;
  }

  const lines = [`Relações de ${title} (${slug}):`];
  for (const edge of edges) {
    lines.push(`- ${edge.edgeType} → ${edge.toTitle} (${edge.toSlug})`);
  }
  return lines.join("\n");
}

/** Junta slugs únicos a partir de RAG, keyword e slots do planner. */
export function collectCandidateSlugs(input: {
  semanticSlugs?: string[];
  keywordSlugs?: string[];
  slotValues?: string[];
  limit?: number;
}): string[] {
  const limit = input.limit ?? MAX_CANON_CANDIDATES;
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const slug of [
    ...(input.semanticSlugs ?? []),
    ...(input.keywordSlugs ?? []),
    ...(input.slotValues ?? []),
  ]) {
    const normalized = slug.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    ordered.push(normalized);
    if (ordered.length >= limit) {
      break;
    }
  }

  return ordered;
}

/** Fallback sem LLM: dossiês das top N candidatas. */
export async function enrichCandidatesDeterministically(
  codexRepo: CodexRepository,
  kindRepo: KindRepository,
  slugs: string[],
  limit = MAX_DETERMINISTIC_ENRICH,
): Promise<string[]> {
  const notes: string[] = [];

  for (const slug of slugs.slice(0, limit)) {
    const dossier = await buildEntryDossier(codexRepo, kindRepo, slug);
    if (dossier) {
      notes.push(formatEntryDossier(dossier));
    }
  }

  return notes;
}
