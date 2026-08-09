"use client";

import { useMemo, useState } from "react";
import { MessageSquareIcon, PenLineIcon } from "lucide-react";

import type { Kind } from "@/modules/worldbuild/domain/kind";
import { createEmptyCodexDraft } from "@/modules/worldbuild/domain/codex-draft";
import { AppShellBreadcrumbs } from "@/common/components/layouts/app-shell";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/common/components/ui/tabs";
import { CodexDraftProvider } from "./codex-draft-context";
import { StudioChat } from "./studio-chat";
import { StudioCreateDraftFullscreen } from "./studio-create-draft-fullscreen";
import { StudioCreateDraftSidebar } from "./studio-create-draft-sidebar";
import { StudioCreateKindsProvider } from "./studio-create-kinds-context";
import { StudioCreateToolbarPortal } from "./studio-create-toolbar-portal";
import { StudioCreateUiProvider } from "./studio-create-ui-context";
import { StudioManualCreateForm } from "./studio-manual-create-form";

type StudioCreateLayoutProps = {
  kinds: Kind[];
  initialKindSlug?: string;
  welcomeMessage?: string;
  breadcrumbLabel?: string;
  /** `form` abre direto no formulário sem IA. */
  initialMode?: "assistant" | "form";
};

type CreateMode = "assistant" | "form";

function StudioCreateLayout({
  kinds,
  initialKindSlug,
  welcomeMessage,
  breadcrumbLabel = "Criar",
  initialMode = "assistant",
}: StudioCreateLayoutProps) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [mode, setMode] = useState<CreateMode>(initialMode);

  const initialDraft = useMemo(() => {
    const draft = createEmptyCodexDraft(sessionId);
    if (initialKindSlug) {
      draft.kindSlug = initialKindSlug;
    }
    return draft;
  }, [sessionId, initialKindSlug]);

  const resolvedWelcome =
    welcomeMessage ??
    (initialKindSlug
      ? `Assistente para criar entidades do tipo **${kinds.find((k) => k.slug === initialKindSlug)?.name ?? initialKindSlug}**. Descreva o que você quer criar.`
      : undefined);

  return (
    <StudioCreateKindsProvider kinds={kinds}>
      <AppShellBreadcrumbs labelMap={{ create: breadcrumbLabel }} />
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-border flex shrink-0 items-center gap-4 border-b px-4 py-2">
          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as CreateMode)}
          >
            <TabsList>
              <TabsTrigger value="assistant" className="gap-1.5">
                <MessageSquareIcon className="size-3.5" />
                Assistente
              </TabsTrigger>
              <TabsTrigger value="form" className="gap-1.5">
                <PenLineIcon className="size-3.5" />
                Formulário
              </TabsTrigger>
            </TabsList>
            <TabsContent value="assistant" className="hidden" />
            <TabsContent value="form" className="hidden" />
          </Tabs>
        </div>

        {mode === "assistant" ? (
          <CodexDraftProvider sessionId={sessionId} initialDraft={initialDraft}>
            <StudioCreateUiProvider>
              <StudioCreateToolbarPortal />
              <div className="relative flex min-h-0 flex-1 flex-col">
                <StudioChat welcomeMessage={resolvedWelcome} />
                <StudioCreateDraftSidebar />
              </div>
              <StudioCreateDraftFullscreen />
            </StudioCreateUiProvider>
          </CodexDraftProvider>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <StudioManualCreateForm
              kinds={kinds}
              initialKindSlug={initialKindSlug}
            />
          </div>
        )}
      </div>
    </StudioCreateKindsProvider>
  );
}

export { StudioCreateLayout };
