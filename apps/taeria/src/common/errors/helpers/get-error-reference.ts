import { isAppError } from "./is-app-error";

type ErrorWithDigest = Error & { digest?: string };

function getErrorReference(error: ErrorWithDigest): string | undefined {
  if (isAppError(error)) {
    return error.errorId;
  }

  const extended = error as Error & { errorId?: string };
  if (extended.errorId) {
    return extended.errorId;
  }

  return error.digest;
}

export { getErrorReference, type ErrorWithDigest };
