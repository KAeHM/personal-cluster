/**
 * Sinônimos de linguagem natural → slug de Classe (kind taxon).
 * Usado pelo Studio AI / edges-resolver para deduzir classified_as.
 */
const TAXON_CLASS_SYNONYMS: Record<string, string> = {
  mamifero: "classe-mamiferos",
  mamíferos: "classe-mamiferos",
  mamiferos: "classe-mamiferos",
  mamália: "classe-mamiferos",
  mamalia: "classe-mamiferos",
  ave: "classe-aves",
  aves: "classe-aves",
  reptil: "classe-repteis",
  réptil: "classe-repteis",
  repteis: "classe-repteis",
  répteis: "classe-repteis",
  peixe: "classe-peixes",
  peixes: "classe-peixes",
  aquatico: "classe-peixes",
  aquático: "classe-peixes",
  inseto: "classe-artropodes",
  insetos: "classe-artropodes",
  artropode: "classe-artropodes",
  artrópode: "classe-artropodes",
  artropodes: "classe-artropodes",
  besta: "classe-bestas-magicas",
  bestas: "classe-bestas-magicas",
  magica: "classe-bestas-magicas",
  mágica: "classe-bestas-magicas",
  arvore: "classe-arvores",
  árvore: "classe-arvores",
  arvores: "classe-arvores",
  erva: "classe-ervas",
  ervas: "classe-ervas",
  graminea: "classe-ervas",
  vinha: "classe-vinhas",
  vinhas: "classe-vinhas",
  flora: "classe-flora-magica",
};

function normalizeSynonymKey(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** Resolve o primeiro sinônimo encontrado no texto para um slug de Classe. */
export function resolveTaxonClassSlugFromText(text: string): string | null {
  const normalized = normalizeSynonymKey(text);
  if (!normalized) {
    return null;
  }

  let best: { index: number; length: number; slug: string } | null = null;

  for (const [key, slug] of Object.entries(TAXON_CLASS_SYNONYMS)) {
    const needle = normalizeSynonymKey(key);
    if (!needle) {
      continue;
    }
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}])(${escapeRegExp(needle)})([^\\p{L}\\p{N}]|$)`,
      "u",
    );
    const match = pattern.exec(normalized);
    if (!match || match.index === undefined) {
      continue;
    }
    const tokenIndex = match.index + (match[1]?.length ?? 0);
    const tokenLength = match[2]?.length ?? needle.length;
    if (
      !best ||
      tokenIndex < best.index ||
      (tokenIndex === best.index && tokenLength > best.length)
    ) {
      best = { index: tokenIndex, length: tokenLength, slug };
    }
  }

  return best?.slug ?? null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export { TAXON_CLASS_SYNONYMS };
