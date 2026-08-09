"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2Icon } from "lucide-react";

import { searchCodexEntriesAction } from "@/modules/worldbuild/presentation/actions/codex.actions";
import type { CodexEntrySearchResult } from "@/modules/worldbuild/presentation/actions/types";
import { Input } from "@/common/components/ui/input";
import { cn } from "@/common/utils/cn";

const SEARCH_DEBOUNCE_MS = 300;

type EntrySearchComboboxProps = {
  value: string;
  onSelect: (slug: string) => void;
  placeholder?: string;
  className?: string;
  /** Quando informado, restringe a busca a esse kind. */
  kindSlug?: string;
};

/** Input de slug com busca no codex — digite para buscar por título ou slug. */
function EntrySearchCombobox({
  value,
  onSelect,
  placeholder = "buscar entrada…",
  className,
  kindSlug,
}: EntrySearchComboboxProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CodexEntrySearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza mudanças externas do slug (ex.: edge sugerida pela IA).
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setQuery(value);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function handleQueryChange(next: string) {
    setQuery(next);
    onSelect(next);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = next.trim();
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const state = await searchCodexEntriesAction(trimmed, kindSlug);
      setResults(state.entries);
      setOpen(true);
      setLoading(false);
    }, SEARCH_DEBOUNCE_MS);
  }

  function selectEntry(slug: string) {
    setQuery(slug);
    setOpen(false);
    onSelect(slug);
  }

  return (
    <div className={cn("relative flex-1", className)}>
      <Input
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        className="pr-8 font-mono text-sm"
        role="combobox"
        aria-expanded={open}
        aria-label="Slug da entrada relacionada"
      />
      {loading ? (
        <Loader2Icon className="text-muted-foreground absolute top-1/2 right-2 size-4 -translate-y-1/2 animate-spin" />
      ) : null}

      {open ? (
        <ul
          className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border p-1 shadow-md"
          role="listbox"
          onMouseDown={(event) => event.preventDefault()}
        >
          {results.length === 0 ? (
            <li className="text-muted-foreground px-2 py-1.5 text-sm">
              Nenhuma entrada encontrada.
            </li>
          ) : (
            results.map((entry) => (
              <li key={entry.slug} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="hover:bg-accent hover:text-accent-foreground flex w-full flex-col items-start gap-0.5 rounded-sm px-2 py-1.5 text-left text-sm"
                  onClick={() => selectEntry(entry.slug)}
                >
                  <span>{entry.title}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {entry.slug} · {entry.kindSlug}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export { EntrySearchCombobox };
