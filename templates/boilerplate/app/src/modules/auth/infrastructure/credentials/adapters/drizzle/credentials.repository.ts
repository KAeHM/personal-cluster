import { eq } from "drizzle-orm";
import { getDb, type Database } from "@/common/adapters/db/drizzle/client";
import type {
  Credentials,
  NewCredentials,
} from "../../../../domain/credentials/credentials";
import type { CredentialsRepository } from "../../../../domain/credentials/credentials.repository";
import { credentialsTable, type CredentialsRow } from "./schema";

function toDomain(row: CredentialsRow): Credentials {
  return {
    userId: row.userId,
    email: row.email,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
  };
}

/**
 * `db` é injetável (default: singleton `getDb()`) para permitir testes de
 * integração contra um Postgres efêmero sem tocar no client global.
 */
export function createDrizzleCredentialsRepository(
  db: Database = getDb(),
): CredentialsRepository {
  return {
    async findByEmail(email: string): Promise<Credentials | null> {
      const [row] = await db
        .select()
        .from(credentialsTable)
        .where(eq(credentialsTable.email, email))
        .limit(1);
      return row ? toDomain(row) : null;
    },

    async findByUserId(userId: string): Promise<Credentials | null> {
      const [row] = await db
        .select()
        .from(credentialsTable)
        .where(eq(credentialsTable.userId, userId))
        .limit(1);
      return row ? toDomain(row) : null;
    },

    async create(data: NewCredentials): Promise<Credentials> {
      const [row] = await db
        .insert(credentialsTable)
        .values({
          userId: data.userId,
          email: data.email,
          passwordHash: data.passwordHash,
        })
        .returning();
      return toDomain(row);
    },

    async updatePassword(userId: string, passwordHash: string): Promise<void> {
      await db
        .update(credentialsTable)
        .set({ passwordHash })
        .where(eq(credentialsTable.userId, userId));
    },
  };
}
