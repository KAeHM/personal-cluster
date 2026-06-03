export type ContextItem = {
  id: string;
  label: string;
  normalizedKey: string;
  usageCount: number;
  lastUsedAt: string | null;
  aliases: string[];
};

export type ContextsData = {
  contexts: ContextItem[];
  fetchedAt: string;
};
