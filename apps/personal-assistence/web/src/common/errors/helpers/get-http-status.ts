import { isAppError } from "./is-app-error";

function getHttpStatus(error: unknown, fallback = 500): number {
  if (isAppError(error)) {
    return error.httpStatus;
  }

  return fallback;
}

export { getHttpStatus };
