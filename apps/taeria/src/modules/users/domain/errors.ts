import { defineErrorCatalog } from "@/common/errors/define-error-catalog";

const USER_ERRORS = defineErrorCatalog(
  {
    NOT_FOUND: {
      code: "USER_NOT_FOUND",
      httpStatus: 404,
      message: "Usuário não encontrado.",
      description: "Nenhum usuário corresponde ao id informado.",
      severity: "expected",
      exposeToClient: true,
    },
    EMAIL_TAKEN: {
      code: "USER_EMAIL_TAKEN",
      httpStatus: 409,
      message: "Este email já está em uso.",
      description: "Tentativa de criar usuário com email já cadastrado.",
      severity: "expected",
      exposeToClient: true,
    },
  },
  "users",
);

export { USER_ERRORS };
