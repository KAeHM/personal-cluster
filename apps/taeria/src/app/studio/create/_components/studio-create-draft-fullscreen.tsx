"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { DraftPanelContent } from "./draft-panel";
import { useStudioCreateUi } from "./studio-create-ui-context";

function StudioCreateDraftFullscreen() {
  const { fullscreenOpen, setFullscreenOpen } = useStudioCreateUi();

  return (
    <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
      <DialogContent
        showCloseButton
        className="flex h-[min(92vh,900px)] max-h-[92vh] w-[min(96vw,960px)] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[96vw]"
      >
        <DialogHeader className="border-border shrink-0 border-b px-6 py-4 text-left">
          <DialogTitle>Rascunho da entidade</DialogTitle>
          <DialogDescription>
            Revise e edite os campos antes de criar no codex.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <DraftPanelContent expanded />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { StudioCreateDraftFullscreen };
