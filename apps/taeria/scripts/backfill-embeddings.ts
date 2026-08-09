/**
 * Backfill de embeddings do codex existente (make embed-backfill).
 * Indexa entradas de kinds com a facet `embeddings` habilitada usando o mesmo
 * chunking do embed pós-save (application/ai/entry-chunks).
 */

import { existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embedMany } from "ai";
import { buildEntryChunks } from "../src/modules/worldbuild/application/ai/entry-chunks";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const EMBEDDING_DIMENSIONS = 1536;

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getEmbeddingModel() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Defina GOOGLE_GENERATIVE_AI_API_KEY no .env.local");
  }

  const provider = createGoogleGenerativeAI({ apiKey });
  return provider.textEmbedding(
    process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001",
  );
}

type EntryRow = {
  id: string;
  slug: string;
  title: string;
  codex_facet: Array<{ facet_type: string; data: Record<string, unknown> }>;
};

async function listEmbeddingKindIds(admin: SupabaseClient): Promise<string[]> {
  const { data, error } = await admin
    .from("kind_facet_config")
    .select("kind_id")
    .eq("facet_type", "embeddings")
    .eq("enabled", true);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.kind_id as string);
}

async function listEntries(
  admin: SupabaseClient,
  kindIds: string[],
): Promise<EntryRow[]> {
  const { data, error } = await admin
    .from("codex_entry")
    .select("id, slug, title, codex_facet (facet_type, data)")
    .in("kind_id", kindIds)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as EntryRow[];
}

async function replaceEmbeddings(
  admin: SupabaseClient,
  entryId: string,
  chunks: Array<{ chunkIndex: number; content: string; embedding: number[] }>,
): Promise<void> {
  const { error: deleteError } = await admin
    .from("codex_embedding")
    .delete()
    .eq("entry_id", entryId);

  if (deleteError) {
    throw deleteError;
  }

  if (chunks.length === 0) {
    return;
  }

  const { error: insertError } = await admin.from("codex_embedding").insert(
    chunks.map((chunk) => ({
      entry_id: entryId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      embedding: JSON.stringify(chunk.embedding),
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

async function main(): Promise<void> {
  const admin = getAdminClient();
  const model = getEmbeddingModel();

  const kindIds = await listEmbeddingKindIds(admin);
  if (kindIds.length === 0) {
    console.log(
      "Nenhum kind com facet embeddings habilitada. Rode make db-seed antes.",
    );
    process.exit(0);
  }

  const entries = await listEntries(admin, kindIds);
  console.log(`Backfill de embeddings: ${entries.length} entradas.`);

  let indexed = 0;
  let skipped = 0;

  for (const entry of entries) {
    const contents = buildEntryChunks({
      title: entry.title,
      facets: (entry.codex_facet ?? []).map((facet) => ({
        facetType: facet.facet_type,
        data: facet.data ?? {},
      })),
    });

    if (contents.length === 0) {
      skipped += 1;
      console.log(`skip  ${entry.slug} (sem conteúdo)`);
      continue;
    }

    const { embeddings } = await embedMany({
      model,
      values: contents,
      providerOptions: {
        google: {
          outputDimensionality: EMBEDDING_DIMENSIONS,
          taskType: "RETRIEVAL_DOCUMENT",
        },
      },
    });

    await replaceEmbeddings(
      admin,
      entry.id,
      contents.map((content, index) => ({
        chunkIndex: index,
        content,
        embedding: embeddings[index]!,
      })),
    );

    indexed += 1;
    console.log(`embed ${entry.slug} (${contents.length} chunks)`);
  }

  console.log(`Backfill concluído: ${indexed} indexadas, ${skipped} puladas.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Falha no backfill de embeddings:", error);
  process.exit(1);
});
