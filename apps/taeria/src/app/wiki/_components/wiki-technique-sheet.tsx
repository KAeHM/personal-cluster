import Link from "next/link";

import type { WikiLayoutField } from "@/modules/worldbuild/application/wiki/resolve-wiki-entry-layout";
import type { WikiTaxonomyEdgeTarget } from "@/modules/worldbuild/domain/wiki-codex.repository";

const HIGHLIGHT_KEYS = ["intencao", "alvo", "nivel"] as const;

type WikiTechniqueSheetProps = {
  fields: WikiLayoutField[];
  derivedTechniques?: WikiTaxonomyEdgeTarget[];
};

function readField(fields: WikiLayoutField[], key: string): string | null {
  const field = fields.find((item) => item.key === key);
  if (
    field?.value === undefined ||
    field.value === null ||
    field.value === ""
  ) {
    return null;
  }
  return String(field.value);
}

function WikiTechniqueSheet({
  fields,
  derivedTechniques = [],
}: WikiTechniqueSheetProps) {
  const highlights = HIGHLIGHT_KEYS.map((key) => ({
    key,
    label:
      fields.find((field) => field.key === key)?.label ??
      key.charAt(0).toUpperCase() + key.slice(1),
    value: readField(fields, key),
  })).filter((item) => item.value !== null);

  if (highlights.length === 0 && derivedTechniques.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Resumo da técnica"
      className="border-border bg-muted/30 space-y-5 rounded-xl border p-5"
    >
      {highlights.length > 0 ? (
        <dl className="grid gap-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.key} className="space-y-1">
              <dt className="text-muted-foreground text-sm">{item.label}</dt>
              <dd className="text-base font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {derivedTechniques.length > 0 ? (
        <div className="space-y-2 border-t pt-4">
          <p className="text-muted-foreground text-sm font-medium">
            Técnicas derivadas
          </p>
          <ul className="flex flex-wrap gap-2">
            {derivedTechniques.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/wiki/${child.slug}`}
                  className="bg-background hover:bg-accent inline-flex rounded-md border px-3 py-1.5 text-sm transition-colors"
                >
                  {child.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export { WikiTechniqueSheet };
