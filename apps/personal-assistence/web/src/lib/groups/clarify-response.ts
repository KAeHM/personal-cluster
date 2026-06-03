export type ClarificationAnswer = "yes" | "no" | "unclear";

const EXACT_YES = new Set([
  "sim",
  "s",
  "yes",
  "y",
  "é",
  "isso",
  "mesmo",
  "correto",
  "confirmo",
  "pode ser",
  "é o mesmo",
  "mesma coisa",
  "e o mesmo",
]);

const EXACT_NO = new Set([
  "não",
  "nao",
  "n",
  "no",
  "negativo",
  "outro",
  "diferente",
  "não é",
  "nao e",
  "nao é",
  "outra",
  "separado",
  "e outro",
  "algo separado",
]);

export function parseClarificationResponse(text: string): ClarificationAnswer {
  const normalized = text.trim().toLowerCase().replace(/[.!]+$/g, "");

  if (!normalized) return "unclear";

  if (normalized.length > 35) return "unclear";

  if (EXACT_YES.has(normalized)) return "yes";
  if (EXACT_NO.has(normalized)) return "no";

  return "unclear";
}

export function shouldBypassPendingClarification(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (normalized.length > 45) return true;

  const commandHints = [
    "listar",
    "liste",
    "tarefas abertas",
    "finalizar",
    "finalizei",
    "terminei",
    "comecei",
    "iniciar",
    "iniciando",
    "horas",
  ];

  return commandHints.some((hint) => normalized.includes(hint));
}
