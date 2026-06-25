import type { CreateErrorOptions, ErrorDefinition } from "./types";

class AppError extends Error {
  readonly code: string;
  readonly errorId: string;
  readonly httpStatus: number;
  readonly severity: ErrorDefinition["severity"];
  readonly exposeToClient: boolean;
  readonly meta?: Record<string, unknown>;

  constructor(definition: ErrorDefinition, options: CreateErrorOptions = {}) {
    super(options.messageOverride ?? definition.message);
    this.name = "AppError";
    this.code = definition.code;
    this.errorId = options.errorId ?? crypto.randomUUID();
    this.httpStatus = definition.httpStatus;
    this.severity = definition.severity;
    this.exposeToClient = definition.exposeToClient;
    this.meta = options.meta;

    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export { AppError };
