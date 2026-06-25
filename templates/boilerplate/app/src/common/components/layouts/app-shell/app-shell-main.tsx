"use client";

import * as React from "react";
import { cn } from "@/common/utils/cn";

function AppShellMain({
  className,
  children,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="app-shell-main"
      className={cn(
        "bg-background min-h-0 min-w-0 flex-1 overflow-y-auto",
        className,
      )}
      {...props}
    >
      {children}
    </main>
  );
}

export { AppShellMain };
