import type { WikiKindSummary } from "@/modules/worldbuild/domain/wiki-codex.repository";
import {
  getWikiHubGroups,
  getWikiUncategorizedKindSlugs,
} from "@/modules/worldbuild/application/wiki/wiki-kind-config";
import { WikiKindCard } from "./wiki-kind-card";
import { wikiCardGridClassName } from "./wiki-utils";

type WikiHubKindSectionsProps = {
  kindIndex: WikiKindSummary[];
};

const FALLBACK_SECTION_LABEL = "Outros";

function WikiHubKindSections({ kindIndex }: WikiHubKindSectionsProps) {
  const kindBySlug = new Map(kindIndex.map((kind) => [kind.slug, kind]));
  const availableSlugs = kindIndex.map((kind) => kind.slug);
  const sections = getWikiHubGroups({ availableSlugs });
  const uncategorizedSlugs = getWikiUncategorizedKindSlugs(availableSlugs);

  if (sections.length === 0 && uncategorizedSlugs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`wiki-hub-${section.id}`}>
          <div className="mb-4 space-y-1">
            <h2 id={`wiki-hub-${section.id}`} className="font-display text-xl">
              {section.label}
            </h2>
          </div>
          <div className={wikiCardGridClassName}>
            {section.kindSlugs.map((slug) => {
              const kind = kindBySlug.get(slug);
              if (!kind) {
                return null;
              }
              return <WikiKindCard key={slug} kind={kind} />;
            })}
          </div>
        </section>
      ))}

      {uncategorizedSlugs.length > 0 ? (
        <section aria-labelledby="wiki-hub-outros">
          <div className="mb-4 space-y-1">
            <h2 id="wiki-hub-outros" className="font-display text-xl">
              {FALLBACK_SECTION_LABEL}
            </h2>
          </div>
          <div className={wikiCardGridClassName}>
            {uncategorizedSlugs.map((slug) => {
              const kind = kindBySlug.get(slug);
              if (!kind) {
                return null;
              }
              return <WikiKindCard key={slug} kind={kind} />;
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export { WikiHubKindSections };
