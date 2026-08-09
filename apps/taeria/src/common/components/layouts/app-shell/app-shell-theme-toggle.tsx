"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
import { useTheme } from "@teispace/next-themes";
import { cn } from "@/common/utils/cn";
import { AnimatedThemeToggler } from "@/common/components/effects/animated-theme-toggler";

type AppShellThemeToggleProps = {
  className?: string;
  variant?: React.ComponentProps<typeof AnimatedThemeToggler>["variant"];
};

function subscribe() {
  return () => {};
}

function AppShellThemeToggle({
  className,
  variant = "circle",
}: AppShellThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div
        data-slot="app-shell-theme-toggle"
        className={cn("bg-muted size-8 shrink-0 rounded-md", className)}
        aria-hidden
      />
    );
  }

  return (
    <AnimatedThemeToggler
      data-slot="app-shell-theme-toggle"
      variant={variant}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onThemeChange={setTheme}
      className={className}
    />
  );
}

export { AppShellThemeToggle };
