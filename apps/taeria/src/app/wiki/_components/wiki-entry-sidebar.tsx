import type { WikiEntryLayout } from "@/modules/worldbuild/application/wiki/resolve-wiki-entry-layout";
import { WikiEdgeLinks, WikiFieldRenderer } from "./fields/wiki-field-renderer";

type WikiEntrySidebarProps = {
  layout: WikiEntryLayout;
};

function WikiEntrySidebar({ layout }: WikiEntrySidebarProps) {
  const hasContent =
    layout.sidebar.length > 0 || layout.sidebarEdges.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <aside className="border-border bg-muted/20 space-y-6 rounded-xl border p-5 lg:sticky lg:top-20 lg:self-start">
      {layout.sidebar.map((field) => (
        <WikiFieldRenderer key={field.key} field={field} compact />
      ))}
      {layout.sidebarEdges.map((edge) => (
        <WikiEdgeLinks
          key={edge.edgeType}
          label={edge.label}
          targets={edge.targets}
        />
      ))}
    </aside>
  );
}

export { WikiEntrySidebar };
