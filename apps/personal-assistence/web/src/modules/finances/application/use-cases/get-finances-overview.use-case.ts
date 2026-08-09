import type { FinanceBoxConfig } from "@/lib/db/schema";

import { computeMonthlyTotals, getMonthBounds } from "../../domain/balance";
import { computeFixedIncomeCommitment } from "../../domain/allocation-engine";
import { getMovementRepository } from "../../infrastructure/movement.repository.factory";
import { getUserSettingsRepository } from "../../infrastructure/user-settings.repository.factory";
import { listBoxes } from "./list-boxes.use-case";

export async function getFinancesOverview(userId: string, timezone: string) {
  const [boxes, movementRepo, settings] = await Promise.all([
    listBoxes(userId),
    Promise.resolve(getMovementRepository()),
    getUserSettingsRepository().getByUserId(userId),
  ]);

  const recentMovements = await movementRepo.listRecent(userId, 10);
  const allMovements = await movementRepo.listAllForUser(userId);

  const { monthStart, monthEnd } = getMonthBounds(new Date(), timezone);
  const { totalIncomeCents, totalExpenseCents } = computeMonthlyTotals(
    allMovements,
    monthStart,
    monthEnd,
  );

  const totalBalanceCents = boxes.reduce(
    (sum, box) => sum + box.balanceCents,
    0,
  );

  const allocationBoxes = boxes.map((box) => ({
    id: box.id,
    name: box.name,
    priority: box.priority,
    profile: box.profile,
    config: (box.config as FinanceBoxConfig | null) ?? null,
  }));

  const fixedIncome = computeFixedIncomeCommitment(
    allocationBoxes,
    settings?.monthlyFixedIncomeCents ?? null,
  );

  return {
    boxes,
    recentMovements,
    totals: {
      totalBalanceCents,
      totalIncomeMonthCents: totalIncomeCents,
      totalExpenseMonthCents: totalExpenseCents,
    },
    fixedIncomeCommitment: {
      committedCents: fixedIncome.committedCents,
      percent: fixedIncome.percent,
      warning: fixedIncome.warning,
      monthlyFixedIncomeCents: settings?.monthlyFixedIncomeCents ?? null,
    },
  };
}
