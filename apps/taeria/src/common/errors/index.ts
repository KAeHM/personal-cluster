export { AppError } from "./app-error";
export {
  defineErrorCatalog,
  type ErrorCatalog,
  type CatalogKey,
} from "./define-error-catalog";
export { COMMON_ERRORS } from "./catalog/common.errors";
export {
  getErrorReference,
  type ErrorWithDigest,
} from "./helpers/get-error-reference";
export { getHttpStatus } from "./helpers/get-http-status";
export { isAppError } from "./helpers/is-app-error";
export { logError, type LogErrorContext } from "./helpers/log-error";
export { toClientError } from "./helpers/to-client-error";
export type {
  ClientErrorPayload,
  CreateErrorOptions,
  ErrorDefinition,
  ErrorSeverity,
} from "./types";
