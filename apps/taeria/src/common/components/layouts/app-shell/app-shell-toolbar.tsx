"use client";

import * as React from "react";
import { cn } from "@/common/utils/cn";
import { AppShellBreadcrumb } from "./app-shell-breadcrumb";
import { AppShellSidebarToggle } from "./app-shell-sidebar-toggle";

function AppShellToolbar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-toolbar"
      className={cn(
        "border-border bg-muted/50 flex h-10 shrink-0 items-center gap-3 border-b px-3",
        className,
      )}
      {...props}
    >
      <AppShellToolbarStart>
        <AppShellSidebarToggle />
        <AppShellBreadcrumb />
      </AppShellToolbarStart>
      {children}
    </div>
  );
}

function AppShellToolbarStart({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-toolbar-start"
      className={cn("flex min-w-0 flex-1 items-center gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function AppShellToolbarEnd({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-toolbar-end"
      className={cn("ml-auto flex shrink-0 items-center gap-1", className)}
      {...props}
    />
  );
}

export { AppShellToolbar, AppShellToolbarEnd, AppShellToolbarStart };
