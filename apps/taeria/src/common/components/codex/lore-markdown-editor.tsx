"use client";

import { LoreNovelEditor } from "@/common/components/codex/lore-novel-editor";
import type { LoreNovelUploadContext } from "@/common/components/codex/lore-novel-image-upload";

type LoreMarkdownEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  expanded?: boolean;
  id?: string;
  placeholder?: string;
  editorKey?: string;
  className?: string;
  uploadContext?: LoreNovelUploadContext;
};

/** Editor WYSIWYG (Novel) — sem abas Markdown/Pré-visualizar. */
function LoreMarkdownEditor({
  value,
  onChange,
  placeholder,
  editorKey,
  className,
  uploadContext,
}: LoreMarkdownEditorProps) {
  return (
    <LoreNovelEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      editorKey={editorKey}
      className={className}
      uploadContext={uploadContext}
    />
  );
}

export { LoreMarkdownEditor };
