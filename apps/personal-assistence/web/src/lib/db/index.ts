import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type Database = PostgresJsDatabase<typeof schema>;

declare global {
  var __db: Database | undefined;
}

let dbInstance: Database | undefined;

function createDb(): Database {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString, { max: 1 });
  return drizzle(client, { schema });
}

export function getDb(): Database {
  if (dbInstance) {
    return dbInstance;
  }

  if (globalThis.__db) {
    dbInstance = globalThis.__db;
    return dbInstance;
  }

  dbInstance = createDb();

  if (process.env.NODE_ENV !== "production") {
    globalThis.__db = dbInstance;
  }

  return dbInstance;
}

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
