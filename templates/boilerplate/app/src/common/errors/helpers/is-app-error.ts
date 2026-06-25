import { AppError } from "../app-error";

function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export { isAppError };
