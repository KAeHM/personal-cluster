"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { BOX_PROFILE_OPTIONS } from "@/lib/finances/labels";
import { parseReaisToCents } from "@/lib/finances/format";
import type { FinanceBoxDto } from "@/lib/finances/types";

type BoxFormDialogProps = {
  box?: FinanceBoxDto;
  onSaved?: (box: FinanceBoxDto) => void;
  trigger?: React.ReactNode;
};

export function BoxFormDialog({ box, onSaved, trigger }: BoxFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [profile, setProfile] = useState<string>("other");
  const [targetAmount, setTargetAmount] = useState("");
  const [priority, setPriority] = useState("0");
  const [receiveRemainder, setReceiveRemainder] = useState(false);
  const [configJson, setConfigJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!box;

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(box?.name ?? "");
    setDescription(box?.description ?? "");
    setProfile(box?.profile ?? "other");
    setTargetAmount(
      box?.targetAmountCents
        ? String(box.targetAmountCents / 100).replace(".", ",")
        : "",
    );
    setPriority(String(box?.priority ?? 0));
    setReceiveRemainder(box?.config?.receiveRemainder ?? false);
    setConfigJson(
      box?.config
        ? JSON.stringify(
            {
              ...box.config,
              receiveRemainder: undefined,
            },
            null,
            2,
          ).replace('"receiveRemainder": undefined,\n', "")
        : "",
    );
    setError(null);
  }, [open, box]);

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const targetAmountCents = targetAmount.trim()
      ? parseReaisToCents(targetAmount)
      : null;

    if (targetAmount.trim() && targetAmountCents === null) {
      setError("Meta inválida.");
      setLoading(false);
      return;
    }

    let config: Record<string, unknown> | null = null;

    if (configJson.trim() || receiveRemainder) {
      let parsed: Record<string, unknown> = {};

      if (configJson.trim()) {
        try {
          parsed = JSON.parse(configJson) as Record<string, unknown>;
        } catch {
          setError("JSON de regras inválido.");
          setLoading(false);
          return;
        }
      }

      config = {
        ...parsed,
        ...(receiveRemainder ? { receiveRemainder: true } : {}),
      };
    }

    const payload = {
      name,
      description: description.trim() || undefined,
      profile,
      targetAmountCents: targetAmountCents ?? undefined,
      priority: Number(priority) || 0,
      config,
    };

    const response = await fetch(
      isEditing ? `/api/finances/boxes/${box.id}` : "/api/finances/boxes",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(data?.message ?? "Falha ao salvar caixinha.");
      setLoading(false);
      return;
    }

    const data = (await response.json()) as { box: FinanceBoxDto };
    onSaved?.(data.box);
    setOpen(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Nova caixinha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar caixinha" : "Nova caixinha"}
          </DialogTitle>
          <DialogDescription>
            Organize seu dinheiro em envelopes virtuais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="box-name">
              Nome
            </label>
            <Input
              id="box-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Proví, Investimento..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="box-profile">
              Perfil
            </label>
            <Select value={profile} onValueChange={setProfile}>
              <SelectTrigger id="box-profile">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOX_PROFILE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="box-target">
              Meta (opcional)
            </label>
            <Input
              id="box-target"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              placeholder="Ex.: 22000,00"
              inputMode="decimal"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="box-priority">
              Prioridade na alocação
            </label>
            <Input
              id="box-priority"
              type="number"
              min={0}
              max={100}
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="box-remainder"
              checked={receiveRemainder}
              onCheckedChange={(checked) =>
                setReceiveRemainder(checked === true)
              }
            />
            <label className="text-sm" htmlFor="box-remainder">
              Receber resíduo após alocações
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="box-config">
              Regras de alocação (JSON avançado)
            </label>
            <Textarea
              id="box-config"
              value={configJson}
              onChange={(event) => setConfigJson(event.target.value)}
              rows={6}
              placeholder={`{\n  "eligibleSourceIds": ["uuid-da-fonte"],\n  "allocationRules": [{\n    "id": "provi-17",\n    "type": "percent_conditional",\n    "percent": 17,\n    "condition": {\n      "field": "eligible_income_amount",\n      "operator": ">",\n      "valueCents": 300000\n    }\n  }]\n}`}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="box-description">
              Descrição (opcional)
            </label>
            <Textarea
              id="box-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
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
          <Button
            onClick={() => void handleSubmit()}
            disabled={loading || !name.trim()}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
