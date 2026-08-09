"use client";

import { useState } from "react";
import { FileTextIcon, Maximize2Icon } from "lucide-react";

import { LoreNovelEditor } from "@/common/components/codex/lore-novel-editor";
import { Button } from "@/common/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Label } from "@/common/components/ui/label";

type MarkdownFacetFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (markdown: string) => void;
  uploadContext?: {
    kindSlug: string;
    entrySlug: string;
  };
  fieldKey: string;
};

function previewText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function MarkdownFacetField({
  id,
  label,
  value,
  onChange,
  uploadContext,
  fieldKey,
}: MarkdownFacetFieldProps) {
  const [open, setOpen] = useState(false);
  const preview = previewText(value);
  const hasContent = preview.length > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="min-w-0 truncate">
          {label}
        </Label>
        <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1 text-[10px] font-medium tracking-wide uppercase">
          <FileTextIcon className="size-3" />
          Markdown
        </span>
      </div>

      <div className="border-border bg-muted/30 flex items-start gap-2 rounded-md border p-2.5">
        <p
          id={id}
          className="text-muted-foreground min-w-0 flex-1 text-xs leading-relaxed"
        >
          {hasContent ? (
            <span className="line-clamp-3">{preview}</span>
          ) : (
            <span className="italic">Vazio — abra o editor para escrever.</span>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => setOpen(true)}
        >
          <Maximize2Icon className="size-3.5" />
          Editar
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="flex h-[min(92vh,840px)] max-h-[92vh] w-[min(96vw,900px)] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[96vw]"
        >
          <DialogHeader className="border-border shrink-0 border-b px-6 py-4 text-left">
            <DialogTitle>{label}</DialogTitle>
            <DialogDescription>
              Edite o conteúdo em markdown com o editor visual.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {open ? (
              <LoreNovelEditor
                value={value}
                onChange={onChange}
                editorKey={id}
                placeholder={`Escreva ${label.toLowerCase()}… Digite / para comandos.`}
                className="w-full max-w-none"
                uploadContext={
                  uploadContext ? { ...uploadContext, fieldKey } : undefined
                }
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { MarkdownFacetField };
