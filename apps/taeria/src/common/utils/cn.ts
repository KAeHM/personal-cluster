import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Junta classes condicionais (clsx) e resolve conflitos do Tailwind (tailwind-merge).
 * Use em todo componente para permitir override de classes via prop `className`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
