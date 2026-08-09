"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { parseReaisToCents } from "@/lib/finances/format";
import type { FinanceBoxDto } from "@/lib/finances/types";

type TransferFormDialogProps = {
  boxes: FinanceBoxDto[];
  defaultFromBoxId?: string;
  onSaved?: () => void;
  trigger?: React.ReactNode;
};

export function TransferFormDialog({
  boxes,
  defaultFromBoxId,
  onSaved,
  trigger,
}: TransferFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [fromBoxId, setFromBoxId] = useState("");
  const [toBoxId, setToBoxId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setFromBoxId(defaultFromBoxId ?? boxes[0]?.id ?? "");
    setToBoxId(boxes.find((box) => box.id !== defaultFromBoxId)?.id ?? "");
    setAmount("");
    setDescription("");
    setError(null);
  }, [open, defaultFromBoxId, boxes]);

  async function handleSubmit() {
    const amountCents = parseReaisToCents(amount);

    if (!fromBoxId || !toBoxId) {
      setError("Selecione origem e destino.");
      return;
    }

    if (fromBoxId === toBoxId) {
      setError("Origem e destino devem ser diferentes.");
      return;
    }

    if (amountCents === null) {
      setError("Valor inválido.");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/finances/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromBoxId,
        toBoxId,
        amountCents,
        description: description.trim() || undefined,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(data?.message ?? "Falha ao transferir.");
      setLoading(false);
      return;
    }

    onSaved?.();
    setOpen(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <ArrowLeftRight className="size-4" />
            Transferir
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir entre caixinhas</DialogTitle>
          <DialogDescription>
            Move valor de uma caixinha para outra.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">De</label>
            <Select value={fromBoxId} onValueChange={setFromBoxId}>
              <SelectTrigger>
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                {boxes.map((box) => (
                  <SelectItem key={box.id} value={box.id}>
                    {box.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Para</label>
            <Select value={toBoxId} onValueChange={setToBoxId}>
              <SelectTrigger>
                <SelectValue placeholder="Destino" />
              </SelectTrigger>
              <SelectContent>
                {boxes.map((box) => (
                  <SelectItem key={box.id} value={box.id}>
                    {box.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Valor (R$)</label>
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Ex.: 500,00"
              inputMode="decimal"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição (opcional)</label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
            />
          </div>

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
