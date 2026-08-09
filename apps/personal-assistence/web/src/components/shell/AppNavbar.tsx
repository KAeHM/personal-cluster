"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserMenu } from "@/components/shell/UserMenu";
import { cn } from "@/lib/utils";
import { APP_MODULES, getModuleFromPathname } from "@/lib/shell/navigation";

export function AppNavbar() {
  const pathname = usePathname();
  const activeModuleId = getModuleFromPathname(pathname);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-black/20 bg-[oklch(0.20_0.01_285)] px-4">
      <nav
        aria-label="Módulos"
        className="flex min-w-0 items-center gap-1 overflow-x-auto"
      >
        {APP_MODULES.map((module) => {
          const Icon = module.icon;
          const isActive = module.id === activeModuleId;

          return (
            <Link
              key={module.id}
              href={module.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn("size-4 shrink-0", isActive && "text-primary")}
              />
              {module.label}
            </Link>
          );
        })}
      </nav>

      <UserMenu />
    </header>
  );
}
