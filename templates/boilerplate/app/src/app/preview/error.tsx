"use client";

import Link from "next/link";
import { RotateCcwIcon } from "lucide-react";
import { ErrorDisplay } from "@/common/components/feedback/error-display";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

export default function PreviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="border-destructive/30 w-full max-w-lg">
        <CardHeader className="items-center text-center">
          <CardTitle>Erro na rota /preview</CardTitle>
          <CardDescription>
            Erro inesperado capturado por{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              error.tsx
            </code>
            . Use a referência abaixo para buscar nos logs (Loki:{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              {'{service="web"} | json | digest="..."'}
            </code>
            ).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorDisplay error={error} onRetry={reset} />
        </CardContent>
        <CardFooter className="justify-center gap-2">
          <Button variant="outline" onClick={reset}>
            <RotateCcwIcon />
            Tentar novamente
          </Button>
          <Button asChild>
            <Link href="/preview">Resetar rota</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
