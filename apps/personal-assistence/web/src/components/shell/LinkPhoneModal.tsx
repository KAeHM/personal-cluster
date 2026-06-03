"use client";

import { LinkPhoneForm } from "@/components/dashboard/LinkPhoneForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LinkPhoneModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked: (phone: string) => void;
};

export function LinkPhoneModal({
  open,
  onOpenChange,
  onLinked,
}: LinkPhoneModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular WhatsApp</DialogTitle>
          <DialogDescription>
            Informe seu número com DDI e DDD (ex.: 5511999999999) para registrar
            tarefas por mensagem e ver o histórico no dashboard.
          </DialogDescription>
        </DialogHeader>

        <LinkPhoneForm
          layout="stacked"
          onLinked={(phone) => {
            onLinked(phone);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
