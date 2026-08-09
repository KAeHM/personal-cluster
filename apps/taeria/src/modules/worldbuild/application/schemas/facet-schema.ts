import type {
  ContentFacetType,
  FacetType,
  StoredFacetType,
} from "../../domain/facet-type";
import { CONTENT_FACET_TYPES } from "../../domain/facet-type";

export type FacetFieldType =
  | "string"
  | "markdown"
  | "number"
  | "boolean"
  | "image";

export type WikiFieldPlacement = "hero" | "sidebar" | "body" | "hidden";

export type WikiEdgePlacement = "hero" | "sidebar" | "hidden";

export type FacetFieldDef = {
  key: string;
  label: string;
  fieldType: FacetFieldType;
  required: boolean;
  wikiPlacement: WikiFieldPlacement;
};

export type ContentFacetFormValue = {
  facetType: ContentFacetType;
  enabled: boolean;
  required: boolean;
  aiPrompt: string;
  fields: FacetFieldDef[];
};

export const WIKI_FIELD_PLACEMENT_LABELS: Record<WikiFieldPlacement, string> = {
  hero: "Hero",
  sidebar: "Sidebar",
  body: "Corpo",
  hidden: "Oculto",
};

export const WIKI_EDGE_PLACEMENT_LABELS: Record<WikiEdgePlacement, string> = {
  hero: "Hero",
  sidebar: "Sidebar",
  hidden: "Oculto",
};

const WIKI_PLACEMENT_KEY = "x-wiki-placement";

export const FACET_FIELD_TYPE_LABELS: Record<FacetFieldType, string> = {
  string: "Texto",
  markdown: "Markdown",
  number: "Número",
  boolean: "Sim/Não",
  image: "Imagem",
};

export const DEFAULT_CONTENT_FACET_FIELDS: Record<
  ContentFacetType,
  FacetFieldDef[]
> = {
  lore: [
    {
      key: "lore_md",
      label: "Texto narrativo",
      fieldType: "markdown",
      required: true,
      wikiPlacement: "body",
    },
  ],
  system: [
    {
      key: "system_data",
      label: "Dados do sistema",
      fieldType: "string",
      required: false,
      wikiPlacement: "hidden",
    },
  ],
  lexicon: [
    {
      key: "term",
      label: "Termo",
      fieldType: "string",
      required: true,
      wikiPlacement: "sidebar",
    },
    {
      key: "translation",
      label: "Tradução",
      fieldType: "string",
      required: false,
      wikiPlacement: "sidebar",
    },
  ],
};

export const DEFAULT_VISUAL_FACET_FIELDS: FacetFieldDef[] = [
  {
    key: "banner_url",
    label: "Banner",
    fieldType: "image",
    required: false,
    wikiPlacement: "hidden",
  },
];

export const DEFAULT_EDGE_RELATION_TYPES = ["related_to", "taxonomy"];

const JSON_SCHEMA_TYPE_MAP: Record<Exclude<FacetFieldType, "image">, string> = {
  string: "string",
  markdown: "string",
  number: "number",
  boolean: "boolean",
};

function defaultWikiPlacement(
  key: string,
  facetType: StoredFacetType | ContentFacetType,
): WikiFieldPlacement {
  if (key === "lore_md") {
    return "body";
  }
  if (key === "banner_url") {
    return "hidden";
  }
  if (facetType === "system") {
    return "hidden";
  }
  if (facetType === "visual") {
    return "hidden";
  }
  return "sidebar";
}

function cloneFields(fields: FacetFieldDef[]): FacetFieldDef[] {
  return fields.map((field) => ({ ...field }));
}

function ensureFieldPlacements(
  fields: FacetFieldDef[],
  facetType: StoredFacetType | ContentFacetType,
): FacetFieldDef[] {
  return fields.map((field) => ({
    ...field,
    wikiPlacement:
      field.wikiPlacement ?? defaultWikiPlacement(field.key, facetType),
  }));
}

function fieldTypeFromJsonSchema(
  property: Record<string, unknown>,
): FacetFieldType {
  if (property.format === "image") {
    return "image";
  }
  if (property.format === "markdown") {
    return "markdown";
  }
  if (property.type === "number" || property.type === "integer") {
    return "number";
  }
  if (property.type === "boolean") {
    return "boolean";
  }
  return "string";
}

function defaultFieldsForStoredFacet(
  facetType: StoredFacetType,
): FacetFieldDef[] {
  const fields =
    facetType === "visual"
      ? cloneFields(DEFAULT_VISUAL_FACET_FIELDS)
      : cloneFields(DEFAULT_CONTENT_FACET_FIELDS[facetType]);
  return ensureFieldPlacements(fields, facetType);
}

function parseFacetSchemaFields(
  schema: Record<string, unknown> | null | undefined,
  defaults: FacetFieldDef[],
  facetType: StoredFacetType | ContentFacetType,
): FacetFieldDef[] {
  if (!schema || schema.type !== "object") {
    return ensureFieldPlacements(cloneFields(defaults), facetType);
  }

  const properties = schema.properties;
  if (
    !properties ||
    typeof properties !== "object" ||
    Array.isArray(properties)
  ) {
    return ensureFieldPlacements(cloneFields(defaults), facetType);
  }

  const required = Array.isArray(schema.required)
    ? schema.required.filter((item): item is string => typeof item === "string")
    : [];

  const fields = Object.entries(properties as Record<string, unknown>).map(
    ([key, value]) => {
      const property =
        typeof value === "object" && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : {};

      const rawPlacement = property[WIKI_PLACEMENT_KEY];
      const wikiPlacement =
        rawPlacement === "hero" ||
        rawPlacement === "sidebar" ||
        rawPlacement === "body" ||
        rawPlacement === "hidden"
          ? rawPlacement
          : defaultWikiPlacement(key, facetType);

      return {
        key,
        label: typeof property.title === "string" ? property.title : key,
        fieldType: fieldTypeFromJsonSchema(property),
        required: required.includes(key),
        wikiPlacement,
      };
    },
  );

  return fields.length > 0
    ? fields
    : ensureFieldPlacements(cloneFields(defaults), facetType);
}

export function parseContentFacetSchema(
  schema: Record<string, unknown> | null | undefined,
  facetType: ContentFacetType,
): FacetFieldDef[] {
  return parseFacetSchemaFields(
    schema,
    ensureFieldPlacements(DEFAULT_CONTENT_FACET_FIELDS[facetType], facetType),
    facetType,
  );
}

export function parseStoredFacetSchema(
  schema: Record<string, unknown> | null | undefined,
  facetType: StoredFacetType,
): FacetFieldDef[] {
  return parseFacetSchemaFields(
    schema,
    defaultFieldsForStoredFacet(facetType),
    facetType,
  );
}

export function buildContentFacetSchema(
  fields: FacetFieldDef[],
): Record<string, unknown> | null {
  const validFields = fields.filter((field) => field.key.trim() !== "");
  if (validFields.length === 0) {
    return null;
  }

  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const field of validFields) {
    const key = field.key.trim();
    properties[key] = {
      type:
        field.fieldType === "image"
          ? "string"
          : JSON_SCHEMA_TYPE_MAP[
              field.fieldType as Exclude<FacetFieldType, "image">
            ],
      title: field.label.trim() || key,
      ...(field.fieldType === "markdown" ? { format: "markdown" } : {}),
      ...(field.fieldType === "image" ? { format: "image" } : {}),
      [WIKI_PLACEMENT_KEY]: field.wikiPlacement,
    };
    if (field.required) {
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

export function parseEdgesFacetSchema(
  schema: Record<string, unknown> | null | undefined,
): string[] {
  if (!schema) {
    return [...DEFAULT_EDGE_RELATION_TYPES];
  }

  const allowedTypes = schema.allowedTypes;
  if (!Array.isArray(allowedTypes)) {
    return [...DEFAULT_EDGE_RELATION_TYPES];
  }

  const types = allowedTypes.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );

  return types.length > 0 ? types : [...DEFAULT_EDGE_RELATION_TYPES];
}

export function parseEdgesWikiPlacements(
  schema: Record<string, unknown> | null | undefined,
): Record<string, WikiEdgePlacement> {
  if (!schema) {
    return {};
  }

  const raw = schema.wikiPlacements;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const placements: Record<string, WikiEdgePlacement> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === "hero" || value === "sidebar" || value === "hidden") {
      placements[key] = value;
    }
  }

  return placements;
}

export function buildEdgesFacetSchema(
  relationTypes: string[],
  wikiPlacements?: Record<string, WikiEdgePlacement>,
): Record<string, unknown> | null {
  const types = relationTypes
    .map((type) => type.trim())
    .filter((type) => type !== "");

  if (types.length === 0) {
    return null;
  }

  const filteredPlacements = Object.fromEntries(
    Object.entries(wikiPlacements ?? {}).filter(
      ([edgeType]) => types.includes(edgeType) && edgeType !== "related_to",
    ),
  );

  return {
    allowedTypes: types,
    ...(Object.keys(filteredPlacements).length > 0
      ? { wikiPlacements: filteredPlacements }
      : {}),
  };
}

export function slugifyName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function facetTypeLabel(facetType: FacetType): string {
  const labels: Record<FacetType, string> = {
    lore: "Lore",
    system: "Sistema",
    lexicon: "Léxico",
    visual: "Visual",
    edges: "Relações",
    embeddings: "Busca",
  };
  return labels[facetType];
}

export function defaultContentFacetFields(
  facetType: ContentFacetType,
): FacetFieldDef[] {
  return ensureFieldPlacements(
    cloneFields(DEFAULT_CONTENT_FACET_FIELDS[facetType]),
    facetType,
  );
}

export function defaultContentFacet(
  facetType: ContentFacetType,
): ContentFacetFormValue {
  return {
    facetType,
    enabled: facetType === "lore",
    required: facetType === "lore",
    aiPrompt: "",
    fields: defaultContentFacetFields(facetType),
  };
}

export function buildContentFacetsDefaults(): ContentFacetFormValue[] {
  return CONTENT_FACET_TYPES.map((facetType) => defaultContentFacet(facetType));
}

export type EdgesFacetFormValue = {
  enabled: boolean;
  relationTypes: string[];
  wikiPlacements: Record<string, WikiEdgePlacement>;
};

export type EmbeddingsFacetFormValue = {
  enabled: boolean;
};

export type VisualFacetFormValue = {
  enabled: boolean;
  fields: FacetFieldDef[];
};

export function defaultVisualFacet(): VisualFacetFormValue {
  return {
    enabled: false,
    fields: ensureFieldPlacements(
      cloneFields(DEFAULT_VISUAL_FACET_FIELDS),
      "visual",
    ),
  };
}

export function defaultEdgesFacet(): EdgesFacetFormValue {
  return {
    enabled: false,
    relationTypes: [...DEFAULT_EDGE_RELATION_TYPES],
    wikiPlacements: { written_by: "sidebar" },
  };
}

export function defaultEmbeddingsFacet(): EmbeddingsFacetFormValue {
  return { enabled: false };
}

export function enabledContentFacetTypes(
  facets: Array<{ facetType: FacetType; enabled: boolean }>,
): ContentFacetType[] {
  return CONTENT_FACET_TYPES.filter((facetType) =>
    facets.some((facet) => facet.facetType === facetType && facet.enabled),
  );
}
