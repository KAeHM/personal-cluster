import type {
  FinanceAllocation,
  FinanceAllocationItem,
} from "../income.entity";
import type { AllocationLine } from "../allocation-engine";

export type CreateAllocationInput = {
  userId: string;
  incomeSourceId: string;
  totalAmountCents: number;
  description?: string | null;
  occurredAt: Date;
  snapshot: Record<string, unknown>;
  lines: AllocationLine[];
};

export interface AllocationRepository {
  createWithMovements(input: CreateAllocationInput): Promise<{
    allocation: FinanceAllocation;
    items: FinanceAllocationItem[];
  }>;
}
