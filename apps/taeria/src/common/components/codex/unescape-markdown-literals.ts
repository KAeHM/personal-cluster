/**
 * Remove escapes de pontuação Markdown introduzidos pelo Turndown quando o
 * usuário colava `**negrito**` / `*itálico*` como texto plano no editor rich-text.
 * Conteúdo novo (textarea) não passa por isso; serve de rede de segurança.
 */
const MARKDOWN_PUNCTUATION_ESCAPE = /\\([\\`*_{}[\]()#+\-.!|>])/g;

export function unescapeMarkdownLiterals(markdown: string): string {
  if (!markdown.includes("\\")) {
    return markdown;
  }

  return markdown.replace(MARKDOWN_PUNCTUATION_ESCAPE, "$1");
}
