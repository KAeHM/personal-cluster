"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/common/utils/cn";

type AppShellBrandProps = {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  className?: string;
};

function AppShellBrand({ title, href, icon, className }: AppShellBrandProps) {
  const content = (
    <>
      {icon && (
        <span className="bg-muted text-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
          {icon}
        </span>
      )}
      <span className="truncate font-semibold">{title}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        data-slot="app-shell-brand"
        className={cn(
          "text-foreground flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      data-slot="app-shell-brand"
      className={cn(
        "text-foreground flex min-w-0 items-center gap-2",
        className,
      )}
    >
      {content}
    </div>
  );
}

export { AppShellBrand };
