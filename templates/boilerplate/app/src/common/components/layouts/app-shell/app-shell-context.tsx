"use client";

import * as React from "react";
import type {
  AppShellBreadcrumbItem,
  AppShellContextValue,
  AppShellPanelState,
  AppShellSidebarConfig,
} from "./app-shell-types";

const AppShellContext = React.createContext<AppShellContextValue | null>(null);

type AppShellProviderProps = {
  sidebar?: AppShellSidebarConfig;
  children: React.ReactNode;
};

function AppShellProvider({ sidebar = {}, children }: AppShellProviderProps) {
  const {
    enabled: sidebarEnabled = true,
    defaultOpen = true,
    width: sidebarWidth = 260,
  } = sidebar;

  const [leftOpen, setLeftOpen] = React.useState(
    sidebarEnabled ? defaultOpen : false,
  );
  const [panels, setPanels] = React.useState<AppShellPanelState[]>([]);
  const [breadcrumbs, setBreadcrumbs] = React.useState<
    AppShellBreadcrumbItem[]
  >([]);

  const toggleLeft = React.useCallback(() => {
    setLeftOpen((current) => !current);
  }, []);

  const registerPanel = React.useCallback(
    (id: string, width: number, order: number) => {
      setPanels((current) => {
        const existing = current.find((panel) => panel.id === id);

        if (existing) {
          return current.map((panel) =>
            panel.id === id ? { ...panel, width, order } : panel,
          );
        }

        return [...current, { id, width, open: false, order }];
      });
    },
    [],
  );

  const unregisterPanel = React.useCallback((id: string) => {
    setPanels((current) => current.filter((panel) => panel.id !== id));
  }, []);

  const setPanelOpen = React.useCallback((id: string, open: boolean) => {
    setPanels((current) =>
      current.map((panel) => (panel.id === id ? { ...panel, open } : panel)),
    );
  }, []);

  const togglePanel = React.useCallback((id: string) => {
    setPanels((current) =>
      current.map((panel) =>
        panel.id === id ? { ...panel, open: !panel.open } : panel,
      ),
    );
  }, []);

  const isPanelOpen = React.useCallback(
    (id: string) => panels.some((panel) => panel.id === id && panel.open),
    [panels],
  );

  const value = React.useMemo<AppShellContextValue>(
    () => ({
      sidebarEnabled,
      sidebarWidth,
      leftOpen,
      toggleLeft,
      setLeftOpen,
      panels,
      registerPanel,
      unregisterPanel,
      togglePanel,
      setPanelOpen,
      isPanelOpen,
      breadcrumbs,
      setBreadcrumbs,
    }),
    [
      sidebarEnabled,
      sidebarWidth,
      leftOpen,
      toggleLeft,
      panels,
      registerPanel,
      unregisterPanel,
      togglePanel,
      setPanelOpen,
      isPanelOpen,
      breadcrumbs,
    ],
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

function useAppShell() {
  const context = React.useContext(AppShellContext);

  if (!context) {
    throw new Error("useAppShell must be used within AppShell.");
  }

  return context;
}

function useAppShellBreadcrumbs(items: AppShellBreadcrumbItem[]) {
  const { setBreadcrumbs } = useAppShell();

  React.useEffect(() => {
    setBreadcrumbs(items);

    return () => {
      setBreadcrumbs([]);
    };
  }, [items, setBreadcrumbs]);
}

export { AppShellProvider, useAppShell, useAppShellBreadcrumbs };
