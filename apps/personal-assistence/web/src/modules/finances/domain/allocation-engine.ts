import type { FinanceBoxConfig } from "@/lib/db/schema";

export type BoxAllocationRule = NonNullable<
  FinanceBoxConfig["allocationRules"]
>[number];

export type AllocationBoxInput = {
  id: string;
  name: string;
  priority: number;
  profile: string;
  config: FinanceBoxConfig | null;
};

export type AllocationLine = {
  boxId: string;
  boxName: string;
  amountCents: number;
  ruleId: string | null;
  ruleType: string;
  reason: string;
};

export type AllocationPreview = {
  incomeAmountCents: number;
  incomeSourceId: string;
  eligibleIncomeAmountCents: number;
  lines: AllocationLine[];
  allocatedTotalCents: number;
  remainderCents: number;
  warnings: string[];
};

export type ComputeAllocationInput = {
  incomeAmountCents: number;
  incomeSourceId: string;
  boxes: AllocationBoxInput[];
};

function isSourceEligibleForBox(
  config: FinanceBoxConfig | null,
  incomeSourceId: string,
): boolean {
  const eligibleSourceIds = config?.eligibleSourceIds;

  if (!eligibleSourceIds || eligibleSourceIds.length === 0) {
    return true;
  }

  return eligibleSourceIds.includes(incomeSourceId);
}

function evaluateCondition(
  condition: NonNullable<BoxAllocationRule["condition"]>,
  incomeAmountCents: number,
  eligibleIncomeAmountCents: number,
): boolean {
  const fieldValue =
    condition.field === "eligible_income_amount"
      ? eligibleIncomeAmountCents
      : incomeAmountCents;

  if (condition.operator === ">") {
    return fieldValue > condition.valueCents;
  }

  return fieldValue >= condition.valueCents;
}

function computeRuleAmount(
  rule: BoxAllocationRule,
  incomeAmountCents: number,
  eligibleIncomeAmountCents: number,
): number {
  if (rule.type === "fixed_amount") {
    return rule.fixedAmountCents ?? 0;
  }

  if (rule.type === "percent_conditional" && rule.condition) {
    if (
      !evaluateCondition(
        rule.condition,
        incomeAmountCents,
        eligibleIncomeAmountCents,
      )
    ) {
      return 0;
    }
  }

  const percent = rule.percent ?? 0;
  const base =
    rule.condition?.field === "eligible_income_amount"
      ? eligibleIncomeAmountCents
      : incomeAmountCents;

  return Math.round((base * percent) / 100);
}

export function computeAllocationPreview(
  input: ComputeAllocationInput,
): AllocationPreview {
  const { incomeAmountCents, incomeSourceId, boxes } = input;
  const warnings: string[] = [];
  const lines: AllocationLine[] = [];
  let allocatedTotalCents = 0;

  const sortedBoxes = [...boxes]
    .filter(
      (box) =>
        box.config?.allocationRules?.length || box.config?.receiveRemainder,
    )
    .sort((a, b) => b.priority - a.priority);

  for (const box of sortedBoxes) {
    const config = box.config;
    if (!config) {
      continue;
    }

    const eligible = isSourceEligibleForBox(config, incomeSourceId);
    const eligibleIncomeAmountCents = eligible ? incomeAmountCents : 0;

    for (const rule of config.allocationRules ?? []) {
      const amountCents = eligible
        ? computeRuleAmount(rule, incomeAmountCents, eligibleIncomeAmountCents)
        : 0;

      if (amountCents <= 0) {
        continue;
      }

      lines.push({
        boxId: box.id,
        boxName: box.name,
        amountCents,
        ruleId: rule.id,
        ruleType: rule.type,
        reason: describeRule(rule),
      });
      allocatedTotalCents += amountCents;
    }
  }

  const remainderBox = sortedBoxes.find((box) => box.config?.receiveRemainder);

  if (remainderBox) {
    const remainderCents = Math.max(0, incomeAmountCents - allocatedTotalCents);

    if (remainderCents > 0) {
      lines.push({
        boxId: remainderBox.id,
        boxName: remainderBox.name,
        amountCents: remainderCents,
        ruleId: null,
        ruleType: "remainder",
        reason: "Resíduo após alocações",
      });
      allocatedTotalCents += remainderCents;
    }
  }

  const remainderCents = incomeAmountCents - allocatedTotalCents;

  if (allocatedTotalCents > incomeAmountCents) {
    warnings.push(
      `Alocações (${formatCentsShort(allocatedTotalCents)}) excedem a renda recebida (${formatCentsShort(incomeAmountCents)}).`,
    );
  }

  if (remainderCents > 0 && !remainderBox) {
    warnings.push(
      `Sobram ${formatCentsShort(remainderCents)} sem caixinha de resíduo configurada.`,
    );
  }

  const globalEligible = boxes.some((box) =>
    isSourceEligibleForBox(box.config, incomeSourceId),
  )
    ? incomeAmountCents
    : 0;

  return {
    incomeAmountCents,
    incomeSourceId,
    eligibleIncomeAmountCents: globalEligible,
    lines,
    allocatedTotalCents,
    remainderCents,
    warnings,
  };
}

function describeRule(rule: BoxAllocationRule): string {
  if (rule.type === "fixed_amount") {
    return `Valor fixo`;
  }

  if (rule.type === "percent_conditional") {
    return `${rule.percent}% (condicional)`;
  }

  return `${rule.percent}%`;
}

function formatCentsShort(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function computeFixedIncomeCommitment(
  boxes: AllocationBoxInput[],
  monthlyFixedIncomeCents: number | null,
): { committedCents: number; percent: number | null; warning: string | null } {
  if (!monthlyFixedIncomeCents || monthlyFixedIncomeCents <= 0) {
    return { committedCents: 0, percent: null, warning: null };
  }

  let committedCents = 0;

  for (const box of boxes) {
    for (const rule of box.config?.allocationRules ?? []) {
      if (rule.type === "fixed_amount") {
        committedCents += rule.fixedAmountCents ?? 0;
      } else if (
        rule.type === "percent" ||
        rule.type === "percent_conditional"
      ) {
        committedCents += Math.round(
          (monthlyFixedIncomeCents * (rule.percent ?? 0)) / 100,
        );
      }
    }
  }

  const percent = Math.round((committedCents / monthlyFixedIncomeCents) * 100);

  const warning =
    committedCents > monthlyFixedIncomeCents
      ? `Compromissos (${formatCentsShort(committedCents)}) excedem sua renda fixa (${formatCentsShort(monthlyFixedIncomeCents)}).`
      : null;

  return { committedCents, percent, warning };
}
