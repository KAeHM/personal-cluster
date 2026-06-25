"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangleIcon,
  InboxIcon,
  RotateCcwIcon,
  ShieldAlertIcon,
} from "lucide-react";
import { Button } from "@/common/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

export function PreviewControls() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const failMode = searchParams.get("fail");
  const empty = searchParams.get("empty") === "1";

  function updateParams(next: { fail?: string | null; empty?: boolean }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.fail) {
      params.set("fail", next.fail);
    } else {
      params.delete("fail");
    }

    if (next.empty) {
      params.set("empty", "1");
    } else {
      params.delete("empty");
    }

    const query = params.toString();
    router.push(query ? `/preview?${query}` : "/preview");
  }

  return (
    <Card id="overview">
      <CardHeader>
        <CardTitle>Controles de demonstração</CardTitle>
        <CardDescription>
          Simule erros inesperados (digest), erros tipados (AppError) e lista
          vazia.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          variant={failMode === "1" ? "destructive" : "outline"}
          onClick={() => updateParams({ fail: "1", empty })}
        >
          <AlertTriangleIcon />
          Erro inesperado (digest)
        </Button>
        <Button
          variant={failMode === "known" ? "secondary" : "outline"}
          onClick={() => updateParams({ fail: "known", empty })}
        >
          <ShieldAlertIcon />
          Erro conhecido (AppError)
        </Button>
        <Button
          variant={empty ? "secondary" : "outline"}
          onClick={() => updateParams({ fail: null, empty: true })}
        >
          <InboxIcon />
          Simular lista vazia
        </Button>
        <Button variant="ghost" onClick={() => updateParams({ fail: null })}>
          <RotateCcwIcon />
          Resetar
        </Button>
      </CardContent>
    </Card>
  );
}
