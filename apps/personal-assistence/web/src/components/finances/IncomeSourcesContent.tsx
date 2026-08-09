"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents, parseReaisToCents } from "@/lib/finances/format";
import type { IncomeSourceDto } from "@/lib/finances/types";

type FinanceSettingsData = {
  settings: { monthlyFixedIncomeCents: number | null };
  incomeSources: IncomeSourceDto[];
  computedFixedIncomeCents: number;
};

type IncomeSourcesContentProps = {
  initialData: FinanceSettingsData;
};

async function fetchSettings(): Promise<FinanceSettingsData> {
  const response = await fetch("/api/finances/settings", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Falha ao carregar configurações");
  }
  return response.json();
}

export function IncomeSourcesContent({
  initialData,
}: IncomeSourcesContentProps) {
  const [data, setData] = useState(initialData);
  const [name, setName] = useState("");
  const [type, setType] = useState<"fixed" | "variable">("variable");
  const [expectedAmount, setExpectedAmount] = useState("");
  const [fixedIncome, setFixedIncome] = useState(
    data.settings.monthlyFixedIncomeCents
      ? String(data.settings.monthlyFixedIncomeCents / 100).replace(".", ",")
      : "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await fetchSettings());
    } catch {
      setError("Não foi possível atualizar as fontes de renda.");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      void refresh();
    }, 20_000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function createSource() {
    const expectedAmountCents = expectedAmount.trim()
      ? parseReaisToCents(expectedAmount)
      : undefined;

    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/finances/income-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        expectedAmountCents: expectedAmountCents ?? undefined,
      }),
    });

    if (!response.ok) {
      setError("Falha ao criar fonte de renda.");
      setLoading(false);
      return;
    }

    setName("");
    setExpectedAmount("");
    await refresh();
    setLoading(false);
  }

  async function saveFixedIncome() {
    const monthlyFixedIncomeCents = fixedIncome.trim()
      ? parseReaisToCents(fixedIncome)
      : null;

    if (fixedIncome.trim() && monthlyFixedIncomeCents === null) {
      setError("Renda fixa inválida.");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/finances/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyFixedIncomeCents }),
    });

    if (!response.ok) {
      setError("Falha ao salvar renda fixa.");
      setLoading(false);
      return;
    }

    await refresh();
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <p className="text-muted-foreground text-sm">
        Fontes de renda definem de onde vem o dinheiro e quais caixinhas podem
        usar cada fonte nas regras de alocação.
      </p>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Renda fixa mensal</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1 space-y-2">
            <label className="text-sm font-medium">Valor (R$)</label>
            <Input
              value={fixedIncome}
              onChange={(event) => setFixedIncome(event.target.value)}
              placeholder="Ex.: 4200,00"
              inputMode="decimal"
            />
          </div>
          <Button onClick={() => void saveFixedIncome()} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
          {data.computedFixedIncomeCents > 0 && (
            <p className="text-muted-foreground w-full text-xs">
              Soma das fontes fixas cadastradas:{" "}
              {formatCents(data.computedFixedIncomeCents)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nova fonte de renda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Salário CLT"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as typeof type)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixa</SelectItem>
                  <SelectItem value="variable">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Valor esperado (opcional)
            </label>
            <Input
              value={expectedAmount}
              onChange={(event) => setExpectedAmount(event.target.value)}
              placeholder="Ex.: 5000,00"
              inputMode="decimal"
            />
          </div>
          <Button onClick={() => void createSource()} disabled={loading}>
            <Plus className="size-4" />
            Adicionar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fontes cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {data.incomeSources.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma fonte cadastrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Esperado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.incomeSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>{source.name}</TableCell>
                    <TableCell>
                      {source.type === "fixed" ? "Fixa" : "Variável"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {source.expectedAmountCents
                        ? formatCents(source.expectedAmountCents)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
