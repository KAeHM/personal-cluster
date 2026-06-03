"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ContextMultiCombobox } from "@/components/dashboard/ContextMultiCombobox";
import { DashboardDateRangePicker } from "@/components/dashboard/DashboardDateRangePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  buildDashboardHref,
  countActiveDashboardFilters,
  normalizeFiltersForApply,
  parseDashboardFilters,
} from "@/lib/dashboard/filters";
import type { DashboardFilters } from "@/lib/dashboard/types";
import type { ContextItem } from "@/lib/contexts/types";

type DashboardFiltersPanelProps = {
  timezone: string;
};

export function DashboardFiltersPanel({ timezone }: DashboardFiltersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const applied = parseDashboardFilters(searchParams);

  const [draft, setDraft] = useState<DashboardFilters>(applied);
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [isLoadingContexts, setIsLoadingContexts] = useState(true);

  useEffect(() => {
    setDraft(parseDashboardFilters(searchParams));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadContexts() {
      setIsLoadingContexts(true);
      try {
        const response = await fetch("/api/contexts", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { contexts: ContextItem[] };
        if (!cancelled) setContexts(data.contexts);
      } finally {
        if (!cancelled) setIsLoadingContexts(false);
      }
    }

    void loadContexts();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyFilters = useCallback(
    (next: DashboardFilters) => {
      router.replace(buildDashboardHref(pathname, next), { scroll: false });
    },
    [pathname, router],
  );

  const handleApply = () => {
    if (draft.period === "custom") {
      if (!draft.from || !draft.to) return;
      if (draft.from > draft.to) return;
    }
    applyFilters(normalizeFiltersForApply(draft));
  };

  const handleReset = () => {
    const defaults: DashboardFilters = { period: "today" };
    setDraft(defaults);
    applyFilters(defaults);
  };

  const activeCount = countActiveDashboardFilters(applied);
  const draftActiveCount = countActiveDashboardFilters(draft);
  const hasPendingChanges =
    JSON.stringify(draft) !== JSON.stringify(applied);

  return (
    <div className="space-y-6 text-sm">
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Período
          </p>
          <p className="text-xs text-muted-foreground">
            Fuso: {timezone.replaceAll("_", " ")}
          </p>
        </div>

        <DashboardDateRangePicker
          timezone={timezone}
          value={draft}
          onChange={(patch) =>
            setDraft((current) => ({ ...current, ...patch }))
          }
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Contextos
        </p>
        <ContextMultiCombobox
          contexts={contexts}
          value={draft.groupIds}
          onChange={(groupIds) =>
            setDraft((current) => ({ ...current, groupIds }))
          }
          disabled={isLoadingContexts}
          isLoading={isLoadingContexts}
        />
        <p className="text-xs text-muted-foreground">
          Selecione um ou mais contextos. Deixe vazio para exibir todos.
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Descrição
        </p>
        <Input
          type="search"
          placeholder="Buscar por descrição…"
          value={draft.search ?? ""}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              search: event.target.value || undefined,
            }))
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleApply();
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          Busca parcial, sem diferenciar maiúsculas e minúsculas.
        </p>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleApply}
          disabled={
            !hasPendingChanges ||
            (draft.period === "custom" && (!draft.from || !draft.to))
          }
        >
          Aplicar filtros
          {draftActiveCount > 0 && ` (${draftActiveCount})`}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={
            activeCount === 0 &&
            applied.period === "today" &&
            !applied.search
          }
        >
          Limpar filtros
        </Button>
      </div>

      {activeCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {activeCount}{" "}
          {activeCount === 1 ? "filtro ativo" : "filtros ativos"} na listagem.
        </p>
      )}
    </div>
  );
}
