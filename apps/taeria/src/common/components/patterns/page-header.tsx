import * as React from "react";
import { cn } from "@/common/utils/cn";
import { Separator } from "@/common/components/ui/separator";

function PageHeader({
  className,
  separator = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  separator?: boolean;
}) {
  return (
    <div
      data-slot="page-header"
      className={cn("space-y-4", className)}
      {...props}
    >
      {children}
      {separator && <Separator />}
    </div>
  );
}

function PageHeaderRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-row"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    />
  );
}

function PageHeaderContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-content"
      className={cn("min-w-0 space-y-1", className)}
      {...props}
    />
  );
}

function PageHeaderTitle({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="page-header-title"
      className={cn(
        "font-display text-2xl font-semibold tracking-wide",
        className,
      )}
      {...props}
    />
  );
}

function PageHeaderDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="page-header-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function PageHeaderActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn("flex shrink-0 flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

export {
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageHeaderDescription,
  PageHeaderRow,
  PageHeaderTitle,
};
