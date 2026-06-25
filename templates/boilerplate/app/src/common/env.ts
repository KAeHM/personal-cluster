import { z } from "zod";

/**
 * Validacao das variaveis de ambiente no boot. Falha cedo (e com mensagem
 * clara) em vez de quebrar em runtime com `undefined` espalhado pelo codigo.
 *
 * Server-only: nao importe este modulo em Client Components. Variaveis
 * publicas (NEXT_PUBLIC_*) devem ser lidas direto de `process.env`.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Banco de dados (Drizzle + Postgres)
  DATABASE_URL: z.string().url("DATABASE_URL deve ser uma URL valida."),

  // Autenticacao (NextAuth / Auth.js v5)
  AUTH_SECRET: z
    .string()
    .min(1, "AUTH_SECRET e obrigatorio. Gere com `npx auth secret`."),
  AUTH_URL: z.string().url().optional(),

  // Autenticacao da API externa (/api/v1)
  API_KEY: z.string().min(1).optional(),

  // Observabilidade (opcionais; tem default no logger/otel)
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
  OTEL_SERVICE_NAME: z.string().optional(),

  // Traces OpenTelemetry: exporta via OTLP quando o endpoint aponta para um
  // collector/backend (ex.: Grafana Alloy/Tempo no cluster). Lidas direto pelo
  // @vercel/otel; declaradas aqui so para validacao/visibilidade.
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_PROTOCOL: z
    .enum(["http/protobuf", "grpc", "http/json"])
    .optional(),
  OTEL_SDK_DISABLED: z.enum(["true", "false"]).optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/**
 * Retorna as envs validadas (cacheadas). Lanca um erro agregado e legivel
 * se algo estiver faltando ou invalido.
 */
export function getEnv(): ServerEnv {
  if (cached) {
    return cached;
  }

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Variaveis de ambiente invalidas:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}
