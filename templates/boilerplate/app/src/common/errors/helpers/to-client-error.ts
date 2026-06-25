import type { ClientErrorPayload } from "../types";
import { isAppError } from "./is-app-error";
import type { ErrorWithDigest } from "./get-error-reference";

function toClientError(error: unknown): ClientErrorPayload {
  if (isAppError(error)) {
    return {
      errorId: error.errorId,
      code: error.code,
      ...(error.exposeToClient ? { message: error.message } : {}),
    };
  }

  const digestError = error as ErrorWithDigest;

  if (digestError instanceof Error && digestError.digest) {
    return { digest: digestError.digest };
  }

  if (process.env.NODE_ENV === "development" && error instanceof Error) {
    return { message: error.message };
  }

  return {};
}

export { toClientError };
