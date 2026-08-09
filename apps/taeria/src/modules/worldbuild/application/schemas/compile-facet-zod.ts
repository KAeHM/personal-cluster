import { z } from "zod";

import type { StoredFacetType } from "../../domain/facet-type";
import type { Kind } from "../../domain/kind";
import { parseStoredFacetSchema, type FacetFieldDef } from "./facet-schema";

function zodTypeForField(field: FacetFieldDef): z.ZodType {
  let schema: z.ZodType;

  switch (field.fieldType) {
    case "number":
      schema = z.number();
      break;
    case "boolean":
      schema = z.boolean();
      break;
    case "image":
    case "markdown":
    case "string":
    default:
      schema = z.string();
      break;
  }

  if (!field.required) {
    schema = schema.optional();
  }

  return schema;
}

/**
 * Compila o JSON Schema de uma faceta do kind em um Zod object dinâmico.
 */
export function compileFacetZod(
  kind: Kind,
  facetType: StoredFacetType,
): z.ZodObject<Record<string, z.ZodType>> {
  const facetConfig = kind.facets.find(
    (facet) => facet.facetType === facetType,
  );
  const fields = parseStoredFacetSchema(facetConfig?.schema ?? null, facetType);

  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) {
    shape[field.key] = zodTypeForField(field);
  }

  return z.object(shape);
}

export function validateFacetData(
  kind: Kind,
  facetType: StoredFacetType,
  data: Record<string, unknown>,
):
  | { success: true; data: Record<string, unknown> }
  | { success: false; errors: string[] } {
  const schema = compileFacetZod(kind, facetType);
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    return { success: true, data: parsed.data as Record<string, unknown> };
  }

  const errors = parsed.error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });

  return { success: false, errors };
}
