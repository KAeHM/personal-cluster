import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/common/env";
import { usersTable } from "@/modules/users/infrastructure/adapters/drizzle/schema";
import { credentialsTable } from "@/modules/auth/infrastructure/credentials/adapters/drizzle/schema";

/**
 * Client de conexao do Drizzle (postgres-js), compartilhado por todos os
 * adapters de banco. Singleton lazy: a conexao so e aberta no primeiro uso.
 *
 * O schema agregado fica aqui para habilitar a query API tipada do Drizzle
 * (`db.query.usersTable...`) sem cada adapter reimportar tudo.
 */
const schema = {
  usersTable,
  credentialsTable,
};

type Database = ReturnType<typeof createDatabase>;

function createDatabase() {
  const { DATABASE_URL } = getEnv();
  const queryClient = postgres(DATABASE_URL);
  return drizzle(queryClient, { schema });
}

let cached: Database | null = null;

export function getDb(): Database {
  if (!cached) {
    cached = createDatabase();
  }
  return cached;
}

export type { Database };
export { schema };
