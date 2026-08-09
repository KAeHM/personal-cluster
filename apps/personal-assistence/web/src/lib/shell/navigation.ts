import {
  FolderKanban,
  LayoutDashboard,
  Timer,
  Wallet,
  Landmark,
  type LucideIcon,
} from "lucide-react";

import type {
  AppModule,
  AppModuleId,
  PageMeta,
  ShellNavItem,
} from "@/lib/shell/types";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export const APP_MODULES: AppModule[] = [
  {
    id: "time-tracker",
    label: "Time Tracker",
    href: "/dashboard",
    icon: Timer,
  },
  {
    id: "finances",
    label: "Finanças",
    href: "/finances",
    icon: Wallet,
  },
];

export const MODULE_NAV_ITEMS: Record<AppModuleId, ShellNavItem[]> = {
  "time-tracker": [
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
  ],
  finances: [
    {
      href: "/finances",
      label: "Caixinhas",
      icon: Wallet,
      exact: false,
    },
    {
      href: "/finances/fontes",
      label: "Fontes de renda",
      icon: Landmark,
      exact: true,
    },
  ],
};

const PAGE_META_BY_PATH: Record<string, PageMeta> = {
  "/dashboard": {
    title: "Dashboard",
    description:
      "Visão consolidada do seu timesheet. Registre tarefas, acompanhe métricas e tarefas abertas.",
    rightPanels: ["filters", "info"],
    moduleId: "time-tracker",
  },
  "/contexts": {
    title: "Contextos",
    description:
      "Contextos de trabalho (clientes, projetos, etc.) e aliases que unem nomes parecidos.",
    rightPanels: ["info"],
    moduleId: "time-tracker",
  },
  "/finances": {
    title: "Caixinhas",
    description:
      "Caixinhas para organizar entradas, saídas, transferências e metas financeiras.",
    rightPanels: ["info"],
    moduleId: "finances",
  },
  "/finances/fontes": {
    title: "Fontes de renda",
    description:
      "Cadastre fontes fixas e variáveis e configure sua renda fixa mensal.",
    rightPanels: ["info"],
    moduleId: "finances",
  },
};

const MODULE_DEFAULT_META: Record<AppModuleId, PageMeta> = {
  "time-tracker": {
    title: "Dashboard",
    description: "Apontamento de horas pelo dashboard.",
    rightPanels: ["info"],
    moduleId: "time-tracker",
  },
  finances: {
    title: "Caixinhas",
    description: "Organize suas finanças em caixinhas.",
    rightPanels: ["info"],
    moduleId: "finances",
  },
};

export function getModuleFromPathname(pathname: string): AppModuleId {
  if (pathname.startsWith("/finances")) {
    return "finances";
  }

  return "time-tracker";
}

export function getModuleById(moduleId: AppModuleId): AppModule {
  const module = APP_MODULES.find((item) => item.id === moduleId);
  if (!module) {
    throw new Error(`Unknown module: ${moduleId}`);
  }

  return module;
}

export function getModuleNavItems(moduleId: AppModuleId): ShellNavItem[] {
  return MODULE_NAV_ITEMS[moduleId];
}

export function getPageMeta(pathname: string): PageMeta {
  if (pathname.startsWith("/finances/caixinhas/")) {
    return {
      title: "Caixinha",
      description: "Detalhe da caixinha e histórico de movimentações.",
      rightPanels: ["info"],
      moduleId: "finances",
    };
  }

  return (
    PAGE_META_BY_PATH[pathname] ??
    MODULE_DEFAULT_META[getModuleFromPathname(pathname)]
  );
}

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const moduleId = getModuleFromPathname(pathname);
  const module = getModuleById(moduleId);
  const meta = getPageMeta(pathname);

  if (pathname === module.href) {
    return [{ label: module.label }];
  }

  if (pathname.startsWith("/finances/caixinhas/")) {
    return [{ label: module.label, href: module.href }, { label: meta.title }];
  }

  if (pathname.startsWith("/finances/fontes")) {
    return [{ label: module.label, href: module.href }, { label: meta.title }];
  }

  return [{ label: module.label, href: module.href }, { label: meta.title }];
}

/** @deprecated Use getModuleNavItems(getModuleFromPathname(pathname)) */
export const APP_NAV_ITEMS: ShellNavItem[] = [
  ...MODULE_NAV_ITEMS["time-tracker"],
  ...MODULE_NAV_ITEMS.finances,
];

export type { LucideIcon };
