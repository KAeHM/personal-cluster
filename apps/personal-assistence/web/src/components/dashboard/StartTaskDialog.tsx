"use client";

import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";

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

type StartTaskDialogProps = {
  onTaskChanged?: () => void;
};

type DuplicateClarification = {
  pausedTaskId: string;
  pausedDescription: string;
  newDescription: string;
};

type StartResponse =
  | {
      status: "started" | "resumed";
      task: { id: string; description: string };
      pausedDescription?: string | null;
    }
  | {
      status: "needs_duplicate_clarification";
      pausedTask: { id: string; description: string };
      newDescription: string;
    };

export function StartTaskDialog({ onTaskChanged }: StartTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState<string | undefined>();
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateClarification | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDescription("");
      setGroupId(undefined);
      setEstimatedMinutes("");
      setError(null);
      setDuplicate(null);
      setSuccessMessage(null);
    }
  }, [open]);

  async function submitStart() {
    const estimated = estimatedMinutes.trim()
      ? Number(estimatedMinutes)
      : undefined;

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "start",
        description,
        groupId,
        estimatedMinutes:
          estimated !== undefined && Number.isFinite(estimated)
            ? Math.round(estimated)
            : undefined,
      }),
    });

    const data = (await response.json()) as StartResponse & { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Erro ao iniciar tarefa");
      return false;
    }

    if (data.status === "needs_duplicate_clarification") {
      setDuplicate({
        pausedTaskId: data.pausedTask.id,
        pausedDescription: data.pausedTask.description,
        newDescription: data.newDescription,
      });
      return false;
    }

    if (data.status === "started" || data.status === "resumed") {
      const pausedNote =
        data.pausedDescription != null
          ? ` A tarefa “${data.pausedDescription}” foi pausada.`
          : "";

      setSuccessMessage(
        data.status === "resumed"
          ? `Tarefa retomada.${pausedNote}`
          : `Tarefa iniciada.${pausedNote}`,
      );
      onTaskChanged?.();

      setTimeout(() => setOpen(false), 1200);
      return true;
    }

    return false;
  }

  async function submitConfirm(action: "resume" | "create_new") {
    if (!duplicate) return;

    const estimated = estimatedMinutes.trim()
      ? Number(estimatedMinutes)
      : undefined;

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "start_confirm",
        action,
        pausedTaskId: duplicate.pausedTaskId,
        description,
        groupId,
        estimatedMinutes:
          estimated !== undefined && Number.isFinite(estimated)
            ? Math.round(estimated)
            : undefined,
      }),
    });

    const data = (await response.json()) as StartResponse & { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Erro ao confirmar tarefa");
      return;
    }

    if (data.status === "resumed") {
      setSuccessMessage("Tarefa retomada.");
    } else if (data.status === "started") {
      const pausedNote =
        data.pausedDescription != null
          ? ` A tarefa anterior foi pausada.`
          : "";
      setSuccessMessage(`Nova tarefa iniciada.${pausedNote}`);
    }

    onTaskChanged?.();
    setTimeout(() => setOpen(false), 1200);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    await submitStart();
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Play className="size-4" />
          Iniciar tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar tarefa</DialogTitle>
          <DialogDescription>
            Comece a contar o tempo agora, como no fluxo do WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {successMessage ? (
          <p className="rounded-lg bg-[oklch(0.70_0.17_160/0.12)] px-3 py-3 text-sm text-foreground">
            {successMessage}
          </p>
        ) : duplicate ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Já existe uma tarefa pausada parecida com{" "}
              <span className="font-medium text-foreground">
                “{duplicate.pausedDescription}”
              </span>
              . O que deseja fazer?
            </p>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                type="button"
                className="w-full"
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  void submitConfirm("resume").finally(() => setLoading(false));
                }}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  `Retomar “${duplicate.pausedDescription}”`
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  void submitConfirm("create_new").finally(() =>
                    setLoading(false),
                  );
                }}
              >
                Criar nova tarefa
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={loading}
                onClick={() => setDuplicate(null)}
              >
                Voltar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="start-description"
                className="text-sm font-medium leading-none"
              >
                Descrição
              </label>
              <Input
                id="start-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ex.: Desenvolvimento do relatório"
                disabled={loading}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="start-context"
                className="text-sm font-medium leading-none"
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
                htmlFor="start-estimated"
                className="text-sm font-medium leading-none"
              >
                Tempo estimado (minutos, opcional)
              </label>
              <Input
                id="start-estimated"
                type="number"
                min={1}
                step={1}
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(event.target.value)}
                placeholder="Ex.: 60"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
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
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Iniciar"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
