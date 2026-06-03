import type { LucideIcon } from "lucide-react";

export type ShellUser = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  timezone: string;
};

export type RightPanelId = "filters" | "info";

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
};
