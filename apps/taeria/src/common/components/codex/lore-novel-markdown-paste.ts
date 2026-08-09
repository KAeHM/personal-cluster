/**
 * Detecta markdown colado e converte para HTML (TipTap/Novel).
 */

function looksLikeMarkdown(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }

  const patterns = [
    /^#{1,6}\s+\S/m,
    /\*\*[^*\n]+\*\*/,
    /__[^_\n]+__/,
    /(^|[^*\w])\*[^*\n]+\*(?!\*)/,
    /^\s*[-*+]\s+\S/m,
    /^\s*\d+\.\s+\S/m,
    /\[[^\]]+\]\([^)\s]+\)/,
    /^```[\w-]*$/m,
    /^>\s+\S/m,
    /^(-{3,}|\*{3,}|_{3,})\s*$/m,
    /!\[[^\]]*\]\([^)\s]+\)/,
  ];

  let hits = 0;
  for (const pattern of patterns) {
    if (pattern.test(trimmed)) {
      hits += 1;
      if (hits >= 1) {
        return true;
      }
    }
  }

  return false;
}

/** HTML rico de Word/Docs/preview — deixa o paste nativo cuidar. */
function looksLikeRichHtml(html: string): boolean {
  return /<(h[1-6]|ul|ol|li|blockquote|pre|table|img|strong|em)\b/i.test(html);
}

type MarkdownPasteEditor = {
  commands: {
    insertContent: (value: string) => boolean;
  };
};

/**
 * @returns true se consumiu o evento (markdown convertido).
 */
function handleMarkdownPaste(
  event: ClipboardEvent,
  editor: MarkdownPasteEditor,
  markdownToHtml: (markdown: string) => string,
): boolean {
  const text = event.clipboardData?.getData("text/plain");
  if (!text?.trim()) {
    return false;
  }

  const html = event.clipboardData?.getData("text/html") ?? "";
  if (html && looksLikeRichHtml(html)) {
    return false;
  }

  if (!looksLikeMarkdown(text)) {
    return false;
  }

  event.preventDefault();
  editor.commands.insertContent(markdownToHtml(text));
  return true;
}

export { handleMarkdownPaste, looksLikeMarkdown, looksLikeRichHtml };
