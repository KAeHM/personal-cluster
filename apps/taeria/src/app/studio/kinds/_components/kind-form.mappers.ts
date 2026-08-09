import { FACET_TYPES } from "@/modules/worldbuild/domain/facet-type";
import type { Kind } from "@/modules/worldbuild/domain/kind";
import {
  buildContentFacetSchema,
  buildContentFacetsDefaults,
  buildEdgesFacetSchema,
  defaultEdgesFacet,
  defaultVisualFacet,
  parseContentFacetSchema,
  parseEdgesFacetSchema,
  parseEdgesWikiPlacements,
  parseStoredFacetSchema,
} from "./facet-schema-ui";
import type { KindFormValues } from "./kind-form.types";

export function kindToFormValues(kind: Kind): KindFormValues {
  return {
    slug: kind.slug,
    name: kind.name,
    description: kind.description ?? "",
    aiPrompt: kind.aiPrompt ?? "",
    contentFacets: buildContentFacetsDefaults().map((defaults) => {
      const facet = kind.facets.find(
        (item) => item.facetType === defaults.facetType,
      );
      if (!facet) {
        return defaults;
      }

      return {
        facetType: defaults.facetType,
        enabled: facet.enabled,
        required: facet.required,
        aiPrompt: facet.aiPrompt ?? "",
        fields: parseContentFacetSchema(facet.schema, defaults.facetType),
      };
    }),
    visualFacet: (() => {
      const facet = kind.facets.find((item) => item.facetType === "visual");
      if (!facet) {
        return defaultVisualFacet();
      }

      return {
        enabled: facet.enabled,
        fields: parseStoredFacetSchema(facet.schema, "visual"),
      };
    })(),
    edgesFacet: (() => {
      const facet = kind.facets.find((item) => item.facetType === "edges");
      if (!facet) {
        return defaultEdgesFacet();
      }

      return {
        enabled: facet.enabled,
        relationTypes: parseEdgesFacetSchema(facet.schema),
        wikiPlacements: parseEdgesWikiPlacements(facet.schema),
      };
    })(),
    embeddingsFacet: (() => {
      const facet = kind.facets.find((item) => item.facetType === "embeddings");
      return {
        enabled: facet?.enabled ?? false,
      };
    })(),
  };
}

export function formValuesToKindPayload(values: KindFormValues) {
  const contentFacetMap = new Map(
    values.contentFacets.map((facet) => [facet.facetType, facet]),
  );

  const facets = FACET_TYPES.map((facetType) => {
    if (facetType === "edges") {
      return {
        facetType,
        enabled: values.edgesFacet.enabled,
        required: false,
        schema: values.edgesFacet.enabled
          ? buildEdgesFacetSchema(
              values.edgesFacet.relationTypes,
              values.edgesFacet.wikiPlacements,
            )
          : null,
      };
    }

    if (facetType === "embeddings") {
      return {
        facetType,
        enabled: values.embeddingsFacet.enabled,
        required: false,
        schema: null,
      };
    }

    if (facetType === "visual") {
      const activeFields = values.visualFacet.fields.filter(
        (field) => field.key.trim() !== "",
      );

      return {
        facetType,
        enabled: values.visualFacet.enabled,
        required: false,
        schema:
          values.visualFacet.enabled && activeFields.length > 0
            ? buildContentFacetSchema(activeFields)
            : null,
      };
    }

    const facet = contentFacetMap.get(facetType)!;
    const activeFields = facet.fields.filter(
      (field) => field.key.trim() !== "",
    );

    return {
      facetType,
      enabled: facet.enabled,
      required: facet.required,
      aiPrompt: facet.aiPrompt || null,
      schema:
        facet.enabled && activeFields.length > 0
          ? buildContentFacetSchema(activeFields)
          : null,
    };
  });

  return {
    slug: values.slug,
    name: values.name,
    description: values.description || null,
    aiPrompt: values.aiPrompt || null,
    facets,
  };
}
