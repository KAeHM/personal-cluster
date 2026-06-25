import { defineConfig } from "drizzle-kit";

/**
 * Cada modulo e dono do proprio schema de banco (em
 * `infrastructure/**\/drizzle/schema.ts`). O drizzle-kit agrega todos via glob,
 * mantendo a fronteira por modulo intacta.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/modules/**/infrastructure/**/drizzle/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
