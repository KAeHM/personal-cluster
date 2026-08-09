"use client";

import { useState } from "react";
import { SendIcon } from "lucide-react";

import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { Spinner } from "@/common/components/feedback/spinner";
import { useCodexDraft } from "./codex-draft-context";
import { StudioMessageParts } from "./studio-message-parts";

type StudioChatProps = {
  welcomeMessage?: string;
};

function StudioChat({ welcomeMessage }: StudioChatProps) {
  const { messages, pending, error, sendMessage } = useCodexDraft();
  const [input, setInput] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = input.trim();
    if (!value || pending) {
      return;
    }
    setInput("");
    await sendMessage(value);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {welcomeMessage ??
              "Descreva a entidade que você quer criar — por exemplo: uma espada lendária forjada pelo ferreiro de Valdris."}
          </p>
        ) : null}

        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "bg-primary/10 ml-8 rounded-lg p-3 text-sm"
                : "bg-muted/40 mr-4 rounded-lg p-3 text-sm"
            }
          >
            {message.role === "user" ? (
              <p className="whitespace-pre-wrap">
                {message.parts
                  .filter((part) => part.type === "text")
                  .map((part) => (part.type === "text" ? part.text : ""))
                  .join("\n")}
              </p>
            ) : (
              <StudioMessageParts parts={message.parts} />
            )}
          </div>
        ))}

        {pending ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Spinner size="sm" />
            Gerando rascunho…
          </div>
        ) : null}

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-border flex gap-2 border-t p-4"
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Mensagem para o assistente…"
          rows={2}
          disabled={pending}
          className="min-h-0 resize-none"
        />
        <Button type="submit" disabled={pending || !input.trim()} size="icon">
          <SendIcon className="size-4" />
        </Button>
      </form>
    </div>
  );
}

export { StudioChat };
