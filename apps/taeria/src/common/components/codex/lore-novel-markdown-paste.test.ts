import { describe, expect, it, vi } from "vitest";

import {
  handleMarkdownPaste,
  looksLikeMarkdown,
  looksLikeRichHtml,
} from "./lore-novel-markdown-paste";

describe("looksLikeMarkdown", () => {
  it("detecta headings, listas e links", () => {
    expect(looksLikeMarkdown("# Título\n\ntexto")).toBe(true);
    expect(looksLikeMarkdown("- item um\n- item dois")).toBe(true);
    expect(looksLikeMarkdown("veja [link](https://x.com)")).toBe(true);
    expect(looksLikeMarkdown("```ts\nconst a = 1\n```")).toBe(true);
  });

  it("ignora texto comum", () => {
    expect(looksLikeMarkdown("olá mundo")).toBe(false);
    expect(looksLikeMarkdown("preço 10.5 reais")).toBe(false);
  });
});

describe("looksLikeRichHtml", () => {
  it("reconhece HTML estruturado", () => {
    expect(looksLikeRichHtml("<h1>Oi</h1><p>x</p>")).toBe(true);
    expect(looksLikeRichHtml("<p>só texto</p>")).toBe(false);
  });
});

describe("handleMarkdownPaste", () => {
  it("converte markdown plain e impede o paste nativo", () => {
    const preventDefault = vi.fn();
    const insertContent = vi.fn().mockReturnValue(true);
    const event = {
      preventDefault,
      clipboardData: {
        getData: (type: string) =>
          type === "text/plain" ? "# Hello\n\n**bold**" : "",
      },
    } as unknown as ClipboardEvent;

    const handled = handleMarkdownPaste(
      event,
      { commands: { insertContent } },
      (md) => (md.includes("#") ? "<h1>Hello</h1>" : md),
    );

    expect(handled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(insertContent).toHaveBeenCalledWith("<h1>Hello</h1>");
  });

  it("não interfere quando o clipboard já traz HTML rico", () => {
    const insertContent = vi.fn();
    const event = {
      preventDefault: vi.fn(),
      clipboardData: {
        getData: (type: string) =>
          type === "text/plain"
            ? "# Hello"
            : "<h1>Hello</h1><p>from preview</p>",
      },
    } as unknown as ClipboardEvent;

    expect(
      handleMarkdownPaste(event, { commands: { insertContent } }, (md) => md),
    ).toBe(false);
    expect(insertContent).not.toHaveBeenCalled();
  });
});
