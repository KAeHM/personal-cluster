import ReactMarkdown from "react-markdown";

import { unescapeMarkdownLiterals } from "@/common/components/codex/unescape-markdown-literals";

type LoreNovelPreviewProps = {
  markdown: string;
  compact?: boolean;
};

function LoreNovelPreview({
  markdown,
  compact = false,
}: LoreNovelPreviewProps) {
  const source = unescapeMarkdownLiterals(markdown);
  if (!source.trim()) {
    return (
      <p className="text-muted-foreground text-sm italic">
        Sem conteúdo de lore.
      </p>
    );
  }

  return (
    <div
      className={`lore-md-preview text-foreground space-y-2 ${
        compact ? "text-sm" : "text-base"
      } [&_blockquote]:border-muted [&_blockquote]:text-muted-foreground [&_code]:bg-muted [&_pre]:bg-muted/50 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:px-1 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-medium [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-relaxed [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:p-3 [&_ul]:list-disc [&_ul]:pl-5`}
    >
      <ReactMarkdown>{source}</ReactMarkdown>
    </div>
  );
}

export { LoreNovelPreview };
