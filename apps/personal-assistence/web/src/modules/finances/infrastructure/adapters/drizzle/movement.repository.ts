import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "@/lib/db";
import {
  financeBoxes,
  financeCategories,
  financeMovements,
  financeTransfers,
} from "@/lib/db/schema";

import type {
  FinanceMovement,
  FinanceMovementWithMeta,
  FinanceTransfer,
} from "../../../domain/movement.entity";
import type {
  CreateMovementInput,
  CreateTransferInput,
  ListMovementsOptions,
  MovementRepository,
} from "../../../domain/ports/movement.repository";

const fromBox = alias(financeBoxes, "from_box");
const toBox = alias(financeBoxes, "to_box");

function toMovement(
  row: typeof financeMovements.$inferSelect,
): FinanceMovement {
  return {
    id: row.id,
    userId: row.userId,
    boxId: row.boxId,
    type: row.type,
    amountCents: row.amountCents,
    transferId: row.transferId,
    categoryId: row.categoryId,
    description: row.description,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

function toTransfer(
  row: typeof financeTransfers.$inferSelect,
): FinanceTransfer {
  return {
    id: row.id,
    userId: row.userId,
    fromBoxId: row.fromBoxId,
    toBoxId: row.toBoxId,
    amountCents: row.amountCents,
    description: row.description,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

function mapMovementRow(row: {
  movement: typeof financeMovements.$inferSelect;
  boxName: string;
  categoryName: string | null;
  transferFromBoxName: string | null;
  transferToBoxName: string | null;
}): FinanceMovementWithMeta {
  return {
    ...toMovement(row.movement),
    boxName: row.boxName,
    categoryName: row.categoryName,
    transferFromBoxName: row.transferFromBoxName,
    transferToBoxName: row.transferToBoxName,
  };
}

async function queryMovementsWithMeta(
  whereClause: ReturnType<typeof and>,
  options?: { limit?: number; offset?: number },
) {
  let query = getDb()
    .select({
      movement: financeMovements,
      boxName: financeBoxes.name,
      categoryName: financeCategories.name,
      transferFromBoxName: fromBox.name,
      transferToBoxName: toBox.name,
    })
    .from(financeMovements)
    .innerJoin(financeBoxes, eq(financeMovements.boxId, financeBoxes.id))
    .leftJoin(
      financeCategories,
      eq(financeMovements.categoryId, financeCategories.id),
    )
    .leftJoin(
      financeTransfers,
      eq(financeMovements.transferId, financeTransfers.id),
    )
    .leftJoin(fromBox, eq(financeTransfers.fromBoxId, fromBox.id))
    .leftJoin(toBox, eq(financeTransfers.toBoxId, toBox.id))
    .where(whereClause)
    .orderBy(
      desc(financeMovements.occurredAt),
      desc(financeMovements.createdAt),
    );

  if (options?.limit !== undefined) {
    query = query.limit(options.limit) as typeof query;
  }

  if (options?.offset !== undefined) {
    query = query.offset(options.offset) as typeof query;
  }

  const rows = await query;
  return rows.map(mapMovementRow);
}

export class DrizzleMovementRepository implements MovementRepository {
  async findById(
    userId: string,
    movementId: string,
  ): Promise<FinanceMovement | null> {
    const row = await getDb().query.financeMovements.findFirst({
      where: and(
        eq(financeMovements.id, movementId),
        eq(financeMovements.userId, userId),
      ),
    });

    return row ? toMovement(row) : null;
  }

  async listByBox(
    userId: string,
    boxId: string,
    options?: ListMovementsOptions,
  ): Promise<FinanceMovementWithMeta[]> {
    const conditions = [
      eq(financeMovements.userId, userId),
      eq(financeMovements.boxId, boxId),
    ];

    if (options?.from) {
      conditions.push(gte(financeMovements.occurredAt, options.from));
    }

    if (options?.to) {
      conditions.push(lte(financeMovements.occurredAt, options.to));
    }

    return queryMovementsWithMeta(and(...conditions), {
      limit: options?.limit ?? 100,
      offset: options?.offset,
    });
  }

  async listRecent(
    userId: string,
    limit: number,
  ): Promise<FinanceMovementWithMeta[]> {
    return queryMovementsWithMeta(eq(financeMovements.userId, userId), {
      limit,
    });
  }

  async listAllForUser(userId: string): Promise<FinanceMovement[]> {
    const rows = await getDb()
      .select()
      .from(financeMovements)
      .where(eq(financeMovements.userId, userId));

    return rows.map(toMovement);
  }

  async create(input: CreateMovementInput): Promise<FinanceMovement> {
    const [row] = await getDb()
      .insert(financeMovements)
      .values({
        userId: input.userId,
        boxId: input.boxId,
        type: input.type,
        amountCents: input.amountCents,
        categoryId: input.categoryId ?? null,
        description: input.description ?? null,
        occurredAt: input.occurredAt,
        transferId: input.transferId ?? null,
      })
      .returning();

    return toMovement(row);
  }

  async createTransfer(input: CreateTransferInput): Promise<{
    transfer: FinanceTransfer;
    fromMovement: FinanceMovement;
    toMovement: FinanceMovement;
  }> {
    return getDb().transaction(async (tx) => {
      const [transferRow] = await tx
        .insert(financeTransfers)
        .values({
          userId: input.userId,
          fromBoxId: input.fromBoxId,
          toBoxId: input.toBoxId,
          amountCents: input.amountCents,
          description: input.description ?? null,
          occurredAt: input.occurredAt,
        })
        .returning();

      const transfer = toTransfer(transferRow);

      const [fromMovementRow] = await tx
        .insert(financeMovements)
        .values({
          userId: input.userId,
          boxId: input.fromBoxId,
          type: "expense",
          amountCents: input.amountCents,
          transferId: transfer.id,
          description: input.description ?? null,
          occurredAt: input.occurredAt,
        })
        .returning();

      const [toMovementRow] = await tx
        .insert(financeMovements)
        .values({
          userId: input.userId,
          boxId: input.toBoxId,
          type: "income",
          amountCents: input.amountCents,
          transferId: transfer.id,
          description: input.description ?? null,
          occurredAt: input.occurredAt,
        })
        .returning();

      return {
        transfer,
        fromMovement: toMovement(fromMovementRow),
        toMovement: toMovement(toMovementRow),
      };
    });
  }

  async getBalancesByBox(userId: string): Promise<Map<string, number>> {
    const rows = await getDb()
      .select({
        boxId: financeMovements.boxId,
        balance: sql<number>`coalesce(
          sum(case when ${financeMovements.type} = 'income' then ${financeMovements.amountCents} else 0 end)
          - sum(case when ${financeMovements.type} = 'expense' then ${financeMovements.amountCents} else 0 end),
          0
        )`.mapWith(Number),
      })
      .from(financeMovements)
      .where(eq(financeMovements.userId, userId))
      .groupBy(financeMovements.boxId);

    return new Map(rows.map((row) => [row.boxId, row.balance]));
  }
}

export const drizzleMovementRepository = new DrizzleMovementRepository();
