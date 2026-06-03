"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CONTEXT_NONE_ID } from "@/lib/dashboard/filters";
import type { ContextItem } from "@/lib/contexts/types";
import { cn } from "@/lib/utils";

type ContextMultiComboboxProps = {
  contexts: ContextItem[];
  value?: string[];
  onChange: (groupIds: string[] | undefined) => void;
  disabled?: boolean;
  isLoading?: boolean;
};

function labelForId(
  id: string,
  contexts: ContextItem[],
): string {
  if (id === CONTEXT_NONE_ID) return "Sem contexto";
  return contexts.find((context) => context.id === id)?.label ?? "Contexto";
}

export function ContextMultiCombobox({
  contexts,
  value = [],
  onChange,
  disabled = false,
  isLoading = false,
}: ContextMultiComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = value;

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    onChange(next.length > 0 ? next : undefined);
  };

  const clearAll = () => {
    onChange(undefined);
  };

  const triggerLabel = useMemo(() => {
    if (selected.length === 0) {
      return "Todos os contextos";
    }
    if (selected.length === 1) {
      return labelForId(selected[0], contexts);
    }
    return `${selected.length} contextos selecionados`;
  }, [contexts, selected]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            "h-auto min-h-9 w-full justify-between gap-2 px-2.5 py-1.5 font-normal",
            selected.length === 0 && "text-muted-foreground",
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {selected.length === 0 ? (
              <span className="truncate">
                {isLoading ? "Carregando…" : triggerLabel}
              </span>
            ) : selected.length <= 2 ? (
              selected.map((id) => (
                <Badge
                  key={id}
                  variant="secondary"
                  className="max-w-full truncate font-normal"
                >
                  {labelForId(id, contexts)}
                </Badge>
              ))
            ) : (
              <>
                <Badge variant="secondary" className="font-normal">
                  {selected.length} selecionados
                </Badge>
              </>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="end"
        side="left"
        sideOffset={8}
      >
        <Command>
          <CommandInput placeholder="Buscar contexto…" />
          <CommandList>
            <CommandEmpty>Nenhum contexto encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="sem-contexto"
                onSelect={() => toggle(CONTEXT_NONE_ID)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <Checkbox
                  checked={selected.includes(CONTEXT_NONE_ID)}
                  className="pointer-events-none"
                />
                Sem contexto
              </CommandItem>
              {contexts.map((context) => (
                <CommandItem
                  key={context.id}
                  value={context.label}
                  onSelect={() => toggle(context.id)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                >
                  <Checkbox
                    checked={selected.includes(context.id)}
                    className="pointer-events-none"
                  />
                  <span className="truncate">{context.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {selected.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="limpar-selecao"
                    onSelect={clearAll}
                    className="justify-center text-muted-foreground"
                  >
                    Limpar seleção
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
