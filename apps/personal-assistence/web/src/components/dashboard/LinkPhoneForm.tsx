"use client";

import { useState } from "react";
import { Loader2, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LinkPhoneFormProps = {
  onLinked: (phone: string) => void;
  layout?: "inline" | "stacked";
  showDescription?: boolean;
};

export function LinkPhoneForm({
  onLinked,
  layout = "inline",
  showDescription = true,
}: LinkPhoneFormProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/user/link-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = (await response.json()) as {
      error?: string;
      message?: string;
      phone?: string;
    };

    if (!response.ok) {
      setError(data.error ?? "Erro ao vincular telefone");
      setLoading(false);
      return;
    }

    setSuccess(data.message ?? "Telefone vinculado!");
    setPhone("");
    if (data.phone) onLinked(data.phone);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {showDescription && (
        <p className="text-xs text-muted-foreground">
          Vincule seu número WhatsApp para ver aqui as tarefas registradas por
          mensagem.
        </p>
      )}
      <div
        className={cn(
          layout === "stacked" ? "flex flex-col gap-2" : "flex gap-2",
        )}
      >
        <Input
          type="tel"
          placeholder="5511999999999"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={loading}
          required
          className={layout === "stacked" ? "w-full" : undefined}
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading}
          className={layout === "stacked" ? "w-full" : undefined}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Phone className="size-4" />
          )}
          Vincular
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-[oklch(0.70_0.17_160)]" role="status">
          {success}
        </p>
      )}
    </form>
  );
}
