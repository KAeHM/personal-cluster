import type { FinanceBoxConfig } from "@/lib/db/schema";

import {
  computeAllocationPreview,
  computeFixedIncomeCommitment,
  type AllocationPreview,
} from "../../domain/allocation-engine";
import { FINANCE_ERRORS } from "../../domain/errors";
import type { FinanceBox } from "../../domain/box.entity";
import { getAllocationRepository } from "../../infrastructure/allocation.repository.factory";
import { getBoxRepository } from "../../infrastructure/box.repository.factory";
import { getIncomeSourceRepository } from "../../infrastructure/income-source.repository.factory";
import { getUserSettingsRepository } from "../../infrastructure/user-settings.repository.factory";
import type {
  ExecuteAllocationInput,
  PreviewAllocationInput,
} from "../schemas/allocation.schema";

function toAllocationBoxes(boxes: FinanceBox[]) {
  return boxes.map((box) => ({
    id: box.id,
    name: box.name,
    priority: box.priority,
    profile: box.profile,
    config: (box.config as FinanceBoxConfig | null) ?? null,
  }));
}

async function buildAllocationContext(userId: string) {
  const boxRepo = getBoxRepository();
  const settingsRepo = getUserSettingsRepository();
  const [boxes, settings] = await Promise.all([
    boxRepo.listByUser(userId),
    settingsRepo.getByUserId(userId),
  ]);

  const allocationBoxes = toAllocationBoxes(boxes);
  const fixedIncome = computeFixedIncomeCommitment(
    allocationBoxes,
    settings?.monthlyFixedIncomeCents ?? null,
  );

  return { boxes, allocationBoxes, settings, fixedIncome };
}

export async function previewAllocation(
  userId: string,
  input: PreviewAllocationInput,
): Promise<
  AllocationPreview & {
    fixedIncomeWarning: string | null;
    fixedIncomeCommitmentPercent: number | null;
  }
> {
  const sourceRepo = getIncomeSourceRepository();
  const source = await sourceRepo.findById(userId, input.incomeSourceId);

  if (!source) {
    throw FINANCE_ERRORS.create("INCOME_SOURCE_NOT_FOUND");
  }

  const { allocationBoxes, fixedIncome } = await buildAllocationContext(userId);

  const preview = computeAllocationPreview({
    incomeAmountCents: input.amountCents,
    incomeSourceId: input.incomeSourceId,
    boxes: allocationBoxes,
  });

  return {
    ...preview,
    fixedIncomeWarning: fixedIncome.warning,
    fixedIncomeCommitmentPercent: fixedIncome.percent,
  };
}

export async function executeAllocation(
  userId: string,
  input: ExecuteAllocationInput,
) {
  const preview = await previewAllocation(userId, input);

  if (preview.lines.length === 0) {
    throw FINANCE_ERRORS.create("ALLOCATION_EMPTY");
  }

  const allocationRepo = getAllocationRepository();
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();

  const result = await allocationRepo.createWithMovements({
    userId,
    incomeSourceId: input.incomeSourceId,
    totalAmountCents: input.amountCents,
    description: input.description ?? null,
    occurredAt,
    snapshot: preview as unknown as Record<string, unknown>,
    lines: preview.lines,
  });

  return { preview, allocation: result.allocation, items: result.items };
}
