import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { financeCategories } from "@/lib/db/schema";

import { normalizeFinanceName } from "../../../domain/normalize";
import type { FinanceCategory } from "../../../domain/movement.entity";
import type {
  CategoryRepository,
  CreateCategoryInput,
} from "../../../domain/ports/category.repository";

function toDomain(row: typeof financeCategories.$inferSelect): FinanceCategory {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    normalizedName: row.normalizedName,
    color: row.color,
    createdAt: row.createdAt,
  };
}

export class DrizzleCategoryRepository implements CategoryRepository {
  async findById(
    userId: string,
    categoryId: string,
  ): Promise<FinanceCategory | null> {
    const row = await getDb().query.financeCategories.findFirst({
      where: eq(financeCategories.id, categoryId),
    });

    if (!row || row.userId !== userId) {
      return null;
    }

    return toDomain(row);
  }

  async findByNormalizedName(
    userId: string,
    normalizedName: string,
  ): Promise<FinanceCategory | null> {
    const row = await getDb().query.financeCategories.findFirst({
      where: and(
        eq(financeCategories.userId, userId),
        eq(financeCategories.normalizedName, normalizedName),
      ),
    });

    return row ? toDomain(row) : null;
  }

  async listByUser(userId: string): Promise<FinanceCategory[]> {
    const rows = await getDb()
      .select()
      .from(financeCategories)
      .where(eq(financeCategories.userId, userId))
      .orderBy(asc(financeCategories.name));

    return rows.map(toDomain);
  }

  async create(input: CreateCategoryInput): Promise<FinanceCategory> {
    const normalizedName = normalizeFinanceName(input.name);

    const [row] = await getDb()
      .insert(financeCategories)
      .values({
        userId: input.userId,
        name: input.name.trim(),
        normalizedName,
        color: input.color ?? null,
      })
      .returning();

    return toDomain(row);
  }
}

export const drizzleCategoryRepository = new DrizzleCategoryRepository();
