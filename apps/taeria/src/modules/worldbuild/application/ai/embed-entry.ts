import { embedMany } from "ai";

import { logError } from "@/common/errors";
import type { CodexEntry } from "../../domain/codex-entry";
import type { Kind } from "../../domain/kind";
import {
  GEMINI_EMBEDDING_DIMENSIONS,
  getGeminiEmbeddingModel,
  isGeminiConfigured,
} from "../../infrastructure/ai/gemini.client";
import { getCodexRepository } from "../../infrastructure/codex.repository.factory";
import { buildEntryChunks } from "./entry-chunks";

export function isEmbeddingEnabled(kind: Kind): boolean {
  return kind.facets.some(
    (facet) => facet.facetType === "embeddings" && facet.enabled,
  );
}

/** Gera e persiste os embeddings da entrada (facet `embeddings` do kind ligada). */
export async function embedCodexEntry(
  entry: CodexEntry,
  kind: Kind,
): Promise<void> {
  if (!isEmbeddingEnabled(kind) || !isGeminiConfigured()) {
    return;
  }

  const contents = buildEntryChunks({
    title: entry.title,
    facets: entry.facets,
  });

  if (contents.length === 0) {
    return;
  }

  const { embeddings } = await embedMany({
    model: getGeminiEmbeddingModel(),
    values: contents,
    providerOptions: {
      google: {
        outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS,
        taskType: "RETRIEVAL_DOCUMENT",
      },
    },
  });

  const codexRepo = await getCodexRepository();
  await codexRepo.replaceEmbeddings(
    entry.id,
    contents.map((content, index) => ({
      chunkIndex: index,
      content,
      embedding: embeddings[index]!,
    })),
  );
}

/** Variante não-fatal para hooks pós-save: falha só loga, entrada permanece salva. */
export async function embedCodexEntrySafe(
  entry: CodexEntry,
  kind: Kind,
): Promise<void> {
  try {
    await embedCodexEntry(entry, kind);
  } catch (error) {
    logError(error, { entryId: entry.id, context: "embed_codex_entry" });
  }
}
