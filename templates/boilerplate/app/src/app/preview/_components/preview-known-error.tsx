"use client";

import type { ClientErrorPayload } from "@/common/errors";
import { ErrorDisplay } from "@/common/components/feedback/error-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

type PreviewKnownErrorProps = {
  payload: ClientErrorPayload;
};

function PreviewKnownError({ payload }: PreviewKnownErrorProps) {
  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <CardTitle>Erro conhecido (AppError)</CardTitle>
        <CardDescription>
          Erros tipados retornam código e errorId ao cliente. Busque nos logs
          com{" "}
          <code className="bg-muted rounded px-1 py-0.5 text-xs">
            {'{service="web"} | json | errorId="..."'}
          </code>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ErrorDisplay
          reference={payload.errorId}
          code={payload.code}
          message={payload.message}
          title="Recurso não encontrado"
          description="Este é um erro esperado do catálogo COMMON_NOT_FOUND."
        />
      </CardContent>
    </Card>
  );
}

export { PreviewKnownError };
