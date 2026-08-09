import type { FacetType } from "./facet-type";

export interface KindFacetConfig {
  id: string;
  kindId: string;
  facetType: FacetType;
  enabled: boolean;
  required: boolean;
  schema: Record<string, unknown> | null;
  aiPrompt: string | null;
  displayOrder: number;
}

export interface KindFacetConfigInput {
  facetType: FacetType;
  enabled: boolean;
  required?: boolean;
  schema?: Record<string, unknown> | null;
  aiPrompt?: string | null;
}
