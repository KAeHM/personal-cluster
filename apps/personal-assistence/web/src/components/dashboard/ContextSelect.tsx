"use client";

import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContextItem } from "@/lib/contexts/types";

type ContextSelectProps = {
  value?: string;
  onChange: (groupId: string | undefined) => void;
  disabled?: boolean;
};

export function ContextSelect({
  value,
  onChange,
  disabled = false,
}: ContextSelectProps) {
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadContexts() {
      try {
        const response = await fetch("/api/contexts", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          contexts: ContextItem[];
        };
        if (!cancelled) setContexts(payload.contexts);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadContexts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Select
      value={value ?? "none"}
      onValueChange={(next) => onChange(next === "none" ? undefined : next)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={isLoading ? "Carregando contextos…" : "Sem contexto"}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Sem contexto</SelectItem>
        {contexts.map((context) => (
          <SelectItem key={context.id} value={context.id}>
            {context.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
