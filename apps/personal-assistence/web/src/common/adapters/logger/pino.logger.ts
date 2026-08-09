import pino, { type Logger as PinoLogger } from "pino";
import { trace, context as otelContext } from "@opentelemetry/api";
import type { LoggerPort, LogBindings } from "./logger.port";
import { getRequestContext } from "./request-context";

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? "personal-assistence-web";

function getTraceContext(): { trace_id?: string; span_id?: string } {
  const span = trace.getSpan(otelContext.active());
  if (!span) {
    return {};
  }

  const spanContext = span.spanContext();
  if (!spanContext.traceId) {
    return {};
  }

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
      return {
        ...getRequestContext(),
        ...getTraceContext(),
      };
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

function wrapPinoLogger(pinoLogger: PinoLogger): LoggerPort {
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

let loggerInstance: LoggerPort | null = null;

function initLogger(): LoggerPort {
  loggerInstance = wrapPinoLogger(createPinoLogger());
  return loggerInstance;
}

function getLogger(): LoggerPort {
  if (!loggerInstance) {
    return initLogger();
  }

  return loggerInstance;
}

export { getLogger, initLogger };
