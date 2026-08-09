"use client";

import * as React from "react";
import { cn } from "@/common/utils/cn";
import type { AppShellSidebarConfig } from "./app-shell-types";
import { AppShellProvider } from "./app-shell-context";
import { AppShellNavbar } from "./app-shell-navbar";
import { AppShellToolbar } from "./app-shell-toolbar";
import { AppShellSidebar } from "./app-shell-sidebar";
import { AppShellPanel } from "./app-shell-panel";
import { AppShellMain } from "./app-shell-main";

type AppShellParts = {
  navbar: React.ReactNode;
  toolbar: React.ReactNode;
  sidebar: React.ReactNode;
  panels: React.ReactNode[];
  main: React.ReactNode;
};

function partitionAppShellChildren(children: React.ReactNode): AppShellParts {
  const parts: AppShellParts = {
    navbar: null,
    toolbar: null,
    sidebar: null,
    panels: [],
    main: null,
  };

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }

    switch (child.type) {
      case AppShellNavbar:
        parts.navbar = child;
        break;
      case AppShellToolbar:
        parts.toolbar = child;
        break;
      case AppShellSidebar:
        parts.sidebar = child;
        break;
      case AppShellPanel:
        parts.panels.push(child);
        break;
      case AppShellMain:
        parts.main = child;
        break;
      default:
        break;
    }
  });

  return parts;
}

type AppShellProps = {
  sidebar?: AppShellSidebarConfig;
  className?: string;
  children: React.ReactNode;
};

function AppShell({ sidebar, className, children }: AppShellProps) {
  const parts = partitionAppShellChildren(children);

  return (
    <AppShellProvider sidebar={sidebar}>
      <div
        data-slot="app-shell"
        className={cn(
          "flex h-full min-h-0 flex-col overflow-hidden",
          className,
        )}
      >
        {parts.navbar}
        {parts.toolbar}
        <div
          data-slot="app-shell-body"
          className="flex min-h-0 flex-1 overflow-hidden"
        >
          {parts.sidebar}
          {parts.main}
          {parts.panels.length > 0 ? (
            <div
              data-slot="app-shell-panels"
              className="flex h-full shrink-0 overflow-hidden"
            >
              {parts.panels}
            </div>
          ) : null}
        </div>
      </div>
    </AppShellProvider>
  );
}

export { AppShell };
