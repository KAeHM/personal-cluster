import type { WikiEntryLayout } from "@/modules/worldbuild/application/wiki/resolve-wiki-entry-layout";
import { WikiFieldRenderer } from "./fields/wiki-field-renderer";

type WikiEntryBodyProps = {
  layout: WikiEntryLayout;
  proseDominant?: boolean;
  etymologyNote?: boolean;
};

function WikiEntryBody({
  layout,
  proseDominant = false,
  etymologyNote = false,
}: WikiEntryBodyProps) {
  if (layout.body.length === 0) {
    return (
      <p className="text-muted-foreground text-center text-sm">
        Esta entrada ainda não tem texto principal na wiki.
      </p>
    );
  }

  return (
    <div
      className={proseDominant ? "wiki-prose mx-auto max-w-3xl" : "space-y-8"}
    >
      {layout.body.map((field) => (
        <WikiFieldRenderer
          key={field.key}
          field={field}
          bodyLabel={
            etymologyNote && field.key === "lore_md" ? "Etimologia" : undefined
          }
        />
      ))}
    </div>
  );
}

export { WikiEntryBody };
