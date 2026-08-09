"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  LogOutIcon,
  PlusIcon,
  TagsIcon,
} from "lucide-react";

import { signOutAction } from "@/modules/auth/presentation/actions/auth.actions";
import type { AuthUser } from "@/modules/auth/domain/session/session";
import { AppShell } from "@/common/components/layouts/app-shell";
import { Button } from "@/common/components/ui/button";
import { cn } from "@/common/utils/cn";
import {
  CODEX_ENTRY_META_PANEL_ID,
  CODEX_ENTRY_META_SLOT_ID,
  STUDIO_TOOLBAR_END_SLOT_ID,
} from "@/app/studio/create/constants";

type StudioShellProps = {
  user: AuthUser;
  children: React.ReactNode;
};

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
}> = [
  { href: "/studio", label: "Studio", icon: LayoutDashboardIcon },
  { href: "/studio/create", label: "Criar", icon: PlusIcon },
  { href: "/studio/entries", label: "Entradas", icon: LibraryIcon },
  { href: "/studio/kinds", label: "Kinds", icon: TagsIcon },
];

function StudioNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium tracking-wide uppercase">
        Taeria
      </p>
      <ul className="space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/studio" && pathname.startsWith(`${href}/`));

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={signOutAction} className="mt-auto px-2 pt-4">
        <Button
          type="submit"
          variant="ghost"
          className="text-muted-foreground w-full justify-start"
        >
          <LogOutIcon className="size-4" />
          Sair
        </Button>
      </form>
    </nav>
  );
}

function StudioShell({ user, children }: StudioShellProps) {
  const displayName = user.name ?? user.email ?? "Usuário";

  return (
    <AppShell sidebar={{ enabled: true, defaultOpen: true, width: 260 }}>
      <AppShell.Navbar>
        <AppShell.NavbarStart>
          <AppShell.Brand
            title="Taeria"
            href="/studio"
            icon={<BookOpenIcon className="size-4" />}
          />
        </AppShell.NavbarStart>
        <AppShell.NavbarEnd>
          <AppShell.UserMenu
            user={{
              name: displayName,
              email: user.email,
            }}
          />
        </AppShell.NavbarEnd>
      </AppShell.Navbar>

      <AppShell.Toolbar>
        <AppShell.ToolbarEnd>
          <div
            id={STUDIO_TOOLBAR_END_SLOT_ID}
            className="flex items-center gap-1"
          />
        </AppShell.ToolbarEnd>
      </AppShell.Toolbar>

      <AppShell.Sidebar>
        <StudioNav />
      </AppShell.Sidebar>

      <AppShell.Panel
        id={CODEX_ENTRY_META_PANEL_ID}
        title="Detalhes"
        width={360}
        order={10}
      >
        <div id={CODEX_ENTRY_META_SLOT_ID} className="min-h-full" />
      </AppShell.Panel>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

export { StudioShell };
