-- Busca semântica no codex: índice HNSW + RPC match_codex_entries.
-- supabase-js não expõe operadores vetoriais; a busca roda via RPC.

create index if not exists codex_embedding_embedding_hnsw_idx
  on public.codex_embedding
  using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.match_codex_entries(
  query_embedding extensions.vector(1536),
  match_count int default 8,
  filter_kind_slug text default null
)
returns table (
  entry_id uuid,
  slug text,
  title text,
  kind_slug text,
  chunk_index int,
  content text,
  similarity double precision
)
language sql
stable
set search_path = ''
as $$
  select
    emb.entry_id,
    entry.slug,
    entry.title,
    kind.slug as kind_slug,
    emb.chunk_index,
    emb.content,
    1 - (emb.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.codex_embedding emb
  join public.codex_entry entry on entry.id = emb.entry_id
  join public.kind kind on kind.id = entry.kind_id
  where emb.embedding is not null
    and (filter_kind_slug is null or kind.slug = filter_kind_slug)
  order by emb.embedding operator(extensions.<=>) query_embedding
  limit greatest(match_count, 1);
$$;

comment on function public.match_codex_entries is
  'Top-N chunks do codex por similaridade de cosseno (RAG do Studio). Executar com service role; RLS aplica para invocadores autenticados.';
