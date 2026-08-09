"use client";

import { useEffect, useRef } from "react";
import { AlertCircleIcon, XIcon } from "lucide-react";

import { Button } from "@/common/components/ui/button";
import { cn } from "@/common/utils/cn";

type CodexFormAlertProps = {
  message: string;
  details?: string[];
  onDismiss?: () => void;
  className?: string;
};

function CodexFormAlert({
  message,
  details = [],
  onDismiss,
  className,
}: CodexFormAlertProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [message, details]);

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "border-destructive/40 bg-destructive/10 text-destructive sticky top-0 z-20 mb-4 flex gap-3 rounded-md border p-4 shadow-sm",
        className,
      )}
    >
      <AlertCircleIcon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-semibold">{message}</p>
        {details.length > 0 ? (
          <ul className="text-destructive/90 list-disc space-y-1 pl-4 text-sm">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
        <p className="text-destructive/80 text-xs">
          Confira o painel Detalhes e os campos obrigatórios do tipo.
        </p>
      </div>
      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 size-8 shrink-0"
          onClick={onDismiss}
          aria-label="Fechar aviso"
        >
          <XIcon className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}

export { CodexFormAlert };
