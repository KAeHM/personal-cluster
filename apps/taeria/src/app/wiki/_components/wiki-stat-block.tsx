import type { WikiLayoutField } from "@/modules/worldbuild/application/wiki/resolve-wiki-entry-layout";

const STAT_KEYS = ["nivel", "reflexo", "constituicao", "mente"] as const;

type WikiStatBlockProps = {
  fields: WikiLayoutField[];
};

function readStatValue(fields: WikiLayoutField[], key: string): string | null {
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

function WikiStatBlock({ fields }: WikiStatBlockProps) {
  const stats = STAT_KEYS.map((key) => ({
    key,
    label:
      fields.find((field) => field.key === key)?.label ??
      key.charAt(0).toUpperCase() + key.slice(1),
    value: readStatValue(fields, key),
  })).filter((stat) => stat.value !== null);

  if (stats.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Ficha resumida"
      className="border-border bg-muted/30 grid gap-4 rounded-xl border p-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {stats.map((stat) => (
        <div key={stat.key} className="space-y-1">
          <p className="text-muted-foreground text-sm">{stat.label}</p>
          <p className="font-display text-2xl font-semibold">{stat.value}</p>
        </div>
      ))}
    </section>
  );
}

export { WikiStatBlock };
