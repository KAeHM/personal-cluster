"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { RightPanelId, ShellUser } from "@/lib/shell/types";

type ShellContextValue = {
  user: ShellUser;
  hasPhone: boolean;
  setUserPhone: (phone: string) => void;
  sidebarOpen: boolean;
  rightPanel: RightPanelId | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleRightPanel: (panel: RightPanelId) => void;
  closeRightPanel: () => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

type ShellProviderProps = {
  user: ShellUser;
  children: ReactNode;
};

export function ShellProvider({ user: initialUser, children }: ShellProviderProps) {
  const [user, setUser] = useState(initialUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanel, setRightPanel] = useState<RightPanelId | null>(null);

  const hasPhone = !!user.phone?.trim();

  const setUserPhone = useCallback((phone: string) => {
    setUser((current) => ({ ...current, phone }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  const toggleRightPanel = useCallback((panel: RightPanelId) => {
    setRightPanel((current) => (current === panel ? null : panel));
  }, []);

  const closeRightPanel = useCallback(() => {
    setRightPanel(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      hasPhone,
      setUserPhone,
      sidebarOpen,
      rightPanel,
      toggleSidebar,
      setSidebarOpen,
      toggleRightPanel,
      closeRightPanel,
    }),
    [
      user,
      hasPhone,
      setUserPhone,
      sidebarOpen,
      rightPanel,
      toggleSidebar,
      toggleRightPanel,
      closeRightPanel,
    ],
  );

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

export function useShell() {
  const context = useContext(ShellContext);

  if (!context) {
    throw new Error("useShell must be used within ShellProvider");
  }

  return context;
}
