"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  EditorContent,
  EditorRoot,
  handleCommandNavigation,
  handleImageDrop,
  handleImagePaste,
  HorizontalRule,
  ImageResizer,
  Placeholder,
  StarterKit,
  UpdatedImage,
  UploadImagesPlugin,
  type EditorInstance,
} from "novel";
import { marked } from "marked";
import TurndownService from "turndown";

import { unescapeMarkdownLiterals } from "@/common/components/codex/unescape-markdown-literals";
import {
  createLoreNovelUploadFn,
  type LoreNovelUploadContext,
} from "@/common/components/codex/lore-novel-image-upload";
import { createLoreSlashCommand } from "@/common/components/codex/lore-novel-slash-command";
import { handleMarkdownPaste } from "@/common/components/codex/lore-novel-markdown-paste";
import { cn } from "@/common/utils/cn";

type LoreNovelEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
  /** Remonta o editor quando muda (ex.: id da entrada). */
  editorKey?: string;
  /** Necessário para `/ Imagem`, colar e arrastar arquivos. */
  uploadContext?: LoreNovelUploadContext;
};

function markdownToHtml(markdown: string): string {
  const source = unescapeMarkdownLiterals(markdown).trim();
  if (!source) {
    return "<p></p>";
  }
  return marked.parse(source, { async: false }) as string;
}

function createTurndown(): TurndownService {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  service.keep(["u"]);
  service.addRule("novelImage", {
    filter: "img",
    replacement: (_content, node) => {
      const element = node as HTMLImageElement;
      const src = element.getAttribute("src") ?? "";
      if (!src || src.startsWith("data:")) {
        return "";
      }
      const alt = element.getAttribute("alt") ?? "";
      const title = element.getAttribute("title");
      const titlePart = title ? ` "${title}"` : "";
      return `![${alt}](${src}${titlePart})`;
    },
  });
  return service;
}

const loreImage = UpdatedImage.extend({
  addProseMirrorPlugins() {
    return [
      UploadImagesPlugin({
        imageClass: "opacity-40 rounded-lg border border-border",
      }),
      ...(this.parent?.() ?? []),
    ];
  },
}).configure({
  allowBase64: true,
  HTMLAttributes: {
    class: "rounded-lg border border-border max-w-full h-auto",
  },
});

function LoreNovelEditor({
  value,
  onChange,
  placeholder = "Escreva o lore… Digite / para comandos.",
  className,
  editorKey = "lore",
  uploadContext,
}: LoreNovelEditorProps) {
  const turndown = useMemo(() => createTurndown(), []);
  const lastEmittedRef = useRef(unescapeMarkdownLiterals(value));
  const editorRef = useRef<EditorInstance | null>(null);
  const skipNextUpdateRef = useRef(false);

  const kindSlug = uploadContext?.kindSlug;
  const entrySlug = uploadContext?.entrySlug;
  const fieldKey = uploadContext?.fieldKey;

  const uploadFn = useMemo(
    () =>
      createLoreNovelUploadFn(
        kindSlug && entrySlug ? { kindSlug, entrySlug, fieldKey } : undefined,
      ),
    [kindSlug, entrySlug, fieldKey],
  );

  const { slashCommand, suggestionItems } = useMemo(
    () => createLoreSlashCommand(uploadFn),
    [uploadFn],
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: false,
      }),
      HorizontalRule,
      Placeholder.configure({
        placeholder,
        includeChildren: true,
      }),
      loreImage,
      slashCommand,
    ],
    [placeholder, slashCommand],
  );

  useEffect(() => {
    const next = unescapeMarkdownLiterals(value);
    if (next === lastEmittedRef.current) {
      return;
    }
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    skipNextUpdateRef.current = true;
    lastEmittedRef.current = next;
    editor.commands.setContent(markdownToHtml(next), false);
  }, [value]);

  return (
    <div className={cn("lore-novel-editor", className)}>
      <EditorRoot>
        <EditorContent
          key={editorKey}
          immediatelyRender={false}
          extensions={extensions}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) => {
              if (handleImagePaste(view, event, uploadFn)) {
                return true;
              }
              const editor = editorRef.current;
              if (!editor) {
                return false;
              }
              return handleMarkdownPaste(event, editor, markdownToHtml);
            },
            handleDrop: (view, event, _slice, moved) =>
              handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class: cn(
                "wiki-prose lore-novel-prose min-h-[min(70vh,40rem)] w-full max-w-none focus:outline-none",
              ),
            },
          }}
          onCreate={({ editor }) => {
            editorRef.current = editor;
            const initial = unescapeMarkdownLiterals(value);
            lastEmittedRef.current = initial;
            if (initial.trim()) {
              skipNextUpdateRef.current = true;
              editor.commands.setContent(markdownToHtml(initial), false);
            }
          }}
          onUpdate={({ editor }) => {
            if (skipNextUpdateRef.current) {
              skipNextUpdateRef.current = false;
              return;
            }
            const markdown = unescapeMarkdownLiterals(
              turndown.turndown(editor.getHTML()),
            );
            if (markdown === lastEmittedRef.current) {
              return;
            }
            lastEmittedRef.current = markdown;
            onChange(markdown);
          }}
          slotAfter={<ImageResizer />}
        >
          <EditorCommand className="border-border bg-popover z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border px-1 py-2 shadow-md transition-all">
            <EditorCommandEmpty className="text-muted-foreground px-2 py-1.5 text-sm">
              Nenhum comando encontrado.
            </EditorCommandEmpty>
            <EditorCommandList>
              {suggestionItems.map((item) => (
                <EditorCommandItem
                  key={item.title}
                  value={item.title}
                  onCommand={(val) => item.command?.(val)}
                  className="hover:bg-accent aria-selected:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
                >
                  <div className="border-border bg-background flex size-8 shrink-0 items-center justify-center rounded-md border">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.description}
                    </p>
                  </div>
                </EditorCommandItem>
              ))}
            </EditorCommandList>
          </EditorCommand>
        </EditorContent>
      </EditorRoot>
    </div>
  );
}

export { LoreNovelEditor };
export type { LoreNovelUploadContext };
