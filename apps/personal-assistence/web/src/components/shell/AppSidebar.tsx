"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useShell } from "@/components/shell/shell-context";
import { cn } from "@/lib/utils";
import {
  getModuleFromPathname,
  getModuleNavItems,
} from "@/lib/shell/navigation";

const SIDEBAR_WIDTH = "w-56";

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useShell();
  const navItems = getModuleNavItems(getModuleFromPathname(pathname));

  return (
    <aside
      className={cn(
        "border-border/60 bg-sidebar flex shrink-0 flex-col overflow-hidden border-r",
        "shell-transition transition-[width,border-color] duration-300 ease-in-out",
        sidebarOpen ? SIDEBAR_WIDTH : "w-0 border-transparent",
      )}
      aria-hidden={!sidebarOpen}
    >
      <nav
        className={cn(
          "flex flex-1 flex-col gap-1 p-3",
          SIDEBAR_WIDTH,
          "transition-opacity duration-200",
          sidebarOpen
            ? "opacity-100 delay-75"
            : "pointer-events-none opacity-0",
        )}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              tabIndex={sidebarOpen ? 0 : -1}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
