"use client";

import * as React from "react";
import { PanelLeftCloseIcon, PanelLeftIcon } from "lucide-react";
import { cn } from "@/common/utils/cn";
import { Button } from "@/common/components/ui/button";
import { useAppShell } from "./app-shell-context";

function AppShellSidebarToggle({ className }: { className?: string }) {
  const { sidebarEnabled, leftOpen, toggleLeft } = useAppShell();

  if (!sidebarEnabled) {
    return null;
  }

  return (
    <Button
      type="button"
      data-slot="app-shell-sidebar-toggle"
      data-state={leftOpen ? "open" : "closed"}
      variant="ghost"
      size="icon"
      aria-label={leftOpen ? "Fechar menu lateral" : "Abrir menu lateral"}
      aria-expanded={leftOpen}
      onClick={toggleLeft}
      className={cn(
        "size-8 shrink-0",
        leftOpen && "bg-accent text-accent-foreground hover:bg-accent/90",
        className,
      )}
    >
      {leftOpen ? <PanelLeftCloseIcon /> : <PanelLeftIcon />}
    </Button>
  );
}

export { AppShellSidebarToggle };
