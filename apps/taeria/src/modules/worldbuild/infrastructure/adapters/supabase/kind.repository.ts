import type { FacetType } from "../../../domain/facet-type";
import { FACET_DISPLAY_ORDER } from "../../../domain/facet-type";
import type { KindFacetConfig } from "../../../domain/kind-facet-config";
import type { Kind, NewKind, UpdateKind } from "../../../domain/kind";
import type { KindRepository } from "../../../domain/kind.repository";
import { createSupabaseAdminClient } from "@/common/adapters/supabase/admin";

type KindRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ai_prompt: string | null;
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
};

type FacetRow = {
  id: string;
  kind_id: string;
  facet_type: FacetType;
  enabled: boolean;
  required: boolean;
  schema: Record<string, unknown> | null;
  ai_prompt: string | null;
  display_order: number;
};

type KindWithFacetsRow = KindRow & {
  kind_facet_config: FacetRow[];
};

function toFacetDomain(row: FacetRow): KindFacetConfig {
  return {
    id: row.id,
    kindId: row.kind_id,
    facetType: row.facet_type,
    enabled: row.enabled,
    required: row.required,
    schema: row.schema,
    aiPrompt: row.ai_prompt,
    displayOrder: row.display_order,
  };
}

function toDomain(row: KindWithFacetsRow): Kind {
  const facets = (row.kind_facet_config ?? [])
    .map(toFacetDomain)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    aiPrompt: row.ai_prompt,
    isBuiltin: row.is_builtin,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    facets,
  };
}

const KIND_SELECT = `
  *,
  kind_facet_config (*)
`;

function facetRowsFromInput(
  kindId: string,
  facets: NewKind["facets"],
): Omit<FacetRow, "id">[] {
  return facets.map((facet) => ({
    kind_id: kindId,
    facet_type: facet.facetType,
    enabled: facet.enabled,
    required:
      facet.facetType === "edges" ||
      facet.facetType === "embeddings" ||
      facet.facetType === "visual"
        ? false
        : (facet.required ?? false),
    schema: facet.schema ?? null,
    ai_prompt: facet.aiPrompt ?? null,
    display_order: FACET_DISPLAY_ORDER[facet.facetType],
  }));
}

/**
 * Repositório de kinds via Supabase (tabelas `kind` + `kind_facet_config`).
 */
export function createSupabaseKindRepository(): KindRepository {
  const admin = createSupabaseAdminClient();

  return {
    async findById(id: string): Promise<Kind | null> {
      const { data, error } = await admin
        .from("kind")
        .select(KIND_SELECT)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data ? toDomain(data as KindWithFacetsRow) : null;
    },

    async findBySlug(slug: string): Promise<Kind | null> {
      const { data, error } = await admin
        .from("kind")
        .select(KIND_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw error;
      }
      return data ? toDomain(data as KindWithFacetsRow) : null;
    },

    async list(): Promise<Kind[]> {
      const { data, error } = await admin
        .from("kind")
        .select(KIND_SELECT)
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }
      return (data as KindWithFacetsRow[]).map(toDomain);
    },

    async create(data: NewKind): Promise<Kind> {
      const { data: kindRow, error: kindError } = await admin
        .from("kind")
        .insert({
          slug: data.slug,
          name: data.name,
          description: data.description ?? null,
          ai_prompt: data.aiPrompt ?? null,
        })
        .select("*")
        .single();

      if (kindError) {
        throw kindError;
      }

      const facetPayload = facetRowsFromInput(kindRow.id, data.facets);
      const { error: facetError } = await admin
        .from("kind_facet_config")
        .insert(facetPayload);

      if (facetError) {
        await admin.from("kind").delete().eq("id", kindRow.id);
        throw facetError;
      }

      const created = await this.findById(kindRow.id);
      if (!created) {
        throw new Error("Kind criado mas não encontrado após insert.");
      }
      return created;
    },

    async update(id: string, data: UpdateKind): Promise<Kind | null> {
      const existing = await this.findById(id);
      if (!existing) {
        return null;
      }

      const kindPayload: Partial<KindRow> = {};
      if (data.slug !== undefined) {
        kindPayload.slug = data.slug;
      }
      if (data.name !== undefined) {
        kindPayload.name = data.name;
      }
      if (data.description !== undefined) {
        kindPayload.description = data.description;
      }
      if (data.aiPrompt !== undefined) {
        kindPayload.ai_prompt = data.aiPrompt;
      }

      if (Object.keys(kindPayload).length > 0) {
        const { error } = await admin
          .from("kind")
          .update(kindPayload)
          .eq("id", id);
        if (error) {
          throw error;
        }
      }

      if (data.facets) {
        for (const facet of data.facets) {
          const { error } = await admin
            .from("kind_facet_config")
            .update({
              enabled: facet.enabled,
              required:
                facet.facetType === "edges" ||
                facet.facetType === "embeddings" ||
                facet.facetType === "visual"
                  ? false
                  : (facet.required ?? false),
              schema: facet.schema ?? null,
              ai_prompt: facet.aiPrompt ?? null,
              display_order: FACET_DISPLAY_ORDER[facet.facetType],
            })
            .eq("kind_id", id)
            .eq("facet_type", facet.facetType);

          if (error) {
            throw error;
          }
        }
      }

      return this.findById(id);
    },

    async delete(id: string): Promise<boolean> {
      const existing = await this.findById(id);
      if (!existing) {
        return false;
      }

      const { error } = await admin.from("kind").delete().eq("id", id);
      if (error) {
        throw error;
      }
      return true;
    },
  };
}
