function kindHue(slug: string): number {
  let hash = 0;
  for (let index = 0; index < slug.length; index += 1) {
    hash = slug.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function kindGradientStyle(slug: string): { backgroundColor: string } {
  return { backgroundColor: `hsl(${kindHue(slug)} 35% 22%)` };
}

/** Grid de cards da wiki: colunas vazias colapsam (`auto-fit`). */
const wikiCardGridClassName =
  "grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))]";

export { kindHue, kindGradientStyle, wikiCardGridClassName };
