"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { WorkGroupsPanel } from "@/components/dashboard/WorkGroupsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContextsData } from "@/lib/contexts/types";

type ContextsContentProps = {
  initialData: ContextsData;
};

async function fetchContexts(): Promise<ContextsData> {
  const response = await fetch("/api/contexts", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Falha ao carregar contextos");
  }

  return response.json();
}

export function ContextsContent({ initialData }: ContextsContentProps) {
  const [data, setData] = useState<ContextsData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    setError(null);

    try {
      setData(await fetchContexts());
    } catch {
      setError("Não foi possível atualizar os contextos.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      void refresh(true);
    }, 15_000);

    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div>
        <p className="text-sm text-muted-foreground">
          Contextos criados automaticamente pelo WhatsApp. Aliases unem nomes
          parecidos ao mesmo contexto.
          {isRefreshing && (
            <span className="ml-2 inline-flex items-center gap-1 text-primary">
              <Loader2 className="size-3 animate-spin" />
              Atualizando…
            </span>
          )}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {data.contexts.length}{" "}
          {data.contexts.length === 1 ? "registrado" : "registrados"}
        </span>
      </div>

      {isRefreshing && data.contexts.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <WorkGroupsPanel workGroups={data.contexts} />
      )}
    </div>
  );
}
