"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createEmptyCodexDraft,
  type CodexDraft,
} from "@/modules/worldbuild/domain/codex-draft";
import type { StudioLastEvent } from "@/modules/worldbuild/domain/studio-turn";
import type { StudioMessagePart } from "@/modules/worldbuild/domain/studio-message-part";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: StudioMessagePart[];
};

type CodexDraftContextValue = {
  draft: CodexDraft;
  setDraft: (draft: CodexDraft | ((prev: CodexDraft) => CodexDraft)) => void;
  messages: ChatMessage[];
  pending: boolean;
  error: string | null;
  sendMessage: (message: string, lastEvent?: StudioLastEvent) => Promise<void>;
  lastEvent: StudioLastEvent | undefined;
  setLastEvent: (event: StudioLastEvent | undefined) => void;
};

const CodexDraftContext = createContext<CodexDraftContextValue | null>(null);

function createMessageId(): string {
  return crypto.randomUUID();
}

type CodexDraftProviderProps = {
  sessionId: string;
  initialDraft?: CodexDraft;
  children: ReactNode;
};

function CodexDraftProvider({
  sessionId,
  initialDraft,
  children,
}: CodexDraftProviderProps) {
  const [draft, setDraft] = useState<CodexDraft>(
    initialDraft ?? createEmptyCodexDraft(sessionId),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<StudioLastEvent | undefined>();

  const sendMessage = useCallback(
    async (message: string, event?: StudioLastEvent) => {
      const trimmed = message.trim();
      if (!trimmed && !event) {
        return;
      }

      setPending(true);
      setError(null);

      if (trimmed) {
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "user",
            parts: [{ type: "text", text: trimmed }],
          },
        ]);
      }

      try {
        const response = await fetch("/api/studio/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed || undefined,
            draft,
            lastEvent: event ?? lastEvent,
          }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            payload?.message ?? "Falha ao conversar com o assistente.",
          );
        }

        setDraft(payload.draft);
        setLastEvent(undefined);
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId(),
            role: "assistant",
            parts: payload.parts as StudioMessagePart[],
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado.");
      } finally {
        setPending(false);
      }
    },
    [draft, lastEvent],
  );

  const value = useMemo(
    () => ({
      draft,
      setDraft,
      messages,
      pending,
      error,
      sendMessage,
      lastEvent,
      setLastEvent,
    }),
    [draft, messages, pending, error, sendMessage, lastEvent],
  );

  return (
    <CodexDraftContext.Provider value={value}>
      {children}
    </CodexDraftContext.Provider>
  );
}

function useCodexDraft() {
  const context = useContext(CodexDraftContext);
  if (!context) {
    throw new Error(
      "useCodexDraft deve ser usado dentro de CodexDraftProvider.",
    );
  }
  return context;
}

export { CodexDraftProvider, useCodexDraft };
