import { defineErrorCatalog } from "../define-error-catalog";

const COMMON_ERRORS = defineErrorCatalog(
  {
    INTERNAL: {
      code: "COMMON_INTERNAL",
      httpStatus: 500,
      message: "Ocorreu um erro interno. Tente novamente mais tarde.",
      description:
        "Erro inesperado ou falha não categorizada. Investigar logs pelo errorId ou digest.",
      severity: "unexpected",
      exposeToClient: false,
    },
    NOT_FOUND: {
      code: "COMMON_NOT_FOUND",
      httpStatus: 404,
      message: "Recurso não encontrado.",
      description: "Recurso solicitado não existe ou não está disponível.",
      severity: "expected",
      exposeToClient: true,
    },
    VALIDATION: {
      code: "COMMON_VALIDATION",
      httpStatus: 422,
      message: "Os dados enviados são inválidos.",
      description:
        "Falha de validação de entrada (schema, formato ou regra de negócio).",
      severity: "expected",
      exposeToClient: true,
    },
    UNAUTHORIZED: {
      code: "COMMON_UNAUTHORIZED",
      httpStatus: 401,
      message: "Não autorizado.",
      description: "Sessão ausente ou inválida.",
      severity: "expected",
      exposeToClient: true,
    },
  },
  "common",
);

export { COMMON_ERRORS };
