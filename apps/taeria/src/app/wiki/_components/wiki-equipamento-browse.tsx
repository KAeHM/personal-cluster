"use client";

import { useMemo, useState } from "react";

import type { CodexEntrySummary } from "@/modules/worldbuild/domain/codex-entry";
import { Badge } from "@/common/components/ui/badge";
import type { EntryCardMeta } from "./load-entry-card-meta";
import { WikiEntryGrid } from "./wiki-entry-grid";

type WikiEquipamentoBrowseProps = {
  entries: CodexEntrySummary[];
  cardMetaMap: Map<string, EntryCardMeta>;
  kindNameBySlug: Map<string, string>;
};

function WikiEquipamentoBrowse({
  entries,
  cardMetaMap,
  kindNameBySlug,
}: WikiEquipamentoBrowseProps) {
  const slots = useMemo(() => {
    const values = new Set<string>();
    for (const entry of entries) {
      const slot = cardMetaMap.get(entry.id)?.systemPreview?.slot;
      if (slot) {
        values.add(slot);
      }
    }
    return [...values].sort((left, right) =>
      left.localeCompare(right, "pt-BR"),
    );
  }, [entries, cardMetaMap]);

  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    if (!activeSlot) {
      return entries;
    }
    return entries.filter(
      (entry) => cardMetaMap.get(entry.id)?.systemPreview?.slot === activeSlot,
    );
  }, [activeSlot, entries, cardMetaMap]);

  return (
    <div className="space-y-4">
      {slots.length > 0 ? (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar por slot"
        >
          <button
            type="button"
            onClick={() => setActiveSlot(null)}
            className="focus-visible:ring-ring rounded-md outline-none focus-visible:ring-2"
          >
            <Badge variant={activeSlot === null ? "default" : "outline"}>
              Todos
            </Badge>
          </button>
          {slots.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setActiveSlot(slot)}
              className="focus-visible:ring-ring rounded-md outline-none focus-visible:ring-2"
            >
              <Badge variant={activeSlot === slot ? "default" : "outline"}>
                {slot}
              </Badge>
            </button>
          ))}
        </div>
      ) : null}

      <WikiEntryGrid
        entries={filteredEntries}
        cardMetaMap={cardMetaMap}
        kindNameBySlug={kindNameBySlug}
      />
    </div>
  );
}

export { WikiEquipamentoBrowse };
