import { defineErrorCatalog } from "@/common/errors";

const TASK_ERRORS = defineErrorCatalog(
  {
    NOT_FOUND: {
      code: "TASK_NOT_FOUND",
      httpStatus: 404,
      message: "Tarefa não encontrada.",
      description: "A tarefa solicitada não existe ou não pertence ao usuário.",
      severity: "expected",
      exposeToClient: true,
    },
    ALREADY_CLOSED: {
      code: "TASK_ALREADY_CLOSED",
      httpStatus: 400,
      message: "Tarefa já finalizada.",
      description: "Operação inválida em tarefa encerrada.",
      severity: "expected",
      exposeToClient: true,
    },
    ALREADY_PAUSED: {
      code: "TASK_ALREADY_PAUSED",
      httpStatus: 400,
      message: "Tarefa já está pausada.",
      description: "Tentativa de pausar tarefa que já está pausada.",
      severity: "expected",
      exposeToClient: true,
    },
    INVALID_ACTION: {
      code: "TASK_INVALID_ACTION",
      httpStatus: 400,
      message: "Ação inválida para o estado atual da tarefa.",
      description: "Transição de estado não permitida.",
      severity: "expected",
      exposeToClient: true,
    },
  },
  "tasks",
);

export { TASK_ERRORS };
