"use client";

import { Suspense, type ReactNode } from "react";

import { AppNavbar } from "@/components/shell/AppNavbar";
import { AppRightPanel } from "@/components/shell/AppRightPanel";
import { AppSidebar } from "@/components/shell/AppSidebar";
import { AppToolbar } from "@/components/shell/AppToolbar";
import { ShellProvider } from "@/components/shell/shell-context";
import { Skeleton } from "@/components/ui/skeleton";
import type { ShellUser } from "@/lib/shell/types";

type AppShellProps = {
  user: ShellUser;
  children: ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  return (
    <ShellProvider user={user}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <AppNavbar />
        <Suspense
          fallback={
            <div className="flex h-10 items-center justify-end border-b border-border/60 bg-card px-3">
              <Skeleton className="size-7 rounded-md" />
            </div>
          }
        >
          <AppToolbar />
        </Suspense>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <AppSidebar />

          <div className="flex min-w-0 flex-1 transition-[margin] duration-300 ease-in-out">
            <main className="min-w-0 flex-1 overflow-y-auto transition-[padding] duration-300 ease-in-out">
              {children}
            </main>
            <AppRightPanel />
          </div>
        </div>
      </div>
    </ShellProvider>
  );
}
