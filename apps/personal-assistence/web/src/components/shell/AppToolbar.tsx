"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Filter, Info, Menu } from "lucide-react";

import { AppBreadcrumb } from "@/components/shell/AppBreadcrumb";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import {
  countActiveDashboardFilters,
  parseDashboardFilters,
} from "@/lib/dashboard/filters";
import { getBreadcrumbs, getPageMeta } from "@/lib/shell/navigation";
import type { RightPanelId } from "@/lib/shell/types";
import { cn } from "@/lib/utils";

const RIGHT_PANEL_BUTTONS: Record<
  RightPanelId,
  { label: string; icon: typeof Info }
> = {
  filters: { label: "Filtros", icon: Filter },
  info: { label: "Informações da página", icon: Info },
};

export function AppToolbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { sidebarOpen, toggleSidebar, rightPanel, toggleRightPanel } =
    useShell();
  const meta = getPageMeta(pathname);
  const breadcrumbs = getBreadcrumbs(pathname);
  const panels = meta.rightPanels ?? ["info"];
  const activeFilterCount =
    pathname === "/dashboard"
      ? countActiveDashboardFilters(parseDashboardFilters(searchParams))
      : 0;

  return (
    <div className="border-border/60 bg-card flex h-10 shrink-0 items-center justify-between border-b px-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className={cn(
            "shrink-0 transition-colors duration-200",
            sidebarOpen && "border-primary/40 bg-primary/5 text-primary",
          )}
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Ocultar menu" : "Exibir menu"}
          aria-expanded={sidebarOpen}
        >
          <Menu className="size-4" />
        </Button>

        <div
          className="bg-border hidden h-4 w-px shrink-0 sm:block"
          aria-hidden
        />

        <AppBreadcrumb
          items={breadcrumbs}
          className="hidden min-w-0 sm:block"
        />
        <h1 className="truncate text-sm font-medium sm:hidden">{meta.title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {panels.map((panelId) => {
          const config = RIGHT_PANEL_BUTTONS[panelId];
          const Icon = config.icon;
          const isActive = rightPanel === panelId;

          const showFilterBadge =
            panelId === "filters" && activeFilterCount > 0;

          return (
            <Button
              key={panelId}
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                "relative transition-colors duration-200",
                isActive && "bg-primary/10 text-primary",
              )}
              onClick={() => toggleRightPanel(panelId)}
              aria-label={
                showFilterBadge
                  ? `${config.label} (${activeFilterCount} ativos)`
                  : config.label
              }
              aria-pressed={isActive}
            >
              <Icon className="size-4" />
              {showFilterBadge && (
                <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
