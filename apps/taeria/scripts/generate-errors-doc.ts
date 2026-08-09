import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { COMMON_ERRORS } from "../src/common/errors/catalog/common.errors";
import { AUTH_ERRORS } from "../src/modules/auth/domain/errors";
import { USER_ERRORS } from "../src/modules/users/domain/errors";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, "../docs/errors.md");

const content = [
  "# Catálogo de erros",
  "",
  "Documento gerado automaticamente por `npm run errors:doc`.",
  "",
  COMMON_ERRORS.toMarkdown("common"),
  AUTH_ERRORS.toMarkdown("auth"),
  USER_ERRORS.toMarkdown("users"),
].join("\n");

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content, "utf8");

console.log(`Generated ${outputPath}`);
