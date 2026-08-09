import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { financeUserSettings } from "@/lib/db/schema";

import type { FinanceUserSettings } from "../../../domain/income.entity";
import type { UserSettingsRepository } from "../../../domain/ports/income-source.repository";

function toDomain(
  row: typeof financeUserSettings.$inferSelect,
): FinanceUserSettings {
  return {
    userId: row.userId,
    monthlyFixedIncomeCents: row.monthlyFixedIncomeCents,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleUserSettingsRepository implements UserSettingsRepository {
  async getByUserId(userId: string): Promise<FinanceUserSettings | null> {
    const [row] = await getDb()
      .select()
      .from(financeUserSettings)
      .where(eq(financeUserSettings.userId, userId))
      .limit(1);

    return row ? toDomain(row) : null;
  }

  async upsert(
    userId: string,
    input: { monthlyFixedIncomeCents?: number | null },
  ): Promise<FinanceUserSettings> {
    const [row] = await getDb()
      .insert(financeUserSettings)
      .values({
        userId,
        monthlyFixedIncomeCents: input.monthlyFixedIncomeCents ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: financeUserSettings.userId,
        set: {
          monthlyFixedIncomeCents: input.monthlyFixedIncomeCents ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return toDomain(row);
  }
}

export const drizzleUserSettingsRepository =
  new DrizzleUserSettingsRepository();
