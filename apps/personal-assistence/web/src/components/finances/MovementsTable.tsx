"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents } from "@/lib/finances/format";
import type { FinanceMovementDto } from "@/lib/finances/types";
import { cn } from "@/lib/utils";

type MovementsTableProps = {
  movements: FinanceMovementDto[];
  showBoxName?: boolean;
};

function formatMovementDescription(movement: FinanceMovementDto): string {
  if (movement.transferId) {
    if (movement.type === "expense" && movement.transferToBoxName) {
      return `Transferência para ${movement.transferToBoxName}`;
    }

    if (movement.type === "income" && movement.transferFromBoxName) {
      return `Transferência de ${movement.transferFromBoxName}`;
    }

    return "Transferência";
  }

  return movement.description ?? "—";
}

export function MovementsTable({
  movements,
  showBoxName = false,
}: MovementsTableProps) {
  if (movements.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhuma movimentação registrada.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          {showBoxName && <TableHead>Caixinha</TableHead>}
          <TableHead>Descrição</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((movement) => (
          <TableRow key={movement.id}>
            <TableCell className="whitespace-nowrap">
              {new Date(movement.occurredAt).toLocaleDateString("pt-BR")}
            </TableCell>
            {showBoxName && <TableCell>{movement.boxName}</TableCell>}
            <TableCell>{formatMovementDescription(movement)}</TableCell>
            <TableCell>{movement.categoryName ?? "—"}</TableCell>
            <TableCell
              className={cn(
                "text-right font-medium tabular-nums",
                movement.type === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive",
              )}
            >
              {movement.type === "income" ? "+" : "-"}
              {formatCents(movement.amountCents)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
