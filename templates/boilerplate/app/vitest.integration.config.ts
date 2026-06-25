import { defineConfig } from "vitest/config";

// Config separada dos unit tests: sobe um Postgres real via Testcontainers
// (precisa de Docker disponivel). Rode com `make test-integration`.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 180_000,
    // Um Postgres por arquivo; evita corrida no schema entre suites.
    fileParallelism: false,
  },
});
