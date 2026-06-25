import { eq } from "drizzle-orm";
import { getDb, type Database } from "@/common/adapters/db/drizzle/client";
import type { NewUser, UpdateUser, User } from "../../../domain/user";
import type { UserRepository } from "../../../domain/user.repository";
import { usersTable, type UserRow } from "./schema";

/** Mapeia a linha do banco para a entidade de domínio (não vaza tipo do Drizzle). */
function toDomain(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * `db` é injetável (default: singleton `getDb()`) para permitir testes de
 * integração contra um Postgres efêmero sem tocar no client global.
 */
export function createDrizzleUserRepository(db: Database = getDb()): UserRepository {
  return {
    async findById(id: string): Promise<User | null> {
      const [row] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);
      return row ? toDomain(row) : null;
    },

    async findByEmail(email: string): Promise<User | null> {
      const [row] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);
      return row ? toDomain(row) : null;
    },

    async list(): Promise<User[]> {
      const rows = await db.select().from(usersTable);
      return rows.map(toDomain);
    },

    async create(data: NewUser): Promise<User> {
      const [row] = await db
        .insert(usersTable)
        .values({
          email: data.email,
          name: data.name ?? null,
          role: data.role,
        })
        .returning();
      return toDomain(row);
    },

    async update(id: string, data: UpdateUser): Promise<User | null> {
      const [row] = await db
        .update(usersTable)
        .set({
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.role !== undefined ? { role: data.role } : {}),
        })
        .where(eq(usersTable.id, id))
        .returning();
      return row ? toDomain(row) : null;
    },

    async delete(id: string): Promise<boolean> {
      const rows = await db
        .delete(usersTable)
        .where(eq(usersTable.id, id))
        .returning({ id: usersTable.id });
      return rows.length > 0;
    },
  };
}
