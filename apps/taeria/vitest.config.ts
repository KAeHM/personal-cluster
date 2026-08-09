import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Mede cobertura apenas onde testes unitarios fazem sentido: regra de
      // negocio e logica pura (domain + application) e helpers puros de
      // common (erros e guards HTTP). Infra/IO/UI/glue (adapters Supabase,
      // Server Actions, logger, env, factories) sao validados por e2e, nao aqui.
      include: [
        "src/**/domain/**/*.ts",
        "src/**/application/**/*.ts",
        "src/common/errors/**/*.ts",
        "src/common/adapters/http/**/*.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.d.ts",
        "src/**/index.ts",
        // Glue/IO puro (sem logica para testar unitariamente):
        "src/**/application/session/facade.ts",
        "src/common/errors/helpers/log-error.ts",
        "src/common/adapters/http/error-response.ts",
        // Agentes LLM (integracao externa; orquestrador testado com mocks):
        "src/**/application/ai/agents/**",
        "src/**/application/ai/tools/**",
        "src/**/application/ai/prompts.ts",
        "src/**/application/ai/orchestrator.ts",
        "src/**/application/use-cases/get-codex-entry.ts",
        "src/**/application/use-cases/search-codex-entries.ts",
        // Parsing JSON Schema ↔ campos de faceta (coberto indiretamente por kind + draft):
        "src/**/application/schemas/facet-schema.ts",
      ],
      // Portao de cobertura: o CI falha se o nucleo de logica cair abaixo disto.
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
