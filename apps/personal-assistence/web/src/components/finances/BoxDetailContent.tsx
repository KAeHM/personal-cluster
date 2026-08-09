"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { BoxFormDialog } from "@/components/finances/BoxFormDialog";
import { MovementFormDialog } from "@/components/finances/MovementFormDialog";
import { MovementsTable } from "@/components/finances/MovementsTable";
import { TransferFormDialog } from "@/components/finances/TransferFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/finances/format";
import { BOX_PROFILE_LABELS } from "@/lib/finances/labels";
import type {
  FinanceBoxDetailData,
  FinanceBoxDto,
  FinanceCategoryDto,
} from "@/lib/finances/types";
import { cn } from "@/lib/utils";

type BoxDetailContentProps = {
  initialData: FinanceBoxDetailData;
  allBoxes: FinanceBoxDto[];
  categories: FinanceCategoryDto[];
};

async function fetchBoxDetail(boxId: string): Promise<FinanceBoxDetailData> {
  const response = await fetch(`/api/finances/boxes/${boxId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Falha ao carregar caixinha");
  }

  return response.json();
}

export function BoxDetailContent({
  initialData,
  allBoxes,
  categories,
}: BoxDetailContentProps) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      setData(await fetchBoxDetail(data.box.id));
    } catch {
      setError("Não foi possível atualizar a caixinha.");
    } finally {
      setIsRefreshing(false);
    }
  }, [data.box.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refresh();
    }, 15_000);

    return () => clearInterval(interval);
  }, [refresh]);

  const { box } = data;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/finances">
            <ArrowLeft className="size-4" />
            Finanças
          </Link>
        </Button>
        {isRefreshing && (
          <span className="text-primary inline-flex items-center gap-1 text-xs">
            <Loader2 className="size-3 animate-spin" />
            Atualizando…
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{box.name}</h1>
            <Badge variant="secondary">{BOX_PROFILE_LABELS[box.profile]}</Badge>
            {!box.isActive && <Badge variant="outline">Inativa</Badge>}
          </div>
          {box.description && (
            <p className="text-muted-foreground text-sm">{box.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <MovementFormDialog
            type="income"
            boxes={allBoxes}
            categories={categories}
            defaultBoxId={box.id}
            onSaved={() => void refresh()}
          />
          <MovementFormDialog
            type="expense"
            boxes={allBoxes}
            categories={categories}
            defaultBoxId={box.id}
            onSaved={() => void refresh()}
          />
          <TransferFormDialog
            boxes={allBoxes}
            defaultFromBoxId={box.id}
            onSaved={() => void refresh()}
          />
          <BoxFormDialog
            box={box}
            onSaved={() => void refresh()}
            trigger={<Button variant="outline">Editar</Button>}
          />
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saldo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p
            className={cn(
              "text-3xl font-semibold tabular-nums",
              box.isNegative && "text-destructive",
            )}
          >
            {formatCents(box.balanceCents)}
          </p>
          {box.targetAmountCents !== null && (
            <p className="text-muted-foreground text-sm">
              Meta: {formatCents(box.targetAmountCents)}
              {box.progressPercent !== null && ` (${box.progressPercent}%)`}
            </p>
          )}
          {box.isNegative && (
            <p className="text-destructive text-sm">
              Atenção: saldo negativo nesta caixinha.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <MovementsTable movements={data.movements} />
        </CardContent>
      </Card>
    </div>
  );
}
