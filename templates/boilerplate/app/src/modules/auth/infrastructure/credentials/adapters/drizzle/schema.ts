import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "../../../../../users/infrastructure/adapters/drizzle/schema";

/**
 * Schema de banco da tabela `credentials`, separada de `users`: identidade de
 * login (email + hash de senha) vive no dominio de `auth`, ligada ao usuario
 * por `userId` (1:1, cascade no delete do usuario).
 */
export const credentialsTable = pgTable("credentials", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type CredentialsRow = typeof credentialsTable.$inferSelect;
export type NewCredentialsRow = typeof credentialsTable.$inferInsert;
