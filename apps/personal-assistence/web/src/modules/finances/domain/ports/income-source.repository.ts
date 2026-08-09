import type {
  FinanceIncomeSource,
  FinanceUserSettings,
} from "../income.entity";

export type CreateIncomeSourceInput = {
  userId: string;
  name: string;
  type?: "fixed" | "variable";
  expectedAmountCents?: number | null;
};

export type UpdateIncomeSourceInput = {
  name?: string;
  type?: "fixed" | "variable";
  expectedAmountCents?: number | null;
  isActive?: boolean;
};

export interface IncomeSourceRepository {
  findById(
    userId: string,
    sourceId: string,
  ): Promise<FinanceIncomeSource | null>;
  listByUser(
    userId: string,
    options?: { includeInactive?: boolean },
  ): Promise<FinanceIncomeSource[]>;
  create(input: CreateIncomeSourceInput): Promise<FinanceIncomeSource>;
  update(
    userId: string,
    sourceId: string,
    input: UpdateIncomeSourceInput,
  ): Promise<FinanceIncomeSource | null>;
}

export interface UserSettingsRepository {
  getByUserId(userId: string): Promise<FinanceUserSettings | null>;
  upsert(
    userId: string,
    input: { monthlyFixedIncomeCents?: number | null },
  ): Promise<FinanceUserSettings>;
}
