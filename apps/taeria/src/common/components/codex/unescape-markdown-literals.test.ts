import { describe, expect, it } from "vitest";

import { unescapeMarkdownLiterals } from "./unescape-markdown-literals";

describe("unescapeMarkdownLiterals", () => {
  it("restaura negrito e itálico escapados pelo Turndown", () => {
    expect(
      unescapeMarkdownLiterals(
        "Havia apenas \\*\\*Kadshem\\*\\*, eterno. E \\*Senhor do Tempo\\*.",
      ),
    ).toBe("Havia apenas **Kadshem**, eterno. E *Senhor do Tempo*.");
  });

  it("não altera markdown limpo", () => {
    const clean = "Havia apenas **Kadshem**, eterno. E *Senhor do Tempo*.";
    expect(unescapeMarkdownLiterals(clean)).toBe(clean);
  });

  it("é idempotente", () => {
    const corrupted =
      "Assim surgiu \\*\\*Mana\\*\\*, a Primeira, e \\_Senhor do Tempo\\_.";
    const once = unescapeMarkdownLiterals(corrupted);
    expect(unescapeMarkdownLiterals(once)).toBe(once);
    expect(once).toBe(
      "Assim surgiu **Mana**, a Primeira, e _Senhor do Tempo_.",
    );
  });
});
