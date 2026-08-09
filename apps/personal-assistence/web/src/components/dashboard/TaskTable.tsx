"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { TaskDetailDialog } from "@/components/dashboard/TaskDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardTask, DashboardTasksPage } from "@/lib/dashboard/types";
import { formatMinutes } from "@/lib/format/time";

type TaskTableProps = {
  tasksPage: DashboardTasksPage;
  timezone: string;
  onPageChange: (page: number) => void;
  onTaskChanged?: () => void;
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

export function TaskTable({
  tasksPage,
  timezone,
  onPageChange,
  onTaskChanged,
}: TaskTableProps) {
  const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { items: tasks, total, page, pageSize, totalPages } = tasksPage;

  function openTaskDetail(task: DashboardTask) {
    setSelectedTask(task);
    setDialogOpen(true);
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  if (total === 0) {
    return (
      <div className="border-border/60 text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-sm">Nenhuma tarefa encontrada para os filtros.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-muted-foreground text-xs">
        Clique em uma tarefa para ver pausas, retomadas e tempo por trecho.
      </p>
      <div className="border-border/60 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Contexto</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Término</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task.id}
                className="hover:bg-muted/40 cursor-pointer"
                onClick={() => openTaskDetail(task)}
              >
                <TableCell className="font-medium">
                  {task.description}
                </TableCell>
                <TableCell>
                  {task.groupLabel ? (
                    <Badge variant="outline" className="font-normal">
                      {task.groupLabel}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="table-time">
                  {formatDateTime(task.startedAt, timezone)}
                </TableCell>
                <TableCell className="table-time">
                  {task.endedAt ? formatDateTime(task.endedAt, timezone) : "—"}
                </TableCell>
                <TableCell className="table-time">
                  {task.durationMinutes != null
                    ? formatMinutes(task.durationMinutes)
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      task.status === "active"
                        ? "default"
                        : task.status === "paused"
                          ? "secondary"
                          : "outline"
                    }
                    className={
                      task.status === "active"
                        ? "bg-[oklch(0.75_0.15_85/0.15)] text-[oklch(0.75_0.15_85)] hover:bg-[oklch(0.75_0.15_85/0.15)]"
                        : task.status === "paused"
                          ? "bg-muted text-muted-foreground"
                          : "bg-[oklch(0.70_0.17_160/0.15)] text-[oklch(0.70_0.17_160)] hover:bg-[oklch(0.70_0.17_160/0.15)]"
                    }
                  >
                    {task.status === "active"
                      ? "Em andamento"
                      : task.status === "paused"
                        ? "Pausada"
                        : "Finalizada"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            {rangeStart}–{rangeEnd} de {total}{" "}
            {total === 1 ? "registro" : "registros"}
          </p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-muted-foreground min-w-24 text-center text-xs">
              Página {page} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Próxima página"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <TaskDetailDialog
        task={selectedTask}
        timezone={timezone}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onTaskChanged={onTaskChanged}
        onTaskUpdated={setSelectedTask}
      />
    </>
  );
}
