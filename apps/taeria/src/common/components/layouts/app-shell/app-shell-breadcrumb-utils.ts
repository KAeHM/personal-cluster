import type { AppShellBreadcrumbItem } from "./app-shell-types";

const DEFAULT_LABELS: Record<string, string> = {
  app: "App",
  studio: "Studio",
  kinds: "Tipos",
  new: "Novo",
  edit: "Editar",
};

function formatSegment(segment: string): string {
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function segmentsToBreadcrumbs(
  pathname: string,
  labelMap: Record<string, string> = DEFAULT_LABELS,
): AppShellBreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Início", href: "/" }];
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = labelMap[segment] ?? formatSegment(segment);

    return index === segments.length - 1 ? { label } : { label, href };
  });
}
