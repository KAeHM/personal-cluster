import type {
  CodexEntry,
  CodexEntrySummary,
} from "../../../domain/codex-entry";
import type { StoredFacetType } from "../../../domain/facet-type";
import type {
  WikiCodexRepository,
  WikiKindSummary,
  WikiTaxonomyEdge,
  WikiTaxonomyEdgeTarget,
} from "../../../domain/wiki-codex.repository";
import { createSupabaseServerClient } from "@/common/adapters/supabase/server";

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

const ENTRY_SELECT = `
  *,
  codex_facet (*),
  codex_edge!codex_edge_from_entry_id_fkey (*)
`;

const SUMMARY_SELECT =
  "id, kind_id, slug, title, visibility, updated_at, kind:kind_id (slug)";

function toDomain(row: EntryWithRelations): CodexEntry {
  return {
    id: row.id,
    kindId: row.kind_id,
    slug: row.slug,
    title: row.title,
    visibility: row.visibility,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    facets: (row.codex_facet ?? []).map((facet) => ({
      id: facet.id,
      entryId: facet.entry_id,
      facetType: facet.facet_type,
      data: facet.data ?? {},
    })),
    edges: (row.codex_edge ?? []).map((edge) => ({
      id: edge.id,
      fromEntryId: edge.from_entry_id,
      toEntryId: edge.to_entry_id,
      edgeType: edge.edge_type,
      payload: edge.payload,
      createdAt: new Date(edge.created_at),
    })),
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
}): CodexEntrySummary {
  const kind = row.kind;
  const kindSlug = Array.isArray(kind) ? kind[0]?.slug : kind?.slug;
  return {
    id: row.id,
    kindId: row.kind_id,
    kindSlug: kindSlug ?? "",
    slug: row.slug,
    title: row.title,
    visibility: row.visibility,
    shareCount: 0,
    updatedAt: new Date(row.updated_at),
  };
}

type TaxonomyEdgeRow = {
  id: string;
  payload: Record<string, unknown> | null;
  from_entry:
    | {
        id: string;
        slug: string;
        title: string;
        kind: { slug: string } | { slug: string }[] | null;
      }
    | {
        id: string;
        slug: string;
        title: string;
        kind: { slug: string } | { slug: string }[] | null;
      }[]
    | null;
  to_entry:
    | {
        id: string;
        slug: string;
        title: string;
        kind: { slug: string } | { slug: string }[] | null;
      }
    | {
        id: string;
        slug: string;
        title: string;
        kind: { slug: string } | { slug: string }[] | null;
      }[]
    | null;
};

function relationKindSlug(
  kind: { slug: string } | { slug: string }[] | null | undefined,
): string {
  if (!kind) {
    return "";
  }
  return Array.isArray(kind) ? (kind[0]?.slug ?? "") : kind.slug;
}

function toTaxonomyEdge(row: TaxonomyEdgeRow): WikiTaxonomyEdge | null {
  const child = Array.isArray(row.from_entry)
    ? row.from_entry[0]
    : row.from_entry;
  const parent = Array.isArray(row.to_entry) ? row.to_entry[0] : row.to_entry;

  if (!child?.id || !parent?.id) {
    return null;
  }

  return {
    id: row.id,
    childEntryId: child.id,
    childSlug: child.slug,
    childTitle: child.title,
    childKindSlug: relationKindSlug(child.kind),
    parent: {
      id: parent.id,
      slug: parent.slug,
      title: parent.title,
      kindSlug: relationKindSlug(parent.kind),
    },
    payload: row.payload,
  };
}

async function listRelationEdgesForKind(
  kindSlug: string,
  edgeType: string,
): Promise<WikiTaxonomyEdge[]> {
  const supabase = await createSupabaseServerClient();
  const { data: kindRow, error: kindError } = await supabase
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

  const { data, error } = await supabase
    .from("codex_edge")
    .select(
      `
          id,
          payload,
          from_entry:from_entry_id!inner (
            id,
            slug,
            title,
            kind_id,
            kind:kind_id (slug)
          ),
          to_entry:to_entry_id (
            id,
            slug,
            title,
            kind:kind_id (slug)
          )
        `,
    )
    .eq("edge_type", edgeType)
    .eq("from_entry.kind_id", kindRow.id);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => toTaxonomyEdge(row as TaxonomyEdgeRow))
    .filter((edge): edge is WikiTaxonomyEdge => edge !== null);
}

export function createSupabaseWikiCodexRepository(): WikiCodexRepository {
  return {
    async findBySlug(slug: string): Promise<CodexEntry | null> {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("codex_entry")
        .select(ENTRY_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ? toDomain(data as EntryWithRelations) : null;
    },

    async findByIds(ids: string[]): Promise<CodexEntry[]> {
      if (ids.length === 0) {
        return [];
      }

      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("codex_entry")
        .select(ENTRY_SELECT)
        .in("id", ids);

      if (error) {
        throw error;
      }

      return (data ?? []).map((row) => toDomain(row as EntryWithRelations));
    },

    async list({ limit = 24, offset = 0, kindSlug, query }) {
      const supabase = await createSupabaseServerClient();
      let builder = supabase
        .from("codex_entry")
        .select(SUMMARY_SELECT, { count: "exact" })
        .order("title", { ascending: true })
        .range(offset, offset + limit - 1);

      if (kindSlug) {
        const { data: kindRow, error: kindError } = await supabase
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

    async listVisibleKindSlugs(): Promise<string[]> {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("codex_entry")
        .select("kind:kind_id (slug)");

      if (error) {
        throw error;
      }

      const slugs = new Set<string>();
      for (const row of data ?? []) {
        const kind = row.kind as { slug: string } | { slug: string }[] | null;
        const slug = Array.isArray(kind) ? kind[0]?.slug : kind?.slug;
        if (slug) {
          slugs.add(slug);
        }
      }

      return [...slugs].sort();
    },

    async findKindBySlug(slug: string): Promise<WikiKindSummary | null> {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("kind")
        .select("slug, name, description")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      return {
        slug: data.slug,
        name: data.name,
        description: data.description,
        entryCount: 0,
      };
    },

    async listVisibleKinds(): Promise<WikiKindSummary[]> {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.from("codex_entry").select(`
          kind_id,
          kind:kind_id (slug, name, description)
        `);

      if (error) {
        throw error;
      }

      const counts = new Map<
        string,
        {
          slug: string;
          name: string;
          description: string | null;
          count: number;
        }
      >();

      for (const row of data ?? []) {
        const kind = row.kind as
          | { slug: string; name: string; description: string | null }
          | { slug: string; name: string; description: string | null }[]
          | null;
        const kindRow = Array.isArray(kind) ? kind[0] : kind;
        if (!kindRow?.slug) {
          continue;
        }

        const existing = counts.get(kindRow.slug);
        if (existing) {
          existing.count += 1;
          continue;
        }

        counts.set(kindRow.slug, {
          slug: kindRow.slug,
          name: kindRow.name,
          description: kindRow.description,
          count: 1,
        });
      }

      return [...counts.values()]
        .map((item) => ({
          slug: item.slug,
          name: item.name,
          description: item.description,
          entryCount: item.count,
        }))
        .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
    },

    async listTaxonomyEdgesForKind(
      kindSlug: string,
    ): Promise<WikiTaxonomyEdge[]> {
      return listRelationEdgesForKind(kindSlug, "taxonomy");
    },

    async listClassifiedAsEdgesForKind(
      kindSlug: string,
    ): Promise<WikiTaxonomyEdge[]> {
      return listRelationEdgesForKind(kindSlug, "classified_as");
    },

    async listTaxonomyChildren(
      entryId: string,
    ): Promise<WikiTaxonomyEdgeTarget[]> {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from("codex_edge")
        .select(
          `
          from_entry:from_entry_id (
            id,
            slug,
            title,
            kind:kind_id (slug)
          )
        `,
        )
        .eq("edge_type", "taxonomy")
        .eq("to_entry_id", entryId);

      if (error) {
        throw error;
      }

      const children: WikiTaxonomyEdgeTarget[] = [];

      for (const row of data ?? []) {
        const child = row.from_entry as
          | {
              id: string;
              slug: string;
              title: string;
              kind: { slug: string } | { slug: string }[] | null;
            }
          | {
              id: string;
              slug: string;
              title: string;
              kind: { slug: string } | { slug: string }[] | null;
            }[]
          | null;
        const childRow = Array.isArray(child) ? child[0] : child;
        if (!childRow?.id) {
          continue;
        }

        children.push({
          id: childRow.id,
          slug: childRow.slug,
          title: childRow.title,
          kindSlug: relationKindSlug(childRow.kind),
        });
      }

      return children.sort((left, right) =>
        left.title.localeCompare(right.title, "pt-BR"),
      );
    },
  };
}
