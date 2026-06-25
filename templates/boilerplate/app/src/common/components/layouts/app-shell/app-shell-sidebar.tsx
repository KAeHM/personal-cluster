"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/common/utils/cn";
import { useAppShell } from "./app-shell-context";
import { appShellTransition } from "./app-shell-motion";

function AppShellSidebar({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { sidebarEnabled, leftOpen, sidebarWidth } = useAppShell();

  if (!sidebarEnabled) {
    return null;
  }

  return (
    <motion.aside
      data-slot="app-shell-sidebar"
      initial={false}
      animate={{ width: leftOpen ? sidebarWidth : 0 }}
      transition={appShellTransition}
      className={cn(
        "border-border bg-card shrink-0 overflow-hidden border-r",
        className,
      )}
    >
      <div
        className="flex h-full flex-col overflow-y-auto"
        style={{ width: sidebarWidth }}
      >
        {children}
      </div>
    </motion.aside>
  );
}

export { AppShellSidebar };
