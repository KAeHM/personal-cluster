/**
 * Chunking puro do conteúdo de uma entrada do codex para embeddings.
 * Sem IO — reutilizado pelo embed pós-save e pelo script de backfill.
 */

export const ENTRY_CHUNK_MAX_CHARS = 1200;

export interface EntryChunkFacet {
  facetType: string;
  data: Record<string, unknown>;
}

export interface EntryChunkInput {
  title: string;
  facets: EntryChunkFacet[];
}

function findFacetData(
  facets: EntryChunkFacet[],
  facetType: string,
): Record<string, unknown> | undefined {
  return facets.find((facet) => facet.facetType === facetType)?.data;
}

function splitTextIntoBlocks(text: string, maxChars: number): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const blocks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim()) {
      blocks.push(current.trim());
    }
    current = "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      flush();
      for (let start = 0; start < paragraph.length; start += maxChars) {
        blocks.push(paragraph.slice(start, start + maxChars).trim());
      }
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > maxChars) {
      flush();
      current = paragraph;
    } else {
      current = candidate;
    }
  }

  flush();
  return blocks;
}

function serializeFlatFacet(data: Record<string, unknown>): string {
  return Object.entries(data)
    .filter(([, value]) => {
      if (value === null || value === undefined) {
        return false;
      }
      return typeof value !== "object";
    })
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n");
}

/**
 * Título + lore_md em blocos de ~1200 chars + system/lexicon serializados.
 * Cada chunk é prefixado com o título para reter contexto no retrieval.
 */
export function buildEntryChunks(input: EntryChunkInput): string[] {
  const title = input.title.trim();
  const chunks: string[] = [];

  const lore = findFacetData(input.facets, "lore");
  const loreMd = typeof lore?.lore_md === "string" ? lore.lore_md.trim() : "";
  if (loreMd) {
    for (const block of splitTextIntoBlocks(loreMd, ENTRY_CHUNK_MAX_CHARS)) {
      chunks.push(`# ${title}\n\n${block}`);
    }
  }

  const system = findFacetData(input.facets, "system");
  if (system) {
    const serialized = serializeFlatFacet(system);
    if (serialized) {
      chunks.push(`# ${title} — sistema\n\n${serialized}`);
    }
  }

  const lexicon = findFacetData(input.facets, "lexicon");
  if (lexicon) {
    const serialized = serializeFlatFacet(lexicon);
    if (serialized) {
      chunks.push(`# ${title} — léxico\n\n${serialized}`);
    }
  }

  if (chunks.length === 0 && title) {
    chunks.push(title);
  }

  return chunks;
}
