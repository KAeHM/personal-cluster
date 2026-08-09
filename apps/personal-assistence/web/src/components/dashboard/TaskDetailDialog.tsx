"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Pause, Play, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DashboardTask } from "@/lib/dashboard/types";
import { formatMinutes } from "@/lib/format/time";
import type {
  TaskAction,
  TaskDetailResponse,
} from "@/lib/tasks/task-detail-types";

type TaskDetailDialogProps = {
  task: DashboardTask | null;
  timezone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskChanged?: () => void;
  onTaskUpdated?: (task: DashboardTask) => void;
};

function formatDateTime(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const STATUS_LABELS: Record<DashboardTask["status"], string> = {
  active: "Em andamento",
  paused: "Pausada",
  closed: "Finalizada",
};

function statusBadgeClass(status: DashboardTask["status"]): string {
  if (status === "active") {
    return "bg-[oklch(0.75_0.15_85/0.15)] text-[oklch(0.75_0.15_85)] hover:bg-[oklch(0.75_0.15_85/0.15)]";
  }
  if (status === "paused") {
    return "bg-muted text-muted-foreground";
  }
  return "bg-[oklch(0.70_0.17_160/0.15)] text-[oklch(0.70_0.17_160)] hover:bg-[oklch(0.70_0.17_160/0.15)]";
}

function detailToDashboardTask(detail: TaskDetailResponse): DashboardTask {
  return {
    id: detail.taskId,
    description: detail.description,
    groupId: null,
    groupLabel: detail.groupLabel,
    startedAt: detail.startedAt,
    endedAt: detail.endedAt,
    durationMinutes:
      detail.status === "closed" ? detail.totalWorkedMinutes : null,
    status: detail.status,
  };
}

export function TaskDetailDialog({
  task,
  timezone,
  open,
  onOpenChange,
  onTaskChanged,
  onTaskUpdated,
}: TaskDetailDialogProps) {
  const [detail, setDetail] = useState<TaskDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    TaskAction | "delete" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const loadDetail = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Falha ao carregar detalhes");
      }

      const payload = (await response.json()) as TaskDetailResponse;
      setDetail(payload);
    } catch {
      setError("Não foi possível carregar os detalhes da tarefa.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const taskId = task?.id;

  useEffect(() => {
    if (open && taskId) {
      setDeleteConfirm(false);
      void loadDetail(taskId);
    } else {
      setDetail(null);
      setError(null);
      setDeleteConfirm(false);
    }
  }, [open, taskId, loadDetail]);

  async function runAction(action: TaskAction) {
    if (!task) return;

    setActionLoading(action);
    setError(null);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível atualizar a tarefa");
      }

      const nextDetail = payload as TaskDetailResponse;
      setDetail(nextDetail);
      onTaskUpdated?.(detailToDashboardTask(nextDetail));
      onTaskChanged?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar a tarefa",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!task) return;

    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setActionLoading("delete");
    setError(null);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível excluir a tarefa");
      }

      onTaskChanged?.();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível excluir a tarefa",
      );
    } finally {
      setActionLoading(null);
      setDeleteConfirm(false);
    }
  }

  if (!task) return null;

  const currentStatus = detail?.status ?? task.status;
  const showActions = currentStatus !== "closed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl lg:max-w-4xl">
        <div className="bg-muted/30 border-b px-6 py-5">
          <DialogHeader className="gap-3 text-left">
            <DialogTitle className="pr-8 text-xl leading-snug">
              {detail?.description ?? task.description}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    currentStatus === "active"
                      ? "default"
                      : currentStatus === "paused"
                        ? "secondary"
                        : "outline"
                  }
                  className={statusBadgeClass(currentStatus)}
                >
                  {STATUS_LABELS[currentStatus]}
                </Badge>
                {(detail?.groupLabel ?? task.groupLabel) && (
                  <Badge variant="secondary" className="font-normal">
                    {detail?.groupLabel ?? task.groupLabel}
                  </Badge>
                )}
                {detail && (
                  <span className="text-foreground/90 text-sm font-medium">
                    Total: {formatMinutes(detail.totalWorkedMinutes)}
                  </span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {showActions && (
            <div className="mt-4 flex flex-wrap gap-2">
              {currentStatus === "active" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={actionLoading !== null || loading}
                  onClick={() => void runAction("pause")}
                >
                  {actionLoading === "pause" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Pause className="size-4" />
                  )}
                  Pausar
                </Button>
              )}
              {currentStatus === "paused" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={actionLoading !== null || loading}
                  onClick={() => void runAction("resume")}
                >
                  {actionLoading === "resume" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  Retomar
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                disabled={actionLoading !== null || loading}
                onClick={() => void runAction("finish")}
              >
                {actionLoading === "finish" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Finalizar
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Carregando detalhes…
            </div>
          )}

          {error && (
            <p className="text-destructive mb-4 text-sm" role="alert">
              {error}
            </p>
          )}

          {detail && !loading && (
            <>
              {!detail.hasEventHistory && (
                <p className="text-muted-foreground mb-4 text-xs">
                  Histórico detalhado disponível para tarefas criadas após a
                  atualização de auditoria.
                </p>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/60 py-4 shadow-none">
                  <CardHeader className="px-4 pb-3">
                    <CardTitle className="text-sm font-medium">
                      Linha do tempo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4">
                    <ol className="border-border/80 relative space-y-0 border-l pl-4">
                      {detail.items.map((item, index) => {
                        if (item.kind === "event") {
                          return (
                            <li
                              key={`event-${index}`}
                              className="relative pb-6"
                            >
                              <span className="bg-primary absolute top-1 -left-[21px] size-2.5 rounded-full" />
                              <p className="text-sm font-medium">
                                {item.label}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {formatDateTime(item.occurredAt, timezone)}
                              </p>
                              {item.detail && (
                                <p className="text-muted-foreground mt-1 text-xs">
                                  {item.detail}
                                </p>
                              )}
                              <p className="text-muted-foreground/80 mt-0.5 text-xs">
                                Acumulado:{" "}
                                {formatMinutes(item.trackedMinutesAfter)}
                              </p>
                            </li>
                          );
                        }

                        return (
                          <li key={`period-${index}`} className="relative pb-6">
                            <span className="border-primary bg-background absolute top-1 -left-[21px] size-2.5 rounded-full border-2" />
                            <p className="text-sm font-medium">
                              Em andamento
                              {item.isLive && (
                                <span className="text-primary ml-2 text-xs font-normal">
                                  (agora)
                                </span>
                              )}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {formatDateTime(item.startedAt, timezone)}
                              {" → "}
                              {item.endedAt
                                ? formatDateTime(item.endedAt, timezone)
                                : "em curso"}
                            </p>
                            <p className="text-foreground/90 mt-1 text-xs font-medium">
                              {formatMinutes(item.minutes)} contabilizados
                            </p>
                          </li>
                        );
                      })}
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="bg-muted/20 border-t px-6 py-4 sm:justify-between">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Primeiro início</dt>
              <dd className="table-time font-medium">
                {formatDateTime(detail?.startedAt ?? task.startedAt, timezone)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Término</dt>
              <dd className="table-time font-medium">
                {(detail?.endedAt ?? task.endedAt)
                  ? formatDateTime((detail?.endedAt ?? task.endedAt)!, timezone)
                  : "—"}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {deleteConfirm && (
              <span className="text-muted-foreground text-xs">
                Confirmar exclusão?
              </span>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={actionLoading !== null || loading}
              onClick={() => void handleDelete()}
            >
              {actionLoading === "delete" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {deleteConfirm ? "Sim, excluir" : "Excluir tarefa"}
            </Button>
            {deleteConfirm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={actionLoading !== null}
                onClick={() => setDeleteConfirm(false)}
              >
                Cancelar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
