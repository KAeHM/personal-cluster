import { AppError } from "./app-error";
import type {
  CreateErrorOptions,
  ErrorCatalogEntry,
  ErrorCatalogMap,
} from "./types";

type CatalogKey<T extends ErrorCatalogMap> = keyof T & string;

type ErrorCatalog<T extends ErrorCatalogMap> = {
  readonly definitions: T;
  create(key: CatalogKey<T>, options?: CreateErrorOptions): AppError;
  get(key: CatalogKey<T>): ErrorCatalogEntry;
  toMarkdown(title?: string): string;
};

function defineErrorCatalog<T extends ErrorCatalogMap>(
  definitions: T,
  catalogName: string,
): ErrorCatalog<T> {
  return {
    definitions,

    create(key: CatalogKey<T>, options?: CreateErrorOptions) {
      const definition = definitions[key];
      if (!definition) {
        throw new Error(`Unknown error key "${String(key)}" in ${catalogName}`);
      }
      return new AppError(definition, options);
    },

    get(key: CatalogKey<T>) {
      const definition = definitions[key];
      if (!definition) {
        throw new Error(`Unknown error key "${String(key)}" in ${catalogName}`);
      }
      return definition;
    },

    toMarkdown(title = catalogName) {
      const rows = Object.entries(definitions).map(([key, def]) => {
        const entry = def as ErrorCatalogEntry;
        return `| \`${entry.code}\` | ${key} | ${entry.httpStatus} | ${entry.severity} | ${entry.exposeToClient ? "sim" : "não"} | ${entry.message} | ${entry.description} |`;
      });

      return [
        `## ${title}`,
        "",
        "| Código | Chave | HTTP | Severidade | Expõe ao cliente | Mensagem | Descrição |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        ...rows,
        "",
      ].join("\n");
    },
  };
}

export { defineErrorCatalog, type ErrorCatalog, type CatalogKey };
