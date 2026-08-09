import * as React from "react";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/common/utils/cn";

const sizeClasses = {
  sm: "size-4",
  default: "size-6",
  lg: "size-8",
} as const;

function Spinner({
  className,
  size = "default",
  label = "Carregando",
  ...props
}: React.ComponentProps<"svg"> & {
  size?: keyof typeof sizeClasses;
  label?: string;
}) {
  return (
    <Loader2Icon
      role="status"
      aria-label={label}
      data-slot="spinner"
      className={cn(
        "text-muted-foreground animate-spin",
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };
