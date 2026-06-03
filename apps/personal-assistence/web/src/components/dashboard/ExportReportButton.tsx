"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildDashboardQueryString } from "@/lib/dashboard/filters";
import type { DashboardFilters } from "@/lib/dashboard/types";

type ExportReportButtonProps = {
  filters: DashboardFilters;
};

function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;

  const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }

  const match = contentDisposition.match(/filename="([^"]+)"/i);
  return match?.[1] ?? null;
}

export function ExportReportButton({ filters }: ExportReportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/dashboard/export${buildDashboardQueryString(filters)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Falha ao gerar o relatório");
      }

      const blob = await response.blob();
      const filename =
        parseFilename(response.headers.get("Content-Disposition")) ??
        "relatorio-horas.pdf";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Não foi possível exportar o relatório.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={exporting}
        onClick={() => void handleExport()}
      >
        {exporting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        Exportar PDF
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
