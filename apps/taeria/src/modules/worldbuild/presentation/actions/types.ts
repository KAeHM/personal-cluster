export type KindActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type CodexActionState = {
  ok: boolean;
  message?: string;
  /** Detalhes de validação (campos/facetas) para exibir na UI. */
  details?: string[];
  entryId?: string;
  entrySlug?: string;
  url?: string;
};

export type CodexEntrySearchResult = {
  slug: string;
  title: string;
  kindSlug: string;
};

export type CodexSearchActionState = {
  ok: boolean;
  entries: CodexEntrySearchResult[];
};
