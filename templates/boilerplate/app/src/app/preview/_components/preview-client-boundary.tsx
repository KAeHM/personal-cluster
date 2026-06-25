"use client";

import * as React from "react";
import { AlertCircleIcon } from "lucide-react";
import { Boundary } from "@/common/components/feedback/boundary";
import { CardSkeleton } from "@/common/components/feedback/card-skeleton";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

function flakyResource(shouldFail: boolean): Promise<{ message: string }> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (shouldFail) {
        reject(new Error("Falha simulada no client (Boundary + Suspense)."));
        return;
      }

      resolve({ message: "Dados carregados com sucesso no client." });
    }, 900);
  });
}

function ClientResource({
  promise,
}: {
  promise: Promise<{ message: string }>;
}) {
  const data = React.use(promise);
  return (
    <p className="border-border bg-muted/30 rounded-md border p-4 text-sm">
      {data.message}
    </p>
  );
}

export function PreviewClientBoundary() {
  const [attempt, setAttempt] = React.useState(0);
  const [shouldFail, setShouldFail] = React.useState(false);

  const promise = React.useMemo(
    () => flakyResource(shouldFail),
    [attempt, shouldFail],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Boundary no client</CardTitle>
        <CardDescription>
          Demonstra loading e erro com Suspense + Error Boundary fora do App
          Router.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShouldFail(false);
              setAttempt((value) => value + 1);
            }}
          >
            Recarregar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setShouldFail(true);
              setAttempt((value) => value + 1);
            }}
          >
            <AlertCircleIcon />
            Forçar erro
          </Button>
        </div>

        <Boundary fallback={<CardSkeleton className="border-dashed" />}>
          <ClientResource key={attempt} promise={promise} />
        </Boundary>
      </CardContent>
    </Card>
  );
}
