export type { Kind, NewKind, UpdateKind } from "./domain/kind";
export type {
  KindFacetConfig,
  KindFacetConfigInput,
} from "./domain/kind-facet-config";
export {
  FACET_TYPES,
  CONTENT_FACET_TYPES,
  FACET_DISPLAY_ORDER,
  FACET_LABELS,
  type FacetType,
  type ContentFacetType,
} from "./domain/facet-type";
export type { KindRepository } from "./domain/kind.repository";
export { KIND_ERRORS, CODEX_ERRORS } from "./domain/errors";

export {
  createKindSchema,
  updateKindSchema,
  kindSlugSchema,
  kindBaseSchema,
  kindFacetConfigSchema,
  type CreateKindInput,
  type UpdateKindInput,
} from "./application/schemas/kind.schema";

export { listKinds } from "./application/use-cases/list-kinds";
export { getKind, getKindBySlug } from "./application/use-cases/get-kind";
export { createKind } from "./application/use-cases/create-kind";
export { updateKind } from "./application/use-cases/update-kind";
export { deleteKind } from "./application/use-cases/delete-kind";

export { createCodexFromDraft } from "./application/use-cases/create-codex-from-draft";
export { createCodexEntry } from "./application/use-cases/create-codex-entry";
export {
  getCodexEntry,
  getCodexEntryBySlug,
  getCodexEntryDetail,
} from "./application/use-cases/get-codex-entry";
export { searchCodexEntries } from "./application/use-cases/search-codex-entries";
export { listCodexEntries } from "./application/use-cases/list-codex-entries";
export { updateCodexEntry } from "./application/use-cases/update-codex-entry";
export { deleteCodexEntry } from "./application/use-cases/delete-codex-entry";

export {
  getWikiEntryBySlug,
  listWikiEntries,
  listWikiKindSlugs,
} from "./application/use-cases/get-wiki-entry-by-slug";
export { listPlayersForShare } from "./application/use-cases/list-players-for-share";
export {
  resolveWikiEntryLayout,
  loreExcerpt,
} from "./application/wiki/resolve-wiki-entry-layout";
export type {
  WikiEntryLayout,
  WikiLayoutField,
  WikiLayoutEdge,
} from "./application/wiki/resolve-wiki-entry-layout";

export { getKindRepository } from "./infrastructure/kind.repository.factory";
export { getCodexRepository } from "./infrastructure/codex.repository.factory";
export { getWikiCodexRepository } from "./infrastructure/wiki-codex.repository.factory";
