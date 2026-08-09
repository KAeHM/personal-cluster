/**
 * Clears application data tables while preserving users and auth.
 * Does NOT drop schema or run migrations.
 *
 * Usage: npm run db:reset-data
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env" });

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.ALLOW_DB_RESET === "true";

if (!isDev) {
  console.error(
    "db:reset-data só pode rodar em desenvolvimento ou com ALLOW_DB_RESET=true.",
  );
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL não definida. Use web/.env.local.");
  process.exit(1);
}

const TABLES_TO_TRUNCATE = [
  "task_events",
  "group_aliases",
  "tasks",
  "work_groups",
] as const;

async function resetData() {
  const sql = postgres(databaseUrl!, { max: 1 });

  console.log("Limpando dados (preservando users, accounts, sessions)…");

  for (const table of TABLES_TO_TRUNCATE) {
    await sql.unsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    console.log(`  ✓ ${table}`);
  }

  await sql.end();
  console.log("Dados resetados. Usuários e autenticação preservados.");
}

resetData().catch((error) => {
  console.error("Falha ao resetar dados:", error);
  process.exit(1);
});
