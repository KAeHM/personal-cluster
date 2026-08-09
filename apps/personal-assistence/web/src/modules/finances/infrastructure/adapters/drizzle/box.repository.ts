import { and, asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { financeBoxes } from "@/lib/db/schema";

import type { FinanceBox } from "../../../domain/box.entity";
import type {
  CreateBoxInput,
  BoxRepository,
  UpdateBoxInput,
} from "../../../domain/ports/box.repository";

function toDomain(row: typeof financeBoxes.$inferSelect): FinanceBox {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    profile: row.profile,
    targetAmountCents: row.targetAmountCents,
    priority: row.priority,
    color: row.color,
    icon: row.icon,
    config: row.config,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleBoxRepository implements BoxRepository {
  async findById(userId: string, boxId: string): Promise<FinanceBox | null> {
    const row = await getDb().query.financeBoxes.findFirst({
      where: and(eq(financeBoxes.id, boxId), eq(financeBoxes.userId, userId)),
    });

    return row ? toDomain(row) : null;
  }

  async listByUser(
    userId: string,
    options?: { includeInactive?: boolean },
  ): Promise<FinanceBox[]> {
    const conditions = [eq(financeBoxes.userId, userId)];

    if (!options?.includeInactive) {
      conditions.push(eq(financeBoxes.isActive, true));
    }

    const rows = await getDb()
      .select()
      .from(financeBoxes)
      .where(and(...conditions))
      .orderBy(desc(financeBoxes.priority), asc(financeBoxes.name));

    return rows.map(toDomain);
  }

  async create(input: CreateBoxInput): Promise<FinanceBox> {
    const [row] = await getDb()
      .insert(financeBoxes)
      .values({
        userId: input.userId,
        name: input.name,
        description: input.description ?? null,
        profile: input.profile ?? "other",
        targetAmountCents: input.targetAmountCents ?? null,
        priority: input.priority ?? 0,
        color: input.color ?? null,
        icon: input.icon ?? null,
        config: input.config ?? null,
      })
      .returning();

    return toDomain(row);
  }

  async update(
    userId: string,
    boxId: string,
    input: UpdateBoxInput,
  ): Promise<FinanceBox | null> {
    const [row] = await getDb()
      .update(financeBoxes)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(financeBoxes.id, boxId), eq(financeBoxes.userId, userId)))
      .returning();

    return row ? toDomain(row) : null;
  }
}

export const drizzleBoxRepository = new DrizzleBoxRepository();
