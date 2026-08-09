"use client";

import { Maximize2Icon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/common/components/ui/button";
import { DraftPanelContent } from "./draft-panel";
import { useStudioCreateUi } from "./studio-create-ui-context";

const PANEL_WIDTH = 420;

function StudioCreateDraftSidebar() {
  const { draftPanelOpen, setDraftPanelOpen, openFullscreen } =
    useStudioCreateUi();

  return (
    <AnimatePresence initial={false}>
      {draftPanelOpen ? (
        <motion.aside
          id="studio-create-draft-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: PANEL_WIDTH, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="border-border bg-card absolute inset-y-0 right-0 z-20 flex shrink-0 flex-col overflow-hidden border-l shadow-lg"
        >
          <div className="flex h-full flex-col" style={{ width: PANEL_WIDTH }}>
            <header className="border-border flex h-10 shrink-0 items-center justify-between gap-2 border-b px-3">
              <p className="text-sm font-medium">Rascunho</p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Abrir rascunho em tela cheia"
                  onClick={openFullscreen}
                >
                  <Maximize2Icon className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Fechar painel de rascunho"
                  onClick={() => setDraftPanelOpen(false)}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <DraftPanelContent />
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

export { StudioCreateDraftSidebar };
