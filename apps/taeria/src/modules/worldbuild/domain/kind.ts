import type {
  KindFacetConfig,
  KindFacetConfigInput,
} from "./kind-facet-config";

export interface Kind {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  aiPrompt: string | null;
  isBuiltin: boolean;
  createdAt: Date;
  updatedAt: Date;
  facets: KindFacetConfig[];
}

export interface NewKind {
  slug: string;
  name: string;
  description?: string | null;
  aiPrompt?: string | null;
  facets: KindFacetConfigInput[];
}

export interface UpdateKind {
  slug?: string;
  name?: string;
  description?: string | null;
  aiPrompt?: string | null;
  facets?: KindFacetConfigInput[];
}
