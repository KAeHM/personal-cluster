import type { FinanceBoxProfile } from "@/modules/finances/domain/box.entity";
import type { FinanceMovementWithMeta } from "@/modules/finances/domain/movement.entity";
import type { FinanceBoxConfig } from "@/lib/db/schema";

export type FinanceBoxDto = {
  id: string;
  name: string;
  description: string | null;
  profile: FinanceBoxProfile;
  targetAmountCents: number | null;
  priority: number;
  color: string | null;
  icon: string | null;
  config: FinanceBoxConfig | null;
  isActive: boolean;
  balanceCents: number;
  progressPercent: number | null;
  isNegative: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinanceMovementDto = {
  id: string;
  boxId: string;
  boxName: string;
  type: "income" | "expense";
  amountCents: number;
  transferId: string | null;
  categoryId: string | null;
  categoryName: string | null;
  description: string | null;
  occurredAt: string;
  createdAt: string;
  transferFromBoxName: string | null;
  transferToBoxName: string | null;
};

export type FinanceCategoryDto = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
};

export type FinancesOverviewData = {
  boxes: FinanceBoxDto[];
  recentMovements: FinanceMovementDto[];
  totals: {
    totalBalanceCents: number;
    totalIncomeMonthCents: number;
    totalExpenseMonthCents: number;
  };
  fixedIncomeCommitment: {
    committedCents: number;
    percent: number | null;
    warning: string | null;
    monthlyFixedIncomeCents: number | null;
  };
};

export type IncomeSourceDto = {
  id: string;
  name: string;
  type: "fixed" | "variable";
  expectedAmountCents: number | null;
  isActive: boolean;
};

export type AllocationLineDto = {
  boxId: string;
  boxName: string;
  amountCents: number;
  ruleId: string | null;
  ruleType: string;
  reason: string;
};

export type AllocationPreviewDto = {
  incomeAmountCents: number;
  incomeSourceId: string;
  eligibleIncomeAmountCents: number;
  lines: AllocationLineDto[];
  allocatedTotalCents: number;
  remainderCents: number;
  warnings: string[];
  fixedIncomeWarning: string | null;
  fixedIncomeCommitmentPercent: number | null;
};

export type FinanceBoxDetailData = {
  box: FinanceBoxDto;
  movements: FinanceMovementDto[];
};

export type FinancesListData = {
  boxes: FinanceBoxDto[];
  categories: FinanceCategoryDto[];
};

function serializeBox(
  box:
    | FinanceBoxDto
    | {
        id: string;
        name: string;
        description: string | null;
        profile: FinanceBoxProfile;
        targetAmountCents: number | null;
        priority: number;
        color: string | null;
        icon: string | null;
        config: FinanceBoxConfig | null;
        isActive: boolean;
        balanceCents: number;
        progressPercent: number | null;
        isNegative: boolean;
        createdAt: Date;
        updatedAt: Date;
      },
): FinanceBoxDto {
  return {
    id: box.id,
    name: box.name,
    description: box.description,
    profile: box.profile,
    targetAmountCents: box.targetAmountCents,
    priority: box.priority,
    color: box.color,
    icon: box.icon,
    config: box.config ?? null,
    isActive: box.isActive,
    balanceCents: box.balanceCents,
    progressPercent: box.progressPercent,
    isNegative: box.isNegative,
    createdAt:
      box.createdAt instanceof Date
        ? box.createdAt.toISOString()
        : box.createdAt,
    updatedAt:
      box.updatedAt instanceof Date
        ? box.updatedAt.toISOString()
        : box.updatedAt,
  };
}

export function serializeMovement(
  movement: FinanceMovementWithMeta,
): FinanceMovementDto {
  return {
    id: movement.id,
    boxId: movement.boxId,
    boxName: movement.boxName,
    type: movement.type,
    amountCents: movement.amountCents,
    transferId: movement.transferId,
    categoryId: movement.categoryId,
    categoryName: movement.categoryName,
    description: movement.description,
    occurredAt: movement.occurredAt.toISOString(),
    createdAt: movement.createdAt.toISOString(),
    transferFromBoxName: movement.transferFromBoxName,
    transferToBoxName: movement.transferToBoxName,
  };
}

export { serializeBox };
