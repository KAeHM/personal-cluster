"use client";

import * as React from "react";
import Link from "next/link";
import {
  BoxesIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  UsersIcon,
} from "lucide-react";
import {
  AppShell,
  AppShellBrand,
  AppShellMain,
  AppShellNavbar,
  AppShellNavbarEnd,
  AppShellNavbarStart,
  AppShellNotifications,
  AppShellPanel,
  AppShellPanelTrigger,
  AppShellSidebar,
  AppShellToolbar,
  AppShellToolbarEnd,
  AppShellUserMenu,
} from "@/common/components/layouts/app-shell";
import type { AppShellNotification } from "@/common/components/layouts/app-shell/app-shell-notifications";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { Separator } from "@/common/components/ui/separator";

const sidebarLinks = [
  { href: "#overview", label: "Visão geral", icon: LayoutDashboardIcon },
  { href: "#metrics", label: "Métricas", icon: BoxesIcon },
  { href: "#users", label: "Usuários", icon: UsersIcon },
];

const initialNotifications: AppShellNotification[] = [
  {
    id: "1",
    title: "Deploy concluído",
    description: "A versão 1.2.0 foi publicada com sucesso.",
    time: "há 5 min",
    unread: true,
  },
  {
    id: "2",
    title: "Novo usuário",
    description: "Carla Mendes aceitou o convite.",
    time: "há 1 h",
    unread: true,
  },
  {
    id: "3",
    title: "Relatório semanal",
    description: "O resumo de métricas está disponível.",
    time: "há 3 h",
    unread: false,
  },
];

export function PreviewShell({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] =
    React.useState(initialNotifications);

  return (
    <AppShell sidebar={{ enabled: true, defaultOpen: true, width: 260 }}>
      <AppShellNavbar>
        <AppShellNavbarStart>
          <AppShellBrand
            title="Preview App"
            href="/preview"
            icon={<BoxesIcon className="size-4" />}
          />
        </AppShellNavbarStart>
        <AppShellNavbarEnd>
          <AppShellNotifications
            notifications={notifications}
            onMarkAllRead={() =>
              setNotifications((current) =>
                current.map((item) => ({ ...item, unread: false })),
              )
            }
            onNotificationSelect={(notification) =>
              setNotifications((current) =>
                current.map((item) =>
                  item.id === notification.id
                    ? { ...item, unread: false }
                    : item,
                ),
              )
            }
          />
          <AppShellUserMenu
            user={{
              name: "Demo User",
              email: "demo@boilerplate.dev",
            }}
            items={[
              {
                label: "Voltar ao início",
                onSelect: () => {
                  window.location.href = "/";
                },
              },
            ]}
          />
        </AppShellNavbarEnd>
      </AppShellNavbar>

      <AppShellToolbar>
        <AppShellToolbarEnd>
          <AppShellPanelTrigger panelId="help" aria-label="Ajuda">
            <HelpCircleIcon />
          </AppShellPanelTrigger>
        </AppShellToolbarEnd>
      </AppShellToolbar>

      <AppShellSidebar>
        <nav className="flex flex-col gap-1 p-3">
          <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
            Navegação
          </p>
          {sidebarLinks.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant="ghost"
              className="justify-start gap-2"
              asChild
            >
              <a href={href}>
                <Icon className="size-4" />
                {label}
              </a>
            </Button>
          ))}
          <Separator className="my-2" />
          <Button variant="outline" className="justify-start" asChild>
            <Link href="/">← Landing</Link>
          </Button>
        </nav>
      </AppShellSidebar>

      <AppShellPanel id="help" title="Ajuda" width={360}>
        <div className="text-muted-foreground space-y-4 p-4 text-sm">
          <p>
            Esta rota demonstra o{" "}
            <strong className="text-foreground">AppShell</strong>, estados de
            loading/error do App Router e padrões de feedback do design system.
          </p>
          <p>
            Notificações ficam no ícone da navbar. O tema é alternado pelo menu
            do avatar, com animação de View Transition.
          </p>
          <Badge variant="info">/preview</Badge>
        </div>
      </AppShellPanel>

      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
