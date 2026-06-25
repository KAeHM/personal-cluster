"use client";

import * as React from "react";
import { Suspense } from "react";
import { cn } from "@/common/utils/cn";
import { ErrorDisplay } from "@/common/components/feedback/error-display";
import { Spinner } from "@/common/components/feedback/spinner";

type ErrorFallbackRender = (props: {
  error: Error;
  reset: () => void;
}) => React.ReactNode;

type BoundaryProps = {
  children: React.ReactNode;
  /** Fallback enquanto Suspense está pendente. */
  fallback?: React.ReactNode;
  /** UI quando um Error Boundary captura uma exceção. */
  errorFallback?: React.ReactNode | ErrorFallbackRender;
  className?: string;
};

type ErrorBoundaryState = { error: Error | null };

class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onReset?: () => void;
    fallback: React.ReactNode | ErrorFallbackRender;
  },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (error) {
      const { fallback } = this.props;
      return typeof fallback === "function"
        ? fallback({ error, reset: this.reset })
        : fallback;
    }
    return this.props.children;
  }
}

function DefaultLoadingFallback({ className }: { className?: string }) {
  return (
    <div
      data-slot="boundary-loading"
      className={cn(
        "border-border bg-muted/30 flex min-h-24 items-center justify-center rounded-lg border",
        className,
      )}
    >
      <Spinner size="lg" />
    </div>
  );
}

function DefaultErrorFallback({
  error,
  reset,
  className,
}: {
  error: Error;
  reset: () => void;
  className?: string;
}) {
  return <ErrorDisplay error={error} onRetry={reset} className={className} />;
}

/**
 * Combina Suspense (loading) + Error Boundary (erro) num único wrapper.
 * Agnóstico de data-fetching — use com React.lazy, `use()` ou streaming do App Router.
 */
function Boundary({
  children,
  fallback,
  errorFallback,
  className,
}: BoundaryProps) {
  const resolvedErrorFallback =
    errorFallback ??
    (({ error, reset }) => (
      <DefaultErrorFallback error={error} reset={reset} className={className} />
    ));

  const resolvedLoadingFallback = fallback ?? (
    <DefaultLoadingFallback className={className} />
  );

  return (
    <ErrorBoundary fallback={resolvedErrorFallback}>
      <Suspense fallback={resolvedLoadingFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}

export {
  Boundary,
  DefaultErrorFallback,
  DefaultLoadingFallback,
  ErrorBoundary,
};
