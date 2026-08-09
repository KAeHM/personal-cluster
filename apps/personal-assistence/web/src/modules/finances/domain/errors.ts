import { defineErrorCatalog } from "@/common/errors";

const FINANCE_ERRORS = defineErrorCatalog(
  {
    BOX_NOT_FOUND: {
      code: "FINANCE_BOX_NOT_FOUND",
      httpStatus: 404,
      message: "Caixinha não encontrada.",
      description:
        "A caixinha solicitada não existe ou não pertence ao usuário.",
      severity: "expected",
      exposeToClient: true,
    },
    CATEGORY_NOT_FOUND: {
      code: "FINANCE_CATEGORY_NOT_FOUND",
      httpStatus: 404,
      message: "Categoria não encontrada.",
      description:
        "A categoria solicitada não existe ou não pertence ao usuário.",
      severity: "expected",
      exposeToClient: true,
    },
    CATEGORY_ALREADY_EXISTS: {
      code: "FINANCE_CATEGORY_ALREADY_EXISTS",
      httpStatus: 409,
      message: "Categoria já existe.",
      description: "Já existe uma categoria com esse nome.",
      severity: "expected",
      exposeToClient: true,
    },
    INVALID_TRANSFER: {
      code: "FINANCE_INVALID_TRANSFER",
      httpStatus: 400,
      message: "Transferência inválida.",
      description: "Não é possível transferir para a mesma caixinha.",
      severity: "expected",
      exposeToClient: true,
    },
    INCOME_SOURCE_NOT_FOUND: {
      code: "FINANCE_INCOME_SOURCE_NOT_FOUND",
      httpStatus: 404,
      message: "Fonte de renda não encontrada.",
      description:
        "A fonte de renda solicitada não existe ou não pertence ao usuário.",
      severity: "expected",
      exposeToClient: true,
    },
    ALLOCATION_EMPTY: {
      code: "FINANCE_ALLOCATION_EMPTY",
      httpStatus: 400,
      message: "Nenhuma alocação calculada.",
      description:
        "Configure regras nas caixinhas ou verifique a fonte de renda.",
      severity: "expected",
      exposeToClient: true,
    },
    BOX_INACTIVE: {
      code: "FINANCE_BOX_INACTIVE",
      httpStatus: 400,
      message: "Caixinha inativa.",
      description: "Operação não permitida em caixinha inativa.",
      severity: "expected",
      exposeToClient: true,
    },
  },
  "finances",
);

export { FINANCE_ERRORS };
