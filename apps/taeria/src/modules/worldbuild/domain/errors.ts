import { defineErrorCatalog } from "@/common/errors/define-error-catalog";

const KIND_ERRORS = defineErrorCatalog(
  {
    NOT_FOUND: {
      code: "KIND_NOT_FOUND",
      httpStatus: 404,
      message: "Tipo de entidade não encontrado.",
      description: "Nenhum kind corresponde ao id informado.",
      severity: "expected",
      exposeToClient: true,
    },
    SLUG_TAKEN: {
      code: "KIND_SLUG_TAKEN",
      httpStatus: 409,
      message: "Este identificador (slug) já está em uso.",
      description:
        "Tentativa de criar ou renomear kind com slug já cadastrado.",
      severity: "expected",
      exposeToClient: true,
    },
    BUILTIN_DELETE: {
      code: "KIND_BUILTIN_DELETE",
      httpStatus: 403,
      message: "Tipos integrados do sistema não podem ser removidos.",
      description: "Tentativa de excluir kind com is_builtin=true.",
      severity: "expected",
      exposeToClient: true,
    },
    BUILTIN_SLUG_IMMUTABLE: {
      code: "KIND_BUILTIN_SLUG_IMMUTABLE",
      httpStatus: 403,
      message: "O identificador de tipos integrados não pode ser alterado.",
      description: "Tentativa de alterar slug de kind com is_builtin=true.",
      severity: "expected",
      exposeToClient: true,
    },
  },
  "worldbuild",
);

const CODEX_ERRORS = defineErrorCatalog(
  {
    NOT_FOUND: {
      code: "CODEX_NOT_FOUND",
      httpStatus: 404,
      message: "Entrada do codex não encontrada.",
      description: "Nenhuma entrada corresponde ao identificador informado.",
      severity: "expected",
      exposeToClient: true,
    },
    SLUG_TAKEN: {
      code: "CODEX_SLUG_TAKEN",
      httpStatus: 409,
      message: "Este identificador (slug) já está em uso no codex.",
      description: "Tentativa de criar entrada com slug já cadastrado.",
      severity: "expected",
      exposeToClient: true,
    },
    KIND_NOT_FOUND: {
      code: "CODEX_KIND_NOT_FOUND",
      httpStatus: 404,
      message: "Tipo de entidade não encontrado para este rascunho.",
      description: "kindSlug do draft não corresponde a um kind existente.",
      severity: "expected",
      exposeToClient: true,
    },
    VALIDATION_FAILED: {
      code: "CODEX_VALIDATION_FAILED",
      httpStatus: 422,
      message: "O rascunho não passou na validação.",
      description: "Facetas obrigatórias ou campos inválidos no draft.",
      severity: "expected",
      exposeToClient: true,
    },
    AI_UNAVAILABLE: {
      code: "STUDIO_AI_UNAVAILABLE",
      httpStatus: 503,
      message: "Assistente de criação indisponível no momento.",
      description: "GOOGLE_GENERATIVE_AI_API_KEY ausente ou inválida.",
      severity: "expected",
      exposeToClient: true,
    },
  },
  "worldbuild",
);

export { KIND_ERRORS, CODEX_ERRORS };
