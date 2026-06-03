"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";

import { LinkPhoneModal } from "@/components/shell/LinkPhoneModal";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";

export function LinkPhoneNavbarButton() {
  const router = useRouter();
  const { hasPhone, setUserPhone } = useShell();
  const [open, setOpen] = useState(false);

  if (hasPhone) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden gap-1.5 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Phone className="size-4" />
        Vincular número
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Vincular número"
      >
        <Phone className="size-4" />
      </Button>

      <LinkPhoneModal
        open={open}
        onOpenChange={setOpen}
        onLinked={(phone) => {
          setUserPhone(phone);
          router.refresh();
        }}
      />
    </>
  );
}
