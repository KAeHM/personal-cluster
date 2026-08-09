"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";

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
import type { FinanceBoxDto, FinanceCategoryDto } from "@/lib/finances/types";

type MovementFormDialogProps = {
  type: "income" | "expense";
  boxes: FinanceBoxDto[];
  categories: FinanceCategoryDto[];
  defaultBoxId?: string;
  onSaved?: () => void;
  trigger?: React.ReactNode;
};

export function MovementFormDialog({
  type,
  boxes,
  categories,
  defaultBoxId,
  onSaved,
  trigger,
}: MovementFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [boxId, setBoxId] = useState(defaultBoxId ?? "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = type === "income" ? "Entrada" : "Saída";
  const Icon = type === "income" ? ArrowDownLeft : ArrowUpRight;

  useEffect(() => {
    if (!open) {
      return;
    }

    setBoxId(defaultBoxId ?? boxes[0]?.id ?? "");
    setAmount("");
    setDescription("");
    setCategoryId("none");
    setError(null);
  }, [open, defaultBoxId, boxes]);

  async function handleSubmit() {
    const amountCents = parseReaisToCents(amount);

    if (!boxId) {
      setError("Selecione uma caixinha.");
      return;
    }

    if (amountCents === null) {
      setError("Valor inválido.");
      return;
    }

    setLoading(true);
    setError(null);

    const response = await fetch(`/api/finances/boxes/${boxId}/movements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        amountCents,
        description: description.trim() || undefined,
        categoryId: categoryId === "none" ? undefined : categoryId,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(data?.message ?? `Falha ao registrar ${label.toLowerCase()}.`);
      setLoading(false);
      return;
    }

    await response.json();
    onSaved?.();
    setOpen(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={type === "income" ? "default" : "outline"}>
            <Icon className="size-4" />
            {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar {label.toLowerCase()}</DialogTitle>
          <DialogDescription>
            {type === "income"
              ? "Adicione dinheiro à caixinha selecionada."
              : "Registre uma saída da caixinha selecionada."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Caixinha</label>
            <Select value={boxId} onValueChange={setBoxId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
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
              placeholder="Ex.: 150,00"
              inputMode="decimal"
            />
          </div>

          {categories.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
