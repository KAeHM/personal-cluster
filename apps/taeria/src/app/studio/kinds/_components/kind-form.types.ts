import { z } from "zod";

import { CONTENT_FACET_TYPES } from "@/modules/worldbuild/domain/facet-type";
import { kindSlugSchema } from "@/modules/worldbuild/application/schemas/kind.schema";
import {
  buildContentFacetsDefaults,
  defaultEdgesFacet,
  defaultEmbeddingsFacet,
  defaultVisualFacet,
  WIKI_EDGE_PLACEMENT_LABELS,
  WIKI_FIELD_PLACEMENT_LABELS,
  type WikiEdgePlacement,
  type WikiFieldPlacement,
} from "./facet-schema-ui";

const facetFieldSchema = z.object({
  key: z.string(),
  label: z.string().max(80),
  fieldType: z.enum(["string", "markdown", "number", "boolean", "image"]),
  required: z.boolean(),
  wikiPlacement: z.enum(["hero", "sidebar", "body", "hidden"]),
});

const contentFacetSchema = z.object({
  facetType: z.enum(CONTENT_FACET_TYPES),
  enabled: z.boolean(),
  required: z.boolean(),
  aiPrompt: z.string().max(8000),
  fields: z.array(facetFieldSchema).min(1),
});

const edgesFacetSchema = z.object({
  enabled: z.boolean(),
  relationTypes: z.array(z.string()),
  wikiPlacements: z.record(z.string(), z.enum(["hero", "sidebar", "hidden"])),
});

const embeddingsFacetSchema = z.object({
  enabled: z.boolean(),
});

const visualFacetSchema = z.object({
  enabled: z.boolean(),
  fields: z.array(facetFieldSchema).min(1),
});

export const kindFormSchema = z.object({
  slug: kindSlugSchema,
  name: z.string().min(1, "Nome obrigatório.").max(120),
  description: z.string().max(2000),
  aiPrompt: z.string().max(8000),
  contentFacets: z.array(contentFacetSchema).length(CONTENT_FACET_TYPES.length),
  visualFacet: visualFacetSchema,
  edgesFacet: edgesFacetSchema,
  embeddingsFacet: embeddingsFacetSchema,
});

function validateFacetFields(
  fields: z.infer<typeof facetFieldSchema>[],
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[],
) {
  const validFields = fields.filter((field) => field.key.trim() !== "");
  if (validFields.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Adicione ao menos um campo com chave válida.",
      path: [...pathPrefix, "fields"],
    });
  }

  const keys = new Set<string>();
  for (const [fieldIndex, field] of fields.entries()) {
    const key = field.key.trim();
    if (!key) {
      continue;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      ctx.addIssue({
        code: "custom",
        message: "Use snake_case: letras minúsculas, números e underscores.",
        path: [...pathPrefix, "fields", fieldIndex, "key"],
      });
    }
    if (keys.has(key)) {
      ctx.addIssue({
        code: "custom",
        message: "Chaves duplicadas nesta faceta.",
        path: [...pathPrefix, "fields", fieldIndex, "key"],
      });
    }
    keys.add(key);
  }

  for (const [fieldIndex, field] of fields.entries()) {
    if (field.key.trim() && !field.label.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Informe o rótulo do campo.",
        path: [...pathPrefix, "fields", fieldIndex, "label"],
      });
    }
  }
}

export const kindFormSchemaWithRules = kindFormSchema.superRefine(
  (data, ctx) => {
    const hasContentFacet = data.contentFacets.some((facet) => facet.enabled);
    if (!hasContentFacet) {
      ctx.addIssue({
        code: "custom",
        message:
          "Habilite ao menos uma faceta de conteúdo (lore, sistema ou léxico).",
        path: ["contentFacets"],
      });
    }

    for (const [index, facet] of data.contentFacets.entries()) {
      if (facet.required && !facet.enabled) {
        ctx.addIssue({
          code: "custom",
          message: "Facetas obrigatórias precisam estar habilitadas.",
          path: ["contentFacets", index, "required"],
        });
      }

      if (!facet.enabled) {
        continue;
      }

      validateFacetFields(facet.fields, ctx, ["contentFacets", index]);
    }

    if (data.visualFacet.enabled) {
      validateFacetFields(data.visualFacet.fields, ctx, ["visualFacet"]);
    }

    if (data.edgesFacet.enabled) {
      const types = data.edgesFacet.relationTypes
        .map((type) => type.trim())
        .filter(Boolean);
      if (types.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Informe ao menos um tipo de relação.",
          path: ["edgesFacet", "relationTypes"],
        });
      }
    }
  },
);

export type KindFormValues = z.infer<typeof kindFormSchemaWithRules>;

export type { WikiEdgePlacement, WikiFieldPlacement };
export { WIKI_EDGE_PLACEMENT_LABELS, WIKI_FIELD_PLACEMENT_LABELS };

export function buildDefaultKindFormValues(): KindFormValues {
  return {
    slug: "",
    name: "",
    description: "",
    aiPrompt: "",
    contentFacets: buildContentFacetsDefaults(),
    visualFacet: defaultVisualFacet(),
    edgesFacet: defaultEdgesFacet(),
    embeddingsFacet: defaultEmbeddingsFacet(),
  };
}
