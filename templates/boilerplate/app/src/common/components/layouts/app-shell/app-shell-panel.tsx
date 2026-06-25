"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/common/utils/cn";
import { useAppShell } from "./app-shell-context";
import { appShellTransition } from "./app-shell-motion";

type AppShellPanelProps = {
  id: string;
  width?: number;
  title?: React.ReactNode;
  order?: number;
  className?: string;
  children?: React.ReactNode;
};

function AppShellPanel({
  id,
  width = 320,
  title,
  order = 0,
  className,
  children,
}: AppShellPanelProps) {
  const { registerPanel, unregisterPanel, panels } = useAppShell();
  const panel = panels.find((entry) => entry.id === id);
  const open = panel?.open ?? false;

  React.useEffect(() => {
    registerPanel(id, width, order);

    return () => {
      unregisterPanel(id);
    };
  }, [id, width, order, registerPanel, unregisterPanel]);

  return (
    <motion.aside
      id={`app-shell-panel-${id}`}
      data-slot="app-shell-panel"
      data-panel-id={id}
      data-state={open ? "open" : "closed"}
      initial={false}
      animate={{ width: open ? width : 0 }}
      transition={appShellTransition}
      className={cn(
        "border-border bg-card shrink-0 overflow-hidden border-l",
        className,
      )}
    >
      <div className="flex h-full flex-col overflow-hidden" style={{ width }}>
        {title ? (
          <div className="border-border flex h-10 shrink-0 items-center border-b px-4 text-sm font-medium">
            {title}
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </motion.aside>
  );
}

export { AppShellPanel };
