"use client";

import * as React from "react";
import { Boundary } from "@/common/components/feedback/boundary";

type AsyncSectionProps = {
  children: React.ReactNode;
  /** Quando true, renderiza `empty` no lugar de `children` (após carregar). */
  isEmpty?: boolean;
  /** UI de estado vazio — tipicamente `<EmptyState />`. */
  empty?: React.ReactNode;
  /** Fallback de Suspense (loading). */
  fallback?: React.ReactNode;
  /** UI de Error Boundary. */
  errorFallback?:
    | React.ReactNode
    | ((props: { error: Error; reset: () => void }) => React.ReactNode);
  className?: string;
};

/**
 * Pattern de seção async: Boundary (loading + erro) com suporte opcional a empty state.
 * Agnóstico de data-fetching — o pai decide `isEmpty` quando os dados chegam.
 */
function AsyncSection({
  children,
  isEmpty,
  empty,
  fallback,
  errorFallback,
  className,
}: AsyncSectionProps) {
  return (
    <div data-slot="async-section">
      <Boundary
        fallback={fallback}
        errorFallback={errorFallback}
        className={className}
      >
        {isEmpty && empty != null ? empty : children}
      </Boundary>
    </div>
  );
}

export { AsyncSection, type AsyncSectionProps };
