import type {
  CodexEmbeddingChunk,
  CodexEntry,
  CodexEntrySummary,
  CodexFacetData,
  CodexSimilarChunk,
  ListCodexEntriesParams,
  ListCodexEntriesResult,
  NewCodexEntry,
  UpdateCodexEntry,
} from "../../../domain/codex-entry";
import type { StoredFacetType } from "../../../domain/facet-type";
import type {
  CodexRepository,
  CodexSimilarSearchOptions,
} from "../../../domain/codex.repository";
import { createSupabaseAdminClient } from "@/common/adapters/supabase/admin";

type EntryRow = {
  id: string;
  kind_id: string;
  slug: string;
  title: string;
  visibility: "private" | "public";
  created_at: string;
  updated_at: string;
};

type FacetRow = {
  id: string;
  entry_id: string;
  facet_type: StoredFacetType;
  data: Record<string, unknown>;
};

type EdgeRow = {
  id: string;
  from_entry_id: string;
  to_entry_id: string;
  edge_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type EntryWithRelations = EntryRow & {
  codex_facet: FacetRow[];
  codex_edge: EdgeRow[];
};

type MatchCodexEntriesRow = {
  entry_id: string;
  slug: string;
  title: string;
  kind_slug: string;
  chunk_index: number;
  content: string;
  similarity: number;
};

function toFacetDomain(row: FacetRow): CodexFacetData {
  return {
    id: row.id,
    entryId: row.entry_id,
    facetType: row.facet_type,
    data: row.data ?? {},
  };
}

function toEdgeDomain(row: EdgeRow) {
  return {
    id: row.id,
    fromEntryId: row.from_entry_id,
    toEntryId: row.to_entry_id,
    edgeType: row.edge_type,
    payload: row.payload,
    createdAt: new Date(row.created_at),
  };
}

function toSummary(row: {
  id: string;
  kind_id: string;
  slug: string;
  title: string;
  visibility: "private" | "public";
  updated_at: string;
  kind: { slug: string } | { slug: string }[] | null;
  share_count?: number | { count: number }[] | null;
}): CodexEntrySummary {
  const kind = row.kind;
  const kindSlug = Array.isArray(kind) ? kind[0]?.slug : kind?.slug;
  let shareCount = 0;
  if (typeof row.share_count === "number") {
    shareCount = row.share_count;
  } else if (Array.isArray(row.share_count) && row.share_count[0]) {
    shareCount = row.share_count[0].count ?? 0;
  }
  return {
    id: row.id,
    kindId: row.kind_id,
    kindSlug: kindSlug ?? "",
    slug: row.slug,
    title: row.title,
    visibility: row.visibility,
    shareCount,
    updatedAt: new Date(row.updated_at),
  };
}

const SUMMARY_SELECT =
  "id, kind_id, slug, title, visibility, updated_at, kind:kind_id (slug), share_count:codex_entry_share(count)";

function toDomain(
  row: EntryWithRelations,
  sharedUserIds?: string[],
): CodexEntry {
  return {
    id: row.id,
    kindId: row.kind_id,
    slug: row.slug,
    title: row.title,
    visibility: row.visibility,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    facets: (row.codex_facet ?? []).map(toFacetDomain),
    edges: (row.codex_edge ?? []).map(toEdgeDomain),
    ...(sharedUserIds ? { sharedUserIds } : {}),
  };
}

// codex_edge tem duas FKs para codex_entry; o embed precisa do hint explícito.
const ENTRY_SELECT = `
  *,
  codex_facet (*),
  codex_edge!codex_edge_from_entry_id_fkey (*)
`;

async function loadSharedUserIds(entryId: string): Promise<string[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("codex_entry_share")
    .select("user_id")
    .eq("entry_id", entryId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.user_id as string);
}

async function syncShares(entryId: string, userIds: string[]): Promise<void> {
  const admin = createSupabaseAdminClient();
  const uniqueIds = [...new Set(userIds)];

  const { error: deleteError } = await admin
    .from("codex_entry_share")
    .delete()
    .eq("entry_id", entryId);

  if (deleteError) {
    throw deleteError;
  }

  if (uniqueIds.length === 0) {
    return;
  }

  const { error: insertError } = await admin.from("codex_entry_share").insert(
    uniqueIds.map((userId) => ({
      entry_id: entryId,
      user_id: userId,
    })),
  );

  if (insertError) {
    throw insertError;
  }
}

export function createSupabaseCodexRepository(): CodexRepository {
  const admin = createSupabaseAdminClient();

  return {
    async findById(id: string): Promise<CodexEntry | null> {
      const { data, error } = await admin
        .from("codex_entry")
        .select(ENTRY_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data
        ? toDomain(data as EntryWithRelations, await loadSharedUserIds(id))
        : null;
    },

    async findBySlug(slug: string): Promise<CodexEntry | null> {
      const { data, error } = await admin
        .from("codex_entry")
        .select(ENTRY_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const entry = data as EntryWithRelations;
      return toDomain(entry, await loadSharedUserIds(entry.id));
    },

    async search({
      query,
      kindSlug,
      limit = 20,
    }: {
      query: string;
      kindSlug?: string;
      limit?: number;
    }): Promise<CodexEntrySummary[]> {
      const trimmed = query.trim();
      if (!trimmed) {
        return [];
      }

      let builder = admin
        .from("codex_entry")
        .select(SUMMARY_SELECT)
        .or(`title.ilike.%${trimmed}%,slug.ilike.%${trimmed}%`)
        .order("title", { ascending: true })
        .limit(limit);

      if (kindSlug) {
        const { data: kindRow, error: kindError } = await admin
          .from("kind")
          .select("id")
          .eq("slug", kindSlug)
          .maybeSingle();

        if (kindError) {
          throw kindError;
        }
        if (!kindRow) {
          return [];
        }
        builder = builder.eq("kind_id", kindRow.id);
      }

      const { data, error } = await builder;
      if (error) {
        throw error;
      }

      return (data ?? []).map((row) =>
        toSummary(row as Parameters<typeof toSummary>[0]),
      );
    },

    async list({
      limit = 20,
      offset = 0,
      kindSlug,
      visibility,
      query,
    }: ListCodexEntriesParams): Promise<ListCodexEntriesResult> {
      let builder = admin
        .from("codex_entry")
        .select(SUMMARY_SELECT, { count: "exact" })
        .order("updated_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (kindSlug) {
        const { data: kindRow, error: kindError } = await admin
          .from("kind")
          .select("id")
          .eq("slug", kindSlug)
          .maybeSingle();

        if (kindError) {
          throw kindError;
        }
        if (!kindRow) {
          return { entries: [], total: 0 };
        }
        builder = builder.eq("kind_id", kindRow.id);
      }

      if (visibility) {
        builder = builder.eq("visibility", visibility);
      }

      const trimmed = query?.trim();
      if (trimmed) {
        builder = builder.or(
          `title.ilike.%${trimmed}%,slug.ilike.%${trimmed}%`,
        );
      }

      const { data, error, count } = await builder;
      if (error) {
        throw error;
      }

      return {
        entries: (data ?? []).map((row) =>
          toSummary(row as Parameters<typeof toSummary>[0]),
        ),
        total: count ?? 0,
      };
    },

    async slugExists(slug: string, excludeId?: string): Promise<boolean> {
      let builder = admin.from("codex_entry").select("id").eq("slug", slug);

      if (excludeId) {
        builder = builder.neq("id", excludeId);
      }

      const { data, error } = await builder.maybeSingle();

      if (error) {
        throw error;
      }

      return Boolean(data);
    },

    async create(data: NewCodexEntry): Promise<CodexEntry> {
      const { data: entryRow, error: entryError } = await admin
        .from("codex_entry")
        .insert({
          kind_id: data.kindId,
          slug: data.slug,
          title: data.title,
          visibility: data.visibility ?? "private",
        })
        .select("*")
        .single();

      if (entryError) {
        throw entryError;
      }

      let facetRows: FacetRow[] = [];

      if (data.facets.length > 0) {
        const { data: insertedFacets, error: facetError } = await admin
          .from("codex_facet")
          .insert(
            data.facets.map((facet) => ({
              entry_id: entryRow.id,
              facet_type: facet.facetType,
              data: facet.data,
            })),
          )
          .select("*");

        if (facetError) {
          await admin.from("codex_entry").delete().eq("id", entryRow.id);
          throw facetError;
        }

        facetRows = (insertedFacets ?? []) as FacetRow[];
      }

      let edgeRows: EdgeRow[] = [];

      if (data.edges.length > 0) {
        const { data: insertedEdges, error: edgeError } = await admin
          .from("codex_edge")
          .insert(
            data.edges.map((edge) => ({
              from_entry_id: entryRow.id,
              to_entry_id: edge.toEntryId,
              edge_type: edge.edgeType,
              payload: edge.payload ?? null,
            })),
          )
          .select("*");

        if (edgeError) {
          await admin.from("codex_entry").delete().eq("id", entryRow.id);
          throw edgeError;
        }

        edgeRows = (insertedEdges ?? []) as EdgeRow[];
      }

      if (data.sharedUserIds !== undefined) {
        await syncShares(entryRow.id, data.sharedUserIds);
      }

      return toDomain(
        {
          ...(entryRow as EntryRow),
          codex_facet: facetRows,
          codex_edge: edgeRows,
        },
        data.sharedUserIds,
      );
    },

    async update(
      id: string,
      data: UpdateCodexEntry,
    ): Promise<CodexEntry | null> {
      const { data: existing, error: existingError } = await admin
        .from("codex_entry")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }
      if (!existing) {
        return null;
      }

      const { error: entryError } = await admin
        .from("codex_entry")
        .update({
          title: data.title,
          slug: data.slug,
          ...(data.visibility !== undefined
            ? { visibility: data.visibility }
            : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (entryError) {
        throw entryError;
      }

      if (data.sharedUserIds !== undefined) {
        await syncShares(id, data.sharedUserIds);
      }

      if (data.facets.length > 0) {
        const { error: facetError } = await admin.from("codex_facet").upsert(
          data.facets.map((facet) => ({
            entry_id: id,
            facet_type: facet.facetType,
            data: facet.data,
          })),
          { onConflict: "entry_id,facet_type" },
        );

        if (facetError) {
          throw facetError;
        }
      }

      const { error: deleteEdgesError } = await admin
        .from("codex_edge")
        .delete()
        .eq("from_entry_id", id);

      if (deleteEdgesError) {
        throw deleteEdgesError;
      }

      if (data.edges.length > 0) {
        const { error: edgeError } = await admin.from("codex_edge").insert(
          data.edges.map((edge) => ({
            from_entry_id: id,
            to_entry_id: edge.toEntryId,
            edge_type: edge.edgeType,
            payload: edge.payload ?? null,
          })),
        );

        if (edgeError) {
          throw edgeError;
        }
      }

      return this.findById(id);
    },

    async delete(id: string): Promise<boolean> {
      const { data, error } = await admin
        .from("codex_entry")
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) {
        throw error;
      }

      return Boolean(data);
    },

    async replaceEmbeddings(
      entryId: string,
      chunks: CodexEmbeddingChunk[],
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
          // pgvector aceita o literal JSON "[1,2,...]" para colunas vector.
          embedding: JSON.stringify(chunk.embedding),
        })),
      );

      if (insertError) {
        throw insertError;
      }
    },

    async searchSimilar(
      embedding: number[],
      options?: CodexSimilarSearchOptions,
    ): Promise<CodexSimilarChunk[]> {
      const { data, error } = await admin.rpc("match_codex_entries", {
        query_embedding: JSON.stringify(embedding),
        match_count: options?.limit ?? 8,
        filter_kind_slug: options?.kindSlug ?? null,
      });

      if (error) {
        throw error;
      }

      return ((data ?? []) as MatchCodexEntriesRow[]).map((row) => ({
        entryId: row.entry_id,
        slug: row.slug,
        title: row.title,
        kindSlug: row.kind_slug,
        chunkIndex: row.chunk_index,
        content: row.content,
        similarity: row.similarity,
      }));
    },
  };
}
