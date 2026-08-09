"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/common/utils/cn";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/common/components/ui/breadcrumb";
import { useAppShell } from "./app-shell-context";
import { segmentsToBreadcrumbs } from "./app-shell-breadcrumb-utils";
import type { AppShellBreadcrumbItem } from "./app-shell-types";

function AppShellBreadcrumb({ className }: { className?: string }) {
  const pathname = usePathname();
  const { sidebarEnabled, breadcrumbs } = useAppShell();
  const displayBreadcrumbs =
    breadcrumbs.length > 0 ? breadcrumbs : segmentsToBreadcrumbs(pathname);

  if (!sidebarEnabled || displayBreadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb
      data-slot="app-shell-breadcrumb"
      className={cn("min-w-0", className)}
    >
      <BreadcrumbList>
        {displayBreadcrumbs.map((item, index) => {
          const isLast = index === displayBreadcrumbs.length - 1;

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

type AppShellBreadcrumbsProps = {
  items?: AppShellBreadcrumbItem[];
  labelMap?: Record<string, string>;
};

function AppShellBreadcrumbs({ items, labelMap }: AppShellBreadcrumbsProps) {
  const pathname = usePathname();
  const { setBreadcrumbs } = useAppShell();

  React.useEffect(() => {
    const nextItems = items ?? segmentsToBreadcrumbs(pathname, labelMap);
    setBreadcrumbs(nextItems);

    return () => {
      setBreadcrumbs([]);
    };
  }, [items, labelMap, pathname, setBreadcrumbs]);

  return null;
}

export { AppShellBreadcrumb, AppShellBreadcrumbs };
