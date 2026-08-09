const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function parseReaisToCents(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  if (!normalized) {
    return null;
  }

  const reais = Number(normalized);

  if (!Number.isFinite(reais) || reais <= 0) {
    return null;
  }

  return Math.round(reais * 100);
}
