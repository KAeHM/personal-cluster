import type {
  CodexEmbeddingChunk,
  CodexEntry,
  CodexEntrySummary,
  CodexSimilarChunk,
  ListCodexEntriesParams,
  ListCodexEntriesResult,
  NewCodexEntry,
  UpdateCodexEntry,
} from "./codex-entry";

export interface CodexSearchParams {
  query: string;
  kindSlug?: string;
  limit?: number;
}

export interface CodexSimilarSearchOptions {
  limit?: number;
  kindSlug?: string;
}

export interface CodexRepository {
  findById(id: string): Promise<CodexEntry | null>;
  findBySlug(slug: string): Promise<CodexEntry | null>;
  search(params: CodexSearchParams): Promise<CodexEntrySummary[]>;
  list(params: ListCodexEntriesParams): Promise<ListCodexEntriesResult>;
  create(data: NewCodexEntry): Promise<CodexEntry>;
  update(id: string, data: UpdateCodexEntry): Promise<CodexEntry | null>;
  delete(id: string): Promise<boolean>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
  replaceEmbeddings(
    entryId: string,
    chunks: CodexEmbeddingChunk[],
  ): Promise<void>;
  searchSimilar(
    embedding: number[],
    options?: CodexSimilarSearchOptions,
  ): Promise<CodexSimilarChunk[]>;
}
