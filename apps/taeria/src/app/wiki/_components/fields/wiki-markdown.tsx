import ReactMarkdown from "react-markdown";

import { unescapeMarkdownLiterals } from "@/common/components/codex/unescape-markdown-literals";

type WikiMarkdownProps = {
  markdown: string;
};

function WikiMarkdown({ markdown }: WikiMarkdownProps) {
  const source = unescapeMarkdownLiterals(markdown);
  if (!source.trim()) {
    return null;
  }

  return (
    <div className="wiki-prose wiki-markdown mx-auto">
      <ReactMarkdown>{source}</ReactMarkdown>
    </div>
  );
}

export { WikiMarkdown };
