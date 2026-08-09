import { getDb } from "@/lib/db";
import {
  financeAllocationItems,
  financeAllocations,
  financeMovements,
} from "@/lib/db/schema";

import type {
  FinanceAllocation,
  FinanceAllocationItem,
} from "../../../domain/income.entity";
import type {
  AllocationRepository,
  CreateAllocationInput,
} from "../../../domain/ports/allocation.repository";

function toAllocation(
  row: typeof financeAllocations.$inferSelect,
): FinanceAllocation {
  return {
    id: row.id,
    userId: row.userId,
    incomeSourceId: row.incomeSourceId,
    totalAmountCents: row.totalAmountCents,
    description: row.description,
    occurredAt: row.occurredAt,
    snapshot: row.snapshot,
    createdAt: row.createdAt,
  };
}

function toItem(
  row: typeof financeAllocationItems.$inferSelect,
): FinanceAllocationItem {
  return {
    id: row.id,
    allocationId: row.allocationId,
    boxId: row.boxId,
    amountCents: row.amountCents,
    ruleSnapshot: row.ruleSnapshot,
    createdAt: row.createdAt,
  };
}

export class DrizzleAllocationRepository implements AllocationRepository {
  async createWithMovements(input: CreateAllocationInput): Promise<{
    allocation: FinanceAllocation;
    items: FinanceAllocationItem[];
  }> {
    return getDb().transaction(async (tx) => {
      const [allocationRow] = await tx
        .insert(financeAllocations)
        .values({
          userId: input.userId,
          incomeSourceId: input.incomeSourceId,
          totalAmountCents: input.totalAmountCents,
          description: input.description ?? null,
          occurredAt: input.occurredAt,
          snapshot: input.snapshot,
        })
        .returning();

      const allocation = toAllocation(allocationRow);
      const items: FinanceAllocationItem[] = [];

      for (const line of input.lines) {
        if (line.amountCents <= 0) {
          continue;
        }

        const [itemRow] = await tx
          .insert(financeAllocationItems)
          .values({
            allocationId: allocation.id,
            boxId: line.boxId,
            amountCents: line.amountCents,
            ruleSnapshot: {
              ruleId: line.ruleId,
              ruleType: line.ruleType,
              reason: line.reason,
            },
          })
          .returning();

        items.push(toItem(itemRow));

        await tx.insert(financeMovements).values({
          userId: input.userId,
          boxId: line.boxId,
          type: "income",
          amountCents: line.amountCents,
          allocationId: allocation.id,
          incomeSourceId: input.incomeSourceId,
          description:
            input.description ??
            `Alocação automática${line.reason ? `: ${line.reason}` : ""}`,
          occurredAt: input.occurredAt,
        });
      }

      return { allocation, items };
    });
  }
}

export const drizzleAllocationRepository = new DrizzleAllocationRepository();
