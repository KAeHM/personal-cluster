import { FolderKanban, LayoutDashboard } from "lucide-react";

import type { PageMeta, ShellNavItem } from "@/lib/shell/types";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export const APP_NAV_ITEMS: ShellNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/contexts",
    label: "Contextos",
    icon: FolderKanban,
    exact: true,
  },
];

export const PAGE_META: Record<string, PageMeta> = {
  "/dashboard": {
    title: "Dashboard",
    description:
      "Visão consolidada do seu timesheet. Registre tarefas pelo WhatsApp ou acompanhe métricas e tarefas abertas aqui.",
    rightPanels: ["filters", "info"],
  },
  "/contexts": {
    title: "Contextos",
    description:
      "Contextos de trabalho registrados pelo WhatsApp (clientes, projetos, etc.) e aliases que unem nomes parecidos.",
    rightPanels: ["info"],
  },
};

export function getPageMeta(pathname: string): PageMeta {
  return (
    PAGE_META[pathname] ?? {
      title: "Time Tracker",
      description: "Apontamento de horas via WhatsApp.",
      rightPanels: ["info"],
    }
  );
}

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const meta = getPageMeta(pathname);

  return [
    { label: "Time Tracker", href: "/dashboard" },
    { label: meta.title },
  ];
}
