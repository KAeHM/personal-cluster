"use client";

import {
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  TextIcon,
  TextQuoteIcon,
} from "lucide-react";
import {
  Command,
  createSuggestionItems,
  renderItems,
  type UploadFn,
} from "novel";

function createLoreSuggestionItems(uploadFn: UploadFn) {
  return createSuggestionItems([
    {
      title: "Texto",
      description: "Parágrafo simples.",
      searchTerms: ["p", "paragraph", "texto"],
      icon: <TextIcon className="size-4" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleNode("paragraph", "paragraph")
          .run();
      },
    },
    {
      title: "Título 1",
      description: "Título principal da seção.",
      searchTerms: ["h1", "titulo", "heading"],
      icon: <Heading1Icon className="size-4" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "Título 2",
      description: "Subtítulo.",
      searchTerms: ["h2", "subtitulo"],
      icon: <Heading2Icon className="size-4" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    },
    {
      title: "Título 3",
      description: "Título menor.",
      searchTerms: ["h3"],
      icon: <Heading3Icon className="size-4" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    },
    {
      title: "Lista",
      description: "Lista com marcadores.",
      searchTerms: ["bullet", "ul", "lista"],
      icon: <ListIcon className="size-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Lista numerada",
      description: "Lista ordenada.",
      searchTerms: ["numbered", "ol", "ordenada"],
      icon: <ListOrderedIcon className="size-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "Citação",
      description: "Bloco de citação.",
      searchTerms: ["quote", "blockquote", "citacao"],
      icon: <TextQuoteIcon className="size-4" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleNode("paragraph", "paragraph")
          .toggleBlockquote()
          .run();
      },
    },
    {
      title: "Código",
      description: "Bloco de código.",
      searchTerms: ["code", "codigo"],
      icon: <CodeIcon className="size-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: "Separador",
      description: "Linha horizontal.",
      searchTerms: ["hr", "divider", "linha"],
      icon: <MinusIcon className="size-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      title: "Imagem",
      description: "Enviar JPEG, PNG ou WebP (até 5 MB).",
      searchTerms: ["photo", "picture", "image", "imagem", "foto"],
      icon: <ImageIcon className="size-4" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/jpeg,image/png,image/webp";
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) {
            return;
          }
          const pos = editor.view.state.selection.from;
          uploadFn(file, editor.view, pos);
        };
        input.click();
      },
    },
  ]);
}

function createLoreSlashCommand(uploadFn: UploadFn) {
  const suggestionItems = createLoreSuggestionItems(uploadFn);

  const slashCommand = Command.configure({
    suggestion: {
      items: ({ query }: { query: string }) => {
        const q = query.toLowerCase();
        if (!q) {
          return suggestionItems;
        }
        return suggestionItems.filter((item) => {
          const haystack = [
            item.title,
            item.description,
            ...(item.searchTerms ?? []),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        });
      },
      render: renderItems,
    },
  });

  return { slashCommand, suggestionItems };
}

export { createLoreSlashCommand };
