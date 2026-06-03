export function isCloseAllPausedIntent(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return (
    /\b(fechar|finalizar)\b/.test(normalized) &&
    /\b(todas?\s+(as\s+)?)?(tarefas?\s+)?pausadas?\b/.test(normalized)
  );
}

export function isFinalizeIntent(text: string): boolean {
  const normalized = text.trim().toLowerCase();

  if (!normalized || normalized.length > 120) return false;
  if (isCloseAllPausedIntent(text)) return false;

  const hasFinishVerb = /\b(finalizar|finalizei|encerrar|terminar|fechar)\b/.test(
    normalized,
  );
  if (!hasFinishVerb) return false;

  if (
    /\b(comecei|começar|iniciar|iniciando|retomar|retomei|listar|liste)\b/.test(
      normalized,
    )
  ) {
    return false;
  }

  return true;
}

export function extractFinishTargetHint(text: string): string | null {
  const match = text.trim().match(
    /^(?:finalizar|encerrar|terminar|fechar)\s+(?:a\s+)?(?:tarefa\s+)?(.+)$/i,
  );
  if (!match?.[1]) return null;

  const hint = match[1].trim();
  if (!hint || /^(tarefa|task)$/i.test(hint)) return null;

  return hint;
}

export function isGenericFinalizeMessage(text: string): boolean {
  return isFinalizeIntent(text) && extractFinishTargetHint(text) === null;
}
