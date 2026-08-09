"use client";

import { useRef, useState, useTransition } from "react";
import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";

import { uploadCodexImageAction } from "@/modules/worldbuild/presentation/actions/codex.actions";
import { Button } from "@/common/components/ui/button";
import { Label } from "@/common/components/ui/label";
import { Spinner } from "@/common/components/feedback/spinner";

type ImageUploadFieldProps = {
  id: string;
  label: string;
  value: string;
  kindSlug: string;
  entrySlug: string;
  fieldKey: string;
  onChange: (url: string) => void;
};

function ImageUploadField({
  id,
  label,
  value,
  kindSlug,
  entrySlug,
  fieldKey,
  onChange,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFileSelect(file: File | undefined) {
    if (!file) {
      return;
    }

    if (!kindSlug || !entrySlug) {
      setError("Defina título e slug antes de enviar a imagem.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kindSlug", kindSlug);
      formData.append("entrySlug", entrySlug);
      formData.append("fieldKey", fieldKey);

      const result = await uploadCodexImageAction(formData);
      if (!result.ok || !result.url) {
        setError(result.message ?? "Não foi possível enviar a imagem.");
        return;
      }

      onChange(result.url);
    });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      {value ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="max-h-48 w-full rounded-md border object-cover"
          />
          <p className="text-muted-foreground font-mono text-xs break-all">
            {value}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              {pending ? <Spinner size="sm" /> : <UploadIcon />}
              Trocar imagem
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => onChange("")}
            >
              <Trash2Icon />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed px-4 py-8">
          <ImageIcon className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            JPEG, PNG ou WebP — até 5 MB
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? <Spinner size="sm" /> : <UploadIcon />}
            Enviar imagem
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          handleFileSelect(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { ImageUploadField };
