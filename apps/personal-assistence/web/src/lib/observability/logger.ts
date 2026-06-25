import pino, { type Logger as PinoLogger } from "pino";
import { context as otelContext, trace } from "@opentelemetry/api";

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? "personal-assistence-web";

type LogBindings = Record<string, unknown>;

type Logger = {
  info(bindings: LogBindings, message?: string): void;
  info(message: string): void;
  warn(bindings: LogBindings, message?: string): void;
  warn(message: string): void;
  error(bindings: LogBindings, message?: string): void;
  error(message: string): void;
  debug(bindings: LogBindings, message?: string): void;
  debug(message: string): void;
  child(bindings: LogBindings): Logger;
};

function getTraceContext(): { trace_id?: string; span_id?: string } {
  const span = trace.getSpan(otelContext.active());
  if (!span) return {};

  const spanContext = span.spanContext();
  if (!spanContext.traceId) return {};

  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
  };
}

function createPinoLogger(): PinoLogger {
  const isDev = process.env.NODE_ENV === "development";

  return pino({
    level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
    base: {
      service: SERVICE_NAME,
      env: process.env.NODE_ENV ?? "development",
    },
    mixin() {
      return getTraceContext();
    },
    redact: {
      paths: [
        "authorization",
        "cookie",
        "password",
        "token",
        "*.secret",
        "req.headers.authorization",
        "req.headers.cookie",
      ],
      remove: true,
    },
    ...(isDev
      ? {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
            },
          },
        }
      : {}),
  });
}

function wrapPinoLogger(pinoLogger: PinoLogger): Logger {
  const wrap =
    (method: "info" | "warn" | "error" | "debug") =>
    (bindingsOrMessage: LogBindings | string, message?: string) => {
      if (typeof bindingsOrMessage === "string") {
        pinoLogger[method](bindingsOrMessage);
        return;
      }
      pinoLogger[method](bindingsOrMessage, message);
    };

  return {
    info: wrap("info"),
    warn: wrap("warn"),
    error: wrap("error"),
    debug: wrap("debug"),
    child(bindings: LogBindings) {
      return wrapPinoLogger(pinoLogger.child(bindings));
    },
  };
}

let loggerInstance: Logger | null = null;

export function initLogger(): Logger {
  loggerInstance = wrapPinoLogger(createPinoLogger());
  return loggerInstance;
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    return initLogger();
  }
  return loggerInstance;
}
