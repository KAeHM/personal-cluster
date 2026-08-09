"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { DashboardFiltersPanel } from "@/components/dashboard/DashboardFiltersPanel";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getPageMeta } from "@/lib/shell/navigation";
import { cn } from "@/lib/utils";

const PANEL_WIDTH = "w-80";

export function AppRightPanel() {
  const pathname = usePathname();
  const { rightPanel, closeRightPanel, user } = useShell();
  const meta = getPageMeta(pathname);
  const isOpen = rightPanel !== null;

  return (
    <aside
      className={cn(
        "border-border/60 bg-card flex shrink-0 flex-col overflow-hidden border-l",
        "shell-transition transition-[width,border-color] duration-300 ease-in-out",
        isOpen ? PANEL_WIDTH : "w-0 border-transparent",
      )}
      aria-hidden={!isOpen}
    >
      <div
        className={cn(
          "flex h-full flex-col",
          PANEL_WIDTH,
          "transition-opacity duration-200",
          isOpen ? "opacity-100 delay-75" : "pointer-events-none opacity-0",
        )}
      >
        <div className="border-border/60 flex h-10 shrink-0 items-center justify-between border-b px-4">
          <h2 className="text-sm font-medium">
            {rightPanel === "filters"
              ? "Filtros"
              : rightPanel === "info"
                ? "Informações"
                : "Painel"}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={closeRightPanel}
            tabIndex={isOpen ? 0 : -1}
            aria-label="Fechar painel"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {rightPanel === "filters" && pathname === "/dashboard" && (
            <Suspense
              fallback={
                <p className="text-muted-foreground text-sm">
                  Carregando filtros…
                </p>
              }
            >
              <DashboardFiltersPanel timezone={user.timezone} />
            </Suspense>
          )}

          {rightPanel === "info" && (
            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Sobre esta página
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {meta.description}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Conta
                </p>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">Nome</dt>
                    <dd className="font-medium">{user.name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">E-mail</dt>
                    <dd className="truncate">{user.email ?? "—"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
