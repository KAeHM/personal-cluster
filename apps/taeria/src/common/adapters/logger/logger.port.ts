type LogBindings = Record<string, unknown>;

type LoggerPort = {
  info(bindings: LogBindings, message?: string): void;
  info(message: string): void;
  warn(bindings: LogBindings, message?: string): void;
  warn(message: string): void;
  error(bindings: LogBindings, message?: string): void;
  error(message: string): void;
  debug(bindings: LogBindings, message?: string): void;
  debug(message: string): void;
  child(bindings: LogBindings): LoggerPort;
};

export type { LoggerPort, LogBindings };
