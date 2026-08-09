import {
  getBoxDetailOrNull,
  getFinancesOverview,
  listBoxes,
  listCategories,
} from "@/modules/finances/application/queries";
import type { FinanceCategory } from "@/modules/finances/domain/movement.entity";

import {
  serializeBox,
  serializeMovement,
  type FinanceBoxDetailData,
  type FinancesListData,
  type FinancesOverviewData,
} from "./types";

export async function getFinancesOverviewData(
  userId: string,
  timezone: string,
): Promise<FinancesOverviewData> {
  const overview = await getFinancesOverview(userId, timezone);

  return {
    boxes: overview.boxes.map(serializeBox),
    recentMovements: overview.recentMovements.map(serializeMovement),
    totals: overview.totals,
    fixedIncomeCommitment: overview.fixedIncomeCommitment,
  };
}

export async function getFinancesListData(
  userId: string,
): Promise<FinancesListData> {
  const [boxes, categories] = await Promise.all([
    listBoxes(userId),
    listCategories(userId),
  ]);

  return {
    boxes: boxes.map(serializeBox),
    categories: categories.map((category: FinanceCategory) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      createdAt: category.createdAt.toISOString(),
    })),
  };
}

export async function getFinanceBoxDetailData(
  userId: string,
  boxId: string,
): Promise<FinanceBoxDetailData | null> {
  const detail = await getBoxDetailOrNull(userId, boxId);

  if (!detail) {
    return null;
  }

  return {
    box: serializeBox(detail.box),
    movements: detail.movements.map(serializeMovement),
  };
}
