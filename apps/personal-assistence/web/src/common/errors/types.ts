type ErrorSeverity = "expected" | "unexpected";

type ErrorDefinition = {
  code: string;
  httpStatus: number;
  message: string;
  description: string;
  severity: ErrorSeverity;
  exposeToClient: boolean;
};

type ClientErrorPayload = {
  errorId?: string;
  code?: string;
  message?: string;
  digest?: string;
};

type ErrorCatalogEntry = ErrorDefinition;

type ErrorCatalogMap = Record<string, ErrorCatalogEntry>;

type CreateErrorOptions = {
  errorId?: string;
  meta?: Record<string, unknown>;
  cause?: unknown;
  messageOverride?: string;
};

export type {
  ClientErrorPayload,
  CreateErrorOptions,
  ErrorCatalogEntry,
  ErrorCatalogMap,
  ErrorDefinition,
  ErrorSeverity,
};
