"use client";

import * as React from "react";
import { cn } from "@/common/utils/cn";

function AppShellNavbar({
  className,
  children,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="app-shell-navbar"
      className={cn(
        "border-border bg-background text-foreground flex h-12 shrink-0 items-center gap-3 border-b px-4",
        className,
      )}
      {...props}
    >
      {children}
    </header>
  );
}

function AppShellNavbarStart({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-navbar-start"
      className={cn("flex min-w-0 items-center gap-3", className)}
      {...props}
    />
  );
}

function AppShellNavbarCenter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-navbar-center"
      className={cn(
        "flex min-w-0 flex-1 items-center justify-center gap-3",
        className,
      )}
      {...props}
    />
  );
}

function AppShellNavbarEnd({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-navbar-end"
      className={cn("ml-auto flex shrink-0 items-center gap-2", className)}
      {...props}
    />
  );
}

export {
  AppShellNavbar,
  AppShellNavbarCenter,
  AppShellNavbarEnd,
  AppShellNavbarStart,
};
