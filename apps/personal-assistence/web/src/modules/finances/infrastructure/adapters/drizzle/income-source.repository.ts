import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { financeIncomeSources } from "@/lib/db/schema";

import type { FinanceIncomeSource } from "../../../domain/income.entity";
import type {
  CreateIncomeSourceInput,
  IncomeSourceRepository,
  UpdateIncomeSourceInput,
} from "../../../domain/ports/income-source.repository";

function toDomain(
  row: typeof financeIncomeSources.$inferSelect,
): FinanceIncomeSource {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    type: row.type,
    expectedAmountCents: row.expectedAmountCents,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleIncomeSourceRepository implements IncomeSourceRepository {
  async findById(
    userId: string,
    sourceId: string,
  ): Promise<FinanceIncomeSource | null> {
    const [row] = await getDb()
      .select()
      .from(financeIncomeSources)
      .where(
        and(
          eq(financeIncomeSources.id, sourceId),
          eq(financeIncomeSources.userId, userId),
        ),
      )
      .limit(1);

    return row ? toDomain(row) : null;
  }

  async listByUser(
    userId: string,
    options?: { includeInactive?: boolean },
  ): Promise<FinanceIncomeSource[]> {
    const conditions = [eq(financeIncomeSources.userId, userId)];

    if (!options?.includeInactive) {
      conditions.push(eq(financeIncomeSources.isActive, true));
    }

    const rows = await getDb()
      .select()
      .from(financeIncomeSources)
      .where(and(...conditions))
      .orderBy(desc(financeIncomeSources.type), asc(financeIncomeSources.name));

    return rows.map(toDomain);
  }

  async create(input: CreateIncomeSourceInput): Promise<FinanceIncomeSource> {
    const [row] = await getDb()
      .insert(financeIncomeSources)
      .values({
        userId: input.userId,
        name: input.name,
        type: input.type ?? "variable",
        expectedAmountCents: input.expectedAmountCents ?? null,
      })
      .returning();

    return toDomain(row);
  }

  async update(
    userId: string,
    sourceId: string,
    input: UpdateIncomeSourceInput,
  ): Promise<FinanceIncomeSource | null> {
    const [row] = await getDb()
      .update(financeIncomeSources)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(financeIncomeSources.id, sourceId),
          eq(financeIncomeSources.userId, userId),
        ),
      )
      .returning();

    return row ? toDomain(row) : null;
  }
}

export const drizzleIncomeSourceRepository =
  new DrizzleIncomeSourceRepository();
