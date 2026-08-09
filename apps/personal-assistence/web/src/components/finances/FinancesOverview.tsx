"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { AllocateIncomeDialog } from "@/components/finances/AllocateIncomeDialog";
import { BoxCard } from "@/components/finances/BoxCard";
import { BoxFormDialog } from "@/components/finances/BoxFormDialog";
import { MovementFormDialog } from "@/components/finances/MovementFormDialog";
import { MovementsTable } from "@/components/finances/MovementsTable";
import { TransferFormDialog } from "@/components/finances/TransferFormDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCents } from "@/lib/finances/format";
import type {
  FinancesOverviewData,
  FinanceCategoryDto,
  IncomeSourceDto,
} from "@/lib/finances/types";

type FinancesOverviewProps = {
  initialData: FinancesOverviewData;
  categories: FinanceCategoryDto[];
  incomeSources: IncomeSourceDto[];
};

async function fetchOverview(): Promise<FinancesOverviewData> {
  const response = await fetch("/api/finances", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Falha ao carregar finanças");
  }

  return response.json();
}

export function FinancesOverview({
  initialData,
  categories,
  incomeSources,
}: FinancesOverviewProps) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      setData(await fetchOverview());
    } catch {
      setError("Não foi possível atualizar as finanças.");
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
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">
            Caixinhas para organizar entradas, saídas e metas.
            {isRefreshing && (
              <span className="text-primary ml-2 inline-flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Atualizando…
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AllocateIncomeDialog
            incomeSources={incomeSources}
            onSaved={() => void refresh()}
          />
          <MovementFormDialog
            type="income"
            boxes={data.boxes}
            categories={categories}
            onSaved={() => void refresh()}
          />
          <MovementFormDialog
            type="expense"
            boxes={data.boxes}
            categories={categories}
            onSaved={() => void refresh()}
          />
          <TransferFormDialog
            boxes={data.boxes}
            onSaved={() => void refresh()}
          />
          <BoxFormDialog onSaved={() => void refresh()} />
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      {data.fixedIncomeCommitment.warning && (
        <Card className="border-amber-500/40">
          <CardContent className="py-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {data.fixedIncomeCommitment.warning}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Saldo total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCents(data.totals.totalBalanceCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Entradas no mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
              {formatCents(data.totals.totalIncomeMonthCents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Saídas no mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-2xl font-semibold tabular-nums">
              {formatCents(data.totals.totalExpenseMonthCents)}
            </p>
          </CardContent>
        </Card>
      </div>

      {data.boxes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4 text-sm">
              Crie sua primeira caixinha para começar a organizar suas finanças.
            </p>
            <BoxFormDialog onSaved={() => void refresh()} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.boxes.map((box) => (
            <BoxCard key={box.id} box={box} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimentações recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isRefreshing && data.recentMovements.length === 0 ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <MovementsTable movements={data.recentMovements} showBoxName />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
