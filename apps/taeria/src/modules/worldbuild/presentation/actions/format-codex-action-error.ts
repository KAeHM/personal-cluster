import { FACET_LABELS, type FacetType } from "../../domain/facet-type";

function humanizeIssue(raw: string): string {
  const match = raw.match(/^([^:]+):\s*([\s\S]+)$/);
  const field = match?.[1]?.trim() ?? raw.trim();
  const rest = match?.[2]?.trim() ?? "";

  if (/received undefined|required/i.test(rest)) {
    if (/expected number/i.test(rest)) {
      return `${field} é obrigatório (número)`;
    }
    if (/expected string/i.test(rest)) {
      return `${field} é obrigatório (texto)`;
    }
    if (/expected boolean/i.test(rest)) {
      return `${field} é obrigatório`;
    }
    return `${field} é obrigatório`;
  }

  if (/expected number/i.test(rest)) {
    return `${field} precisa ser um número`;
  }
  if (/expected string/i.test(rest)) {
    return `${field} precisa ser um texto`;
  }
  if (/expected boolean/i.test(rest)) {
    return `${field} precisa ser sim ou não`;
  }

  return match ? `${field}: ${rest}` : raw;
}

/**
 * Extrai detalhes legíveis de AppError.meta de VALIDATION_FAILED.
 */
function formatCodexValidationDetails(meta: unknown): string[] {
  if (!meta || typeof meta !== "object") {
    return [];
  }

  const record = meta as {
    errors?: Record<string, string[] | undefined>;
    identityErrors?: string[] | undefined;
  };

  const details: string[] = [];

  for (const issue of record.identityErrors ?? []) {
    if (typeof issue === "string" && issue.trim()) {
      details.push(humanizeIssue(issue));
    }
  }

  for (const [facetType, issues] of Object.entries(record.errors ?? {})) {
    if (!issues?.length) {
      continue;
    }
    const facetLabel = FACET_LABELS[facetType as FacetType] ?? facetType;
    for (const issue of issues) {
      if (typeof issue === "string" && issue.trim()) {
        details.push(`${facetLabel} — ${humanizeIssue(issue)}`);
      }
    }
  }

  return details;
}

export { formatCodexValidationDetails, humanizeIssue };
