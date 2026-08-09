"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Loader2 } from "lucide-react";

import { ContextSelect } from "@/components/dashboard/ContextSelect";
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
  formatEndTimePreview,
  toDatetimeLocalValue,
} from "@/lib/format/datetime-local";
import { formatMinutes } from "@/lib/format/time";

type ManualTimeEntryDialogProps = {
  timezone: string;
  onTaskChanged?: () => void;
};

export function ManualTimeEntryDialog({
  timezone,
  onTaskChanged,
}: ManualTimeEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [startedAt, setStartedAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [groupId, setGroupId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endPreview = useMemo(() => {
    const minutes = Number(durationMinutes);
    if (!Number.isFinite(minutes)) return null;
    return formatEndTimePreview(startedAt, minutes, timezone);
  }, [startedAt, durationMinutes, timezone]);

  useEffect(() => {
    if (open) {
      setStartedAt(toDatetimeLocalValue(new Date(), timezone));
      setError(null);
    } else {
      setDescription("");
      setDurationMinutes("");
      setGroupId(undefined);
      setError(null);
    }
  }, [open, timezone]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const minutes = Number(durationMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setError("Informe uma duração válida em minutos");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "manual",
        description,
        startedAt,
        durationMinutes: Math.round(minutes),
        groupId,
      }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Erro ao registrar horas");
      setLoading(false);
      return;
    }

    setOpen(false);
    onTaskChanged?.();
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="size-4" />
          Registrar horas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar horas manualmente</DialogTitle>
          <DialogDescription>
            Informe o início e a duração. O término é calculado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="manual-description"
              className="text-sm leading-none font-medium"
            >
              Descrição
            </label>
            <Input
              id="manual-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex.: Reunião com cliente"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="manual-context"
              className="text-sm leading-none font-medium"
            >
              Contexto
            </label>
            <ContextSelect
              value={groupId}
              onChange={setGroupId}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="manual-started-at"
              className="text-sm leading-none font-medium"
            >
              Início
            </label>
            <Input
              id="manual-started-at"
              type="datetime-local"
              value={startedAt}
              onChange={(event) => setStartedAt(event.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="manual-duration"
              className="text-sm leading-none font-medium"
            >
              Duração (minutos)
            </label>
            <Input
              id="manual-duration"
              type="number"
              min={1}
              max={1440}
              step={1}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              placeholder="Ex.: 90"
              disabled={loading}
              required
            />
          </div>

          {endPreview && (
            <p className="bg-muted/60 text-muted-foreground rounded-lg px-3 py-2 text-sm">
              Término calculado:{" "}
              <span className="text-foreground font-medium">{endPreview}</span>
              {Number(durationMinutes) > 0 && (
                <span className="ml-1">
                  ({formatMinutes(Math.round(Number(durationMinutes)))})
                </span>
              )}
            </p>
          )}

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
