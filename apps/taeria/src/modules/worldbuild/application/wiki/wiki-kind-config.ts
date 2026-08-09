/**
 * Configuração declarativa da wiki por kind — hub, browse e layout de artigo.
 * Convenção taxonomy: `from_entry` = filho, `to_entry` = pai; raízes sem pai visível.
 */

export type WikiHubGroup = "historia" | "mundo" | "sistema" | "referencia";

export type WikiBrowseMode =
  | "grid"
  | "tree"
  | "treeGrouped"
  | "recipe"
  | "equipamento";

export type WikiEntryLayoutMode =
  | "default"
  | "statBlock"
  | "technique"
  | "recipe"
  | "reading"
  | "lexicon";

export type WikiHubGroupSection = {
  id: WikiHubGroup;
  label: string;
  kindSlugs: readonly string[];
};

const HUB_GROUP_ORDER: readonly WikiHubGroup[] = [
  "historia",
  "mundo",
  "sistema",
  "referencia",
];

const HUB_GROUP_LABELS: Record<WikiHubGroup, string> = {
  historia: "História",
  mundo: "Mundo",
  sistema: "Sistema",
  referencia: "Referência",
};

/** Slug → grupo do hub (kinds sem entrada caem em "Outros" na UI). */
const KIND_HUB_GROUP: Record<string, WikiHubGroup> = {
  lenda: "historia",
  personagem: "historia",
  livro: "historia",
  divindade: "historia",
  organizacao: "historia",
  lugar: "mundo",
  criatura: "mundo",
  planta: "mundo",
  recurso: "mundo",
  raca: "sistema",
  escola: "sistema",
  habilidade: "sistema",
  equipamento: "sistema",
  receita: "sistema",
  termo: "referencia",
  taxon: "referencia",
};

const KIND_BROWSE_MODE: Partial<Record<string, WikiBrowseMode>> = {
  escola: "tree",
  taxon: "tree",
  criatura: "treeGrouped",
  planta: "treeGrouped",
  lugar: "tree",
  recurso: "tree",
  raca: "tree",
  organizacao: "tree",
  habilidade: "treeGrouped",
  receita: "recipe",
  equipamento: "equipamento",
};

const KIND_ENTRY_LAYOUT: Partial<Record<string, WikiEntryLayoutMode>> = {
  personagem: "statBlock",
  criatura: "statBlock",
  habilidade: "technique",
  receita: "recipe",
  livro: "reading",
  lenda: "reading",
  divindade: "reading",
  termo: "lexicon",
};

const HUB_KIND_ORDER: Partial<Record<WikiHubGroup, readonly string[]>> = {
  historia: ["lenda", "personagem", "livro", "divindade", "organizacao"],
  mundo: ["lugar", "criatura", "planta", "recurso"],
  sistema: ["raca", "escola", "habilidade", "equipamento", "receita"],
  referencia: ["termo", "taxon"],
};

export function getWikiHubGroupForKind(kindSlug: string): WikiHubGroup | null {
  return KIND_HUB_GROUP[kindSlug] ?? null;
}

export function getWikiBrowseMode(kindSlug: string): WikiBrowseMode {
  return KIND_BROWSE_MODE[kindSlug] ?? "grid";
}

export function getWikiEntryLayoutMode(kindSlug: string): WikiEntryLayoutMode {
  return KIND_ENTRY_LAYOUT[kindSlug] ?? "default";
}

/**
 * Seções do hub com slugs ordenados. Filtra slugs ausentes em `availableSlugs`
 * quando informado (ex.: kinds sem entradas publicadas ainda aparecem se listados
 * no índice de kinds).
 */
export function getWikiHubGroups(input?: {
  availableSlugs?: readonly string[];
}): WikiHubGroupSection[] {
  const available = input?.availableSlugs
    ? new Set(input.availableSlugs)
    : null;

  return HUB_GROUP_ORDER.map((id) => {
    const configured = HUB_KIND_ORDER[id] ?? [];
    const kindSlugs = configured.filter(
      (slug) => !available || available.has(slug),
    );

    return {
      id,
      label: HUB_GROUP_LABELS[id],
      kindSlugs,
    };
  }).filter((section) => section.kindSlugs.length > 0);
}

/** Kinds visíveis no hub sem grupo configurado. */
export function getWikiUncategorizedKindSlugs(
  availableSlugs: readonly string[],
): string[] {
  return availableSlugs.filter((slug) => !KIND_HUB_GROUP[slug]);
}
