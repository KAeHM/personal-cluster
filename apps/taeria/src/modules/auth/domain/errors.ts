import { defineErrorCatalog } from "@/common/errors/define-error-catalog";

const AUTH_ERRORS = defineErrorCatalog(
  {
    UNAUTHORIZED: {
      code: "AUTH_UNAUTHORIZED",
      httpStatus: 401,
      message: "Autenticação necessária.",
      description:
        "Sessão ausente ou inválida. Usuário precisa estar autenticado.",
      severity: "expected",
      exposeToClient: true,
    },
    FORBIDDEN: {
      code: "AUTH_FORBIDDEN",
      httpStatus: 403,
      message: "Você não tem permissão para acessar este recurso.",
      description: "Usuário autenticado sem a role ou permissão exigida.",
      severity: "expected",
      exposeToClient: true,
    },
  },
  "auth",
);

export { AUTH_ERRORS };
