import { normalizeGroupKey } from "@/lib/groups/normalize";
import { areGroupKeysSimilar } from "@/lib/groups/similarity";

function normalizeForMatch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

export function isTermMentionedInUtterance(
  term: string,
  utterance: string,
): boolean {
  const termKey = normalizeGroupKey(term);
  const utteranceNorm = normalizeForMatch(utterance);
  const utteranceKey = normalizeGroupKey(utterance);

  if (!termKey || !utteranceNorm) return false;

  if (
    utteranceKey.includes(termKey) ||
    utteranceNorm.includes(normalizeForMatch(term))
  ) {
    return true;
  }

  const termWords = termKey.split("-").filter(Boolean);
  if (termWords.length > 1) {
    return termWords.every(
      (word) =>
        utteranceKey.includes(word) ||
        utteranceNorm.includes(word.replace(/-/g, " ")),
    );
  }

  return areGroupKeysSimilar(termKey, utteranceKey);
}

const ACTIVITY_STOP_WORDS = new Set([
  "trabalhar",
  "trabalho",
  "tarefa",
  "nova",
  "novo",
  "comecei",
  "iniciar",
  "tenho",
]);

export function descricaoGroundedInUtterance(
  descricao: string,
  utterance: string,
): boolean {
  const description = normalizeForMatch(descricao);
  const source = normalizeForMatch(utterance);

  if (!description || !source) return false;
  if (source.includes(description) || description.includes(source)) {
    return true;
  }

  const descriptionWords = description
    .split(/\s+/)
    .filter((word) => word.length > 2 && !ACTIVITY_STOP_WORDS.has(word));

  if (descriptionWords.length === 0) return false;

  const matched = descriptionWords.filter((word) => source.includes(word));
  return matched.length / descriptionWords.length >= 0.5;
}

export function extractActivityFromUtterance(utterance: string): string {
  const trimmed = utterance.trim();
  const stripped = trimmed
    .replace(
      /^(?:tenho(?:\s+uma)?\s+(?:nova\s+)?tarefa(?:\s+para)?\s*(?:começar|iniciar)?[,:]?\s*|comecei(?:\s+a)?\s*|vou\s+(?:começar|iniciar)(?:\s+a)?\s*|preciso(?:\s+começar)?\s*|quero\s+(?:começar|iniciar)(?:\s+a)?\s*)/i,
      "",
    )
    .trim();

  return stripped || trimmed;
}

export function looksLikeWorkGroupLabel(
  descricao: string,
  groupLabels: string[],
): boolean {
  const descriptionKey = normalizeGroupKey(descricao);
  if (!descriptionKey) return false;

  return groupLabels.some((label) => {
    const labelKey = normalizeGroupKey(label);
    return (
      labelKey === descriptionKey ||
      descriptionKey.includes(labelKey) ||
      labelKey.includes(descriptionKey)
    );
  });
}

export function sanitizeTaskStartFromUtterance(input: {
  descricao: string;
  grupoSugerido?: string;
  utterance: string;
  workGroupLabels: string[];
}): { descricao: string; grupoSugerido?: string } {
  let descricao = input.descricao.trim();
  let grupoSugerido = input.grupoSugerido?.trim();
  const utterance = input.utterance.trim();

  if (!utterance) {
    return {
      descricao,
      ...(grupoSugerido ? { grupoSugerido } : {}),
    };
  }

  if (grupoSugerido && !isTermMentionedInUtterance(grupoSugerido, utterance)) {
    grupoSugerido = undefined;
  }

  const grounded = descricaoGroundedInUtterance(descricao, utterance);
  const mimicsGroup =
    looksLikeWorkGroupLabel(descricao, input.workGroupLabels) &&
    !isTermMentionedInUtterance(descricao, utterance);

  if (!grounded || mimicsGroup) {
    descricao = extractActivityFromUtterance(utterance);
  }

  return {
    descricao,
    ...(grupoSugerido ? { grupoSugerido } : {}),
  };
}
