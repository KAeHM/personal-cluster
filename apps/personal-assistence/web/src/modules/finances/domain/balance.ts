import type { FinanceMovementType } from "./movement.entity";

type MovementLike = {
  boxId: string;
  type: FinanceMovementType;
  amountCents: number;
  occurredAt: Date;
};

export function computeBoxBalance(
  movements: MovementLike[],
  boxId: string,
): number {
  return movements.reduce((balance, movement) => {
    if (movement.boxId !== boxId) {
      return balance;
    }

    if (movement.type === "income") {
      return balance + movement.amountCents;
    }

    return balance - movement.amountCents;
  }, 0);
}

export function computeBalancesByBox(
  movements: MovementLike[],
): Map<string, number> {
  const balances = new Map<string, number>();

  for (const movement of movements) {
    const current = balances.get(movement.boxId) ?? 0;
    const delta =
      movement.type === "income" ? movement.amountCents : -movement.amountCents;
    balances.set(movement.boxId, current + delta);
  }

  return balances;
}

export function computeProgressPercent(
  balanceCents: number,
  targetAmountCents: number | null,
): number | null {
  if (targetAmountCents === null || targetAmountCents <= 0) {
    return null;
  }

  return Math.min(100, Math.round((balanceCents / targetAmountCents) * 100));
}

export function computeMonthlyTotals(
  movements: MovementLike[],
  monthStart: Date,
  monthEnd: Date,
): { totalIncomeCents: number; totalExpenseCents: number } {
  let totalIncomeCents = 0;
  let totalExpenseCents = 0;

  for (const movement of movements) {
    if (movement.occurredAt < monthStart || movement.occurredAt >= monthEnd) {
      continue;
    }

    if (movement.type === "income") {
      totalIncomeCents += movement.amountCents;
    } else {
      totalExpenseCents += movement.amountCents;
    }
  }

  return { totalIncomeCents, totalExpenseCents };
}

export function getMonthBounds(
  reference: Date,
  timezone: string,
): { monthStart: Date; monthEnd: Date } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  });
  const parts = formatter.formatToParts(reference);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));

  return { monthStart, monthEnd };
}
