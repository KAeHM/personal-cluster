"use client";

import * as React from "react";
import { cn } from "@/common/utils/cn";
import { Button } from "@/common/components/ui/button";
import { useAppShell } from "./app-shell-context";

type AppShellPanelTriggerProps = React.ComponentProps<typeof Button> & {
  panelId: string;
};

function AppShellPanelTrigger({
  panelId,
  className,
  onClick,
  ...props
}: AppShellPanelTriggerProps) {
  const { togglePanel, isPanelOpen } = useAppShell();
  const open = isPanelOpen(panelId);

  return (
    <Button
      type="button"
      data-slot="app-shell-panel-trigger"
      data-panel-id={panelId}
      data-state={open ? "open" : "closed"}
      variant="ghost"
      size="icon"
      aria-expanded={open}
      aria-controls={`app-shell-panel-${panelId}`}
      className={cn(
        "size-8 shrink-0",
        open && "bg-accent text-accent-foreground hover:bg-accent/90",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          togglePanel(panelId);
        }
      }}
      {...props}
    />
  );
}

export { AppShellPanelTrigger };
