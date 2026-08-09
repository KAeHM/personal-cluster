import { FINANCE_ERRORS } from "../../domain/errors";
import { getIncomeSourceRepository } from "../../infrastructure/income-source.repository.factory";
import { getUserSettingsRepository } from "../../infrastructure/user-settings.repository.factory";
import type { UpdateIncomeSourceInput } from "../../domain/ports/income-source.repository";

export async function listIncomeSources(userId: string) {
  const repo = getIncomeSourceRepository();
  return repo.listByUser(userId);
}

export async function createIncomeSource(
  userId: string,
  input: {
    name: string;
    type?: "fixed" | "variable";
    expectedAmountCents?: number;
  },
) {
  const repo = getIncomeSourceRepository();
  return repo.create({
    userId,
    name: input.name,
    type: input.type,
    expectedAmountCents: input.expectedAmountCents ?? null,
  });
}

export async function updateIncomeSource(
  userId: string,
  sourceId: string,
  input: UpdateIncomeSourceInput,
) {
  const repo = getIncomeSourceRepository();
  const updated = await repo.update(userId, sourceId, input);

  if (!updated) {
    throw FINANCE_ERRORS.create("INCOME_SOURCE_NOT_FOUND");
  }

  return updated;
}

export async function getFinanceSettings(userId: string) {
  const [sources, settings] = await Promise.all([
    listIncomeSources(userId),
    getUserSettingsRepository().getByUserId(userId),
  ]);

  const fixedSources = sources.filter((source) => source.type === "fixed");
  const computedFixedIncomeCents = fixedSources.reduce(
    (sum, source) => sum + (source.expectedAmountCents ?? 0),
    0,
  );

  return {
    settings: settings ?? {
      userId,
      monthlyFixedIncomeCents: null,
      updatedAt: new Date(),
    },
    incomeSources: sources,
    computedFixedIncomeCents,
  };
}

export async function updateFinanceSettings(
  userId: string,
  input: { monthlyFixedIncomeCents?: number | null },
) {
  const repo = getUserSettingsRepository();
  return repo.upsert(userId, input);
}
