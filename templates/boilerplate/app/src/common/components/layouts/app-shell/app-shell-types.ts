export type AppShellBreadcrumbItem = {
  label: string;
  href?: string;
};

export type AppShellPanelState = {
  id: string;
  open: boolean;
  width: number;
  order: number;
};

export type AppShellSidebarConfig = {
  enabled?: boolean;
  defaultOpen?: boolean;
  width?: number;
};

export type AppShellContextValue = {
  sidebarEnabled: boolean;
  sidebarWidth: number;
  leftOpen: boolean;
  toggleLeft: () => void;
  setLeftOpen: (open: boolean) => void;
  panels: AppShellPanelState[];
  registerPanel: (id: string, width: number, order: number) => void;
  unregisterPanel: (id: string) => void;
  togglePanel: (id: string) => void;
  setPanelOpen: (id: string, open: boolean) => void;
  isPanelOpen: (id: string) => boolean;
  breadcrumbs: AppShellBreadcrumbItem[];
  setBreadcrumbs: (items: AppShellBreadcrumbItem[]) => void;
};
