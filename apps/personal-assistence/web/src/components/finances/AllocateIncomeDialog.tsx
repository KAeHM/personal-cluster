"use client";

import { useEffect, useState } from "react";
import { Banknote, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import type {
  AllocationPreviewDto,
  IncomeSourceDto,
} from "@/lib/finances/types";

type AllocateIncomeDialogProps = {
  incomeSources: IncomeSourceDto[];
  onSaved?: () => void;
};

export function AllocateIncomeDialog({
  incomeSources,
  onSaved,
}: AllocateIncomeDialogProps) {
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<AllocationPreviewDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSourceId(incomeSources[0]?.id ?? "");
    setAmount("");
    setDescription("");
    setPreview(null);
    setError(null);
  }, [open, incomeSources]);

  async function loadPreview() {
    const amountCents = parseReaisToCents(amount);

    if (!sourceId) {
      setError("Selecione a fonte de renda.");
      return;
    }

    if (amountCents === null) {
      setError("Valor inválido.");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/finances/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "preview",
        incomeSourceId: sourceId,
        amountCents,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(data?.message ?? "Falha ao calcular alocação.");
      setLoading(false);
      return;
    }

    const data = (await response.json()) as { preview: AllocationPreviewDto };
    setPreview(data.preview);
    setLoading(false);
  }

  async function confirmAllocation() {
    const amountCents = parseReaisToCents(amount);
    if (!sourceId || amountCents === null) {
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/finances/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "execute",
        incomeSourceId: sourceId,
        amountCents,
        description: description.trim() || undefined,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(data?.message ?? "Falha ao registrar alocação.");
      setLoading(false);
      return;
    }

    onSaved?.();
    setOpen(false);
    setLoading(false);
  }

  const allWarnings = [
    ...(preview?.warnings ?? []),
    ...(preview?.fixedIncomeWarning ? [preview.fixedIncomeWarning] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={incomeSources.length === 0}>
          <Banknote className="size-4" />
          Registrar renda
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar renda e alocar</DialogTitle>
          <DialogDescription>
            Distribui automaticamente entre caixinhas conforme as regras
            configuradas.
          </DialogDescription>
        </DialogHeader>

        {incomeSources.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Cadastre uma fonte de renda em Fontes de renda antes de alocar.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fonte de renda</label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {incomeSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} (
                      {source.type === "fixed" ? "fixa" : "variável"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor recebido (R$)</label>
              <Input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Ex.: 5000,00"
                inputMode="decimal"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Descrição (opcional)
              </label>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ex.: Salário março"
              />
            </div>

            {preview && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview da alocação</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Caixinha</TableHead>
                      <TableHead>Regra</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.lines.map((line) => (
                      <TableRow key={`${line.boxId}-${line.ruleId}`}>
                        <TableCell>{line.boxName}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {line.reason}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCents(line.amountCents)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {allWarnings.length > 0 && (
              <div className="space-y-1">
                {allWarnings.map((warning) => (
                  <p
                    key={warning}
                    className="text-sm text-amber-600 dark:text-amber-400"
                  >
                    {warning}
                  </p>
                ))}
              </div>
            )}

            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          {!preview ? (
            <Button
              onClick={() => void loadPreview()}
              disabled={loading || incomeSources.length === 0}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Calcular
            </Button>
          ) : (
            <Button onClick={() => void confirmAllocation()} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Confirmar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
