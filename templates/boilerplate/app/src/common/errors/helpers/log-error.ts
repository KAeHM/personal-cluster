import { getLogger } from "@/common/adapters/logger";
import { getRequestContext } from "@/common/adapters/logger/request-context";
import { isAppError } from "./is-app-error";
import type { ErrorWithDigest } from "./get-error-reference";

type LogErrorContext = Record<string, unknown>;

function logError(error: unknown, context: LogErrorContext = {}): void {
  const logger = getLogger();
  const requestContext = getRequestContext();

  const base = {
    ...requestContext,
    ...context,
  };

  if (isAppError(error)) {
    logger.error(
      {
        ...base,
        errorId: error.errorId,
        code: error.code,
        httpStatus: error.httpStatus,
        severity: error.severity,
        meta: error.meta,
        err: error,
      },
      error.message,
    );
    return;
  }

  const digestError = error as ErrorWithDigest;

  logger.error(
    {
      ...base,
      digest: digestError.digest,
      err: error instanceof Error ? error : undefined,
    },
    error instanceof Error ? error.message : "Unknown error",
  );
}

export { logError, type LogErrorContext };
