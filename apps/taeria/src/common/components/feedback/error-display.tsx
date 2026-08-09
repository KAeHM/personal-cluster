"use client";

import * as React from "react";
import { AlertCircleIcon } from "lucide-react";
import { cn } from "@/common/utils/cn";
import { Button } from "@/common/components/ui/button";
import { isAppError } from "@/common/errors/helpers/is-app-error";
import {
  getErrorReference,
  type ErrorWithDigest,
} from "@/common/errors/helpers/get-error-reference";

type ErrorDisplayProps = {
  error?: ErrorWithDigest;
  reference?: string;
  code?: string;
  message?: string;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

function ErrorDisplay({
  error,
  reference: referenceProp,
  code: codeProp,
  message: messageProp,
  title = "Algo deu errado",
  description = "Ocorreu um erro inesperado. Se o problema persistir, informe o código abaixo ao suporte.",
  onRetry,
  retryLabel = "Tentar novamente",
  className,
}: ErrorDisplayProps) {
  const reference =
    referenceProp ?? (error ? getErrorReference(error) : undefined);
  const code =
    codeProp ??
    (error && isAppError(error)
      ? error.code
      : (error as Error & { code?: string }).code);
  const isDev = process.env.NODE_ENV === "development";

  const clientMessage =
    messageProp ??
    (error && isAppError(error) && error.exposeToClient
      ? error.message
      : isDev && error && !reference
        ? error.message
        : undefined);

  return (
    <div
      data-slot="error-display"
      role="alert"
      className={cn(
        "border-destructive/30 bg-destructive/5 flex flex-col items-center gap-3 rounded-lg border px-6 py-8 text-center",
        className,
      )}
    >
      <AlertCircleIcon className="text-destructive size-8" />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
        {clientMessage ? (
          <p className="text-muted-foreground text-sm">{clientMessage}</p>
        ) : null}
      </div>
      {reference || code ? (
        <div className="border-border bg-background space-y-1 rounded-md border px-4 py-3 text-left text-sm">
          {code ? (
            <p className="text-muted-foreground">
              Código:{" "}
              <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">
                {code}
              </code>
            </p>
          ) : null}
          {reference ? (
            <p className="text-muted-foreground">
              Referência:{" "}
              <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs break-all">
                {reference}
              </code>
            </p>
          ) : null}
        </div>
      ) : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export { ErrorDisplay, type ErrorDisplayProps };
