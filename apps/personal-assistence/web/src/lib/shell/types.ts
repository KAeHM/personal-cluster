import type { LucideIcon } from "lucide-react";

export type ShellUser = {
  id: string;
  name: string | null;
  email: string | null;
  timezone: string;
};

export type RightPanelId = "filters" | "info";

export type AppModuleId = "time-tracker" | "finances";

export type AppModule = {
  id: AppModuleId;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type PageMeta = {
  title: string;
  description: string;
  rightPanels?: RightPanelId[];
  moduleId: AppModuleId;
};
