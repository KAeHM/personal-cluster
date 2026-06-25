import {
  getHttpStatus,
  logError,
  toClientError,
  type LogErrorContext,
} from "@/common/errors";

/**
 * Converte qualquer erro num `Response` JSON seguro para Route Handlers:
 * loga server-side (stack + metadados) e devolve só o payload de cliente
 * (`errorId`/`code`/`digest`), com o status HTTP correto.
 */
export function errorResponse(
  error: unknown,
  context?: LogErrorContext,
): Response {
  logError(error, context);
  return Response.json(toClientError(error), {
    status: getHttpStatus(error),
  });
}
