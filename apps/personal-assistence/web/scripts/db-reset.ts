/**
 * Resets the application database in development only.
 * Drops the public schema and re-applies Drizzle migrations.
 *
 * Usage: npm run db:reset
 */
import { execSync } from "node:child_process";
import { resolve } from "node:path";

import postgres from "postgres";

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.ALLOW_DB_RESET === "true";

if (!isDev) {
  console.error(
    "db:reset só pode rodar em desenvolvimento (NODE_ENV=development) ou com ALLOW_DB_RESET=true.",
  );
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL não definida. Use .env.local no diretório web/.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

async function reset() {
  console.log("Limpando schemas public e drizzle…");
  await sql.unsafe("DROP SCHEMA IF EXISTS public CASCADE");
  await sql.unsafe("DROP SCHEMA IF EXISTS drizzle CASCADE");
  await sql.unsafe("CREATE SCHEMA public");
  await sql.unsafe("GRANT ALL ON SCHEMA public TO public");
  await sql.end();

  const webRoot = resolve(import.meta.dirname, "..");
  console.log("Aplicando migrations…");
  execSync("npx drizzle-kit migrate", {
    cwd: webRoot,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  console.log("Banco resetado com sucesso.");
}

reset().catch((error) => {
  console.error("Falha ao resetar o banco:", error);
  process.exit(1);
});
