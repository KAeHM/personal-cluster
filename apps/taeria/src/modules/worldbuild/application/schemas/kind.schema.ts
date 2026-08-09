import { z } from "zod";
import {
  CONTENT_FACET_TYPES,
  FACET_TYPES,
  type FacetType,
} from "../../domain/facet-type";

const SLUG_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export const kindSlugSchema = z
  .string()
  .min(1, "Identificador obrigatório.")
  .regex(
    SLUG_REGEX,
    "Use kebab-case: letras minúsculas, números e hífens (ex.: weapon, forest-creature).",
  );

export const kindBaseSchema = z.object({
  slug: kindSlugSchema,
  name: z.string().min(1, "Nome obrigatório.").max(120),
  description: z.string().max(2000).nullish(),
  aiPrompt: z.string().max(8000).nullish(),
});

function parseOptionalJson(
  value: unknown,
  ctx: z.RefinementCtx,
  path: (string | number)[],
): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") {
    ctx.addIssue({
      code: "custom",
      message: "Schema deve ser JSON válido.",
      path,
    });
    return z.NEVER;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Schema deve ser um objeto JSON.",
        path,
      });
      return z.NEVER;
    }
    return parsed as Record<string, unknown>;
  } catch {
    ctx.addIssue({
      code: "custom",
      message: "Schema deve ser JSON válido.",
      path,
    });
    return z.NEVER;
  }
}

export const kindFacetConfigSchema = z
  .object({
    facetType: z.enum(FACET_TYPES),
    enabled: z.boolean(),
    required: z.boolean().optional().default(false),
    schema: z.unknown().optional().nullable(),
    aiPrompt: z.string().max(8000).optional().nullable(),
  })
  .transform((facet, ctx) => ({
    facetType: facet.facetType,
    enabled: facet.enabled,
    required: facet.required ?? false,
    schema: parseOptionalJson(facet.schema, ctx, ["schema"]),
    aiPrompt: facet.aiPrompt ?? null,
  }));

function validateFacetsArray(
  facets: Array<{
    facetType: FacetType;
    enabled: boolean;
    required: boolean;
    schema: Record<string, unknown> | null;
  }>,
  ctx: z.RefinementCtx,
): void {
  if (facets.length !== FACET_TYPES.length) {
    ctx.addIssue({
      code: "custom",
      message: `Informe exatamente ${FACET_TYPES.length} facetas (uma por tipo).`,
      path: ["facets"],
    });
    return;
  }

  const types = facets.map((f) => f.facetType);
  const uniqueTypes = new Set(types);
  if (uniqueTypes.size !== FACET_TYPES.length) {
    ctx.addIssue({
      code: "custom",
      message: "Cada tipo de faceta deve aparecer exatamente uma vez.",
      path: ["facets"],
    });
    return;
  }

  for (const facet of facets) {
    if (facet.required && !facet.enabled) {
      ctx.addIssue({
        code: "custom",
        message: "Facetas obrigatórias precisam estar habilitadas.",
        path: ["facets"],
      });
    }
    if (
      (facet.facetType === "edges" ||
        facet.facetType === "embeddings" ||
        facet.facetType === "visual") &&
      facet.required
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Relações, visual e embeddings não podem ser obrigatórios.",
        path: ["facets"],
      });
    }
  }

  const hasContentFacet = facets.some(
    (f) =>
      (CONTENT_FACET_TYPES as readonly string[]).includes(f.facetType) &&
      f.enabled,
  );
  if (!hasContentFacet) {
    ctx.addIssue({
      code: "custom",
      message:
        "Habilite ao menos uma faceta de conteúdo (lore, sistema ou léxico).",
      path: ["facets"],
    });
  }
}

const facetsArraySchema = z
  .array(kindFacetConfigSchema)
  .length(FACET_TYPES.length)
  .superRefine((facets, ctx) => {
    validateFacetsArray(facets, ctx);
  });

export const createKindSchema = kindBaseSchema
  .extend({
    facets: facetsArraySchema,
  })
  .transform((data) => ({
    ...data,
    description: data.description ?? null,
    aiPrompt: data.aiPrompt ?? null,
    facets: data.facets.map((f) => ({
      ...f,
      required:
        f.facetType === "edges" ||
        f.facetType === "embeddings" ||
        f.facetType === "visual"
          ? false
          : f.required,
    })),
  }));

export const updateKindSchema = kindBaseSchema
  .extend({
    facets: facetsArraySchema,
  })
  .transform((data) => ({
    ...data,
    description: data.description ?? null,
    aiPrompt: data.aiPrompt ?? null,
    facets: data.facets.map((f) => ({
      ...f,
      required:
        f.facetType === "edges" ||
        f.facetType === "embeddings" ||
        f.facetType === "visual"
          ? false
          : f.required,
    })),
  }));

export type CreateKindInput = z.infer<typeof createKindSchema>;
export type UpdateKindInput = z.infer<typeof updateKindSchema>;
export type KindFacetConfigFormInput = z.input<typeof kindFacetConfigSchema>;
