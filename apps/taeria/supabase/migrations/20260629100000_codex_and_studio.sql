-- Codex (entradas do worldbuild), sessões do Studio Create e ai_prompt por faceta.

create extension if not exists vector with schema extensions;

alter table public.kind_facet_config
  add column ai_prompt text;

create type public.codex_entry_status as enum ('draft', 'published');

create table public.codex_entry (
  id uuid primary key default gen_random_uuid(),
  kind_id uuid not null references public.kind (id) on delete restrict,
  slug text not null unique,
  title text not null,
  status public.codex_entry_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.codex_facet (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.codex_entry (id) on delete cascade,
  facet_type public.facet_type not null,
  data jsonb not null default '{}',
  unique (entry_id, facet_type)
);

create table public.codex_edge (
  id uuid primary key default gen_random_uuid(),
  from_entry_id uuid not null references public.codex_entry (id) on delete cascade,
  to_entry_id uuid not null references public.codex_entry (id) on delete cascade,
  edge_type text not null,
  payload jsonb,
  created_at timestamptz not null default now(),
  check (from_entry_id <> to_entry_id)
);

create table public.codex_embedding (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.codex_entry (id) on delete cascade,
  chunk_index int not null default 0,
  content text not null default '',
  embedding extensions.vector(1536),
  unique (entry_id, chunk_index)
);

create table public.studio_session (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  draft jsonb not null default '{}',
  kind_slug text,
  updated_at timestamptz not null default now()
);

create index codex_entry_kind_id_idx on public.codex_entry (kind_id);
create index codex_entry_slug_idx on public.codex_entry (slug);
create index codex_edge_from_entry_id_idx on public.codex_edge (from_entry_id);
create index codex_facet_data_gin_idx on public.codex_facet using gin (data);
create index studio_session_user_id_idx on public.studio_session (user_id);

alter table public.codex_entry enable row level security;
alter table public.codex_facet enable row level security;
alter table public.codex_edge enable row level security;
alter table public.codex_embedding enable row level security;
alter table public.studio_session enable row level security;

-- Leitura de entradas publicadas para autenticados (consulta futura).
create policy "codex_entry_select_published"
  on public.codex_entry
  for select
  to authenticated
  using (status = 'published');

create policy "codex_facet_select_published"
  on public.codex_facet
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.codex_entry e
      where e.id = entry_id and e.status = 'published'
    )
  );

create policy "codex_edge_select_published"
  on public.codex_edge
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.codex_entry e
      where e.id = from_entry_id and e.status = 'published'
    )
  );

-- Escrita codex apenas admin.
create policy "codex_entry_insert_admin"
  on public.codex_entry
  for insert
  to authenticated
  with check (public.is_admin());

create policy "codex_entry_update_admin"
  on public.codex_entry
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "codex_entry_delete_admin"
  on public.codex_entry
  for delete
  to authenticated
  using (public.is_admin());

create policy "codex_facet_insert_admin"
  on public.codex_facet
  for insert
  to authenticated
  with check (public.is_admin());

create policy "codex_facet_update_admin"
  on public.codex_facet
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "codex_facet_delete_admin"
  on public.codex_facet
  for delete
  to authenticated
  using (public.is_admin());

create policy "codex_edge_insert_admin"
  on public.codex_edge
  for insert
  to authenticated
  with check (public.is_admin());

create policy "codex_edge_update_admin"
  on public.codex_edge
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "codex_edge_delete_admin"
  on public.codex_edge
  for delete
  to authenticated
  using (public.is_admin());

create policy "codex_embedding_insert_admin"
  on public.codex_embedding
  for insert
  to authenticated
  with check (public.is_admin());

create policy "codex_embedding_update_admin"
  on public.codex_embedding
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "codex_embedding_delete_admin"
  on public.codex_embedding
  for delete
  to authenticated
  using (public.is_admin());

-- Sessões: leitura e escrita só do dono (admin no Studio).
create policy "studio_session_select_owner"
  on public.studio_session
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "studio_session_insert_owner"
  on public.studio_session
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "studio_session_update_owner"
  on public.studio_session
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "studio_session_delete_owner"
  on public.studio_session
  for delete
  to authenticated
  using (user_id = auth.uid());

create trigger codex_entry_set_updated_at
  before update on public.codex_entry
  for each row
  execute function public.set_updated_at();

create trigger studio_session_set_updated_at
  before update on public.studio_session
  for each row
  execute function public.set_updated_at();
