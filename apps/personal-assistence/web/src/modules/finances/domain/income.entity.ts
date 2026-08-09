export type FinanceIncomeSourceType = "fixed" | "variable";

export type FinanceIncomeSource = {
  id: string;
  userId: string;
  name: string;
  type: FinanceIncomeSourceType;
  expectedAmountCents: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type FinanceUserSettings = {
  userId: string;
  monthlyFixedIncomeCents: number | null;
  updatedAt: Date;
};

export type FinanceAllocation = {
  id: string;
  userId: string;
  incomeSourceId: string;
  totalAmountCents: number;
  description: string | null;
  occurredAt: Date;
  snapshot: Record<string, unknown>;
  createdAt: Date;
};

export type FinanceAllocationItem = {
  id: string;
  allocationId: string;
  boxId: string;
  amountCents: number;
  ruleSnapshot: Record<string, unknown> | null;
  createdAt: Date;
};
