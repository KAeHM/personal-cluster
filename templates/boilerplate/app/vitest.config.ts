import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Mede cobertura apenas onde testes unitarios fazem sentido: regra de
      // negocio e logica pura (domain + application) e helpers puros de
      // common (erros e guards HTTP). Infra/IO/UI/glue (adapters de banco,
      // NextAuth, Server Actions, logger, env, factories) sao validados por
      // integracao/e2e, nao aqui.
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
