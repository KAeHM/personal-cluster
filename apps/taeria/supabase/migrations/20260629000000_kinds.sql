-- Tipos de entidade do worldbuild (kinds) e configuração de facetas por tipo.
-- Próxima fase: codex_entry / codex_edge / codex_embedding consumirão kind_facet_config.

create type public.facet_type as enum (
  'lore',
  'system',
  'lexicon',
  'edges',
  'embeddings'
);

create table public.kind (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  ai_prompt text,
  is_builtin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.kind_facet_config (
  id uuid primary key default gen_random_uuid(),
  kind_id uuid not null references public.kind (id) on delete cascade,
  facet_type public.facet_type not null,
  enabled boolean not null default false,
  required boolean not null default false,
  schema jsonb,
  display_order int not null default 0,
  unique (kind_id, facet_type)
);

create index kind_facet_config_kind_id_idx on public.kind_facet_config (kind_id);

alter table public.kind enable row level security;
alter table public.kind_facet_config enable row level security;

-- Leitura para usuários autenticados (consulta futura por jogadores).
create policy "kind_select_authenticated"
  on public.kind
  for select
  to authenticated
  using (true);

create policy "kind_facet_config_select_authenticated"
  on public.kind_facet_config
  for select
  to authenticated
  using (true);

-- Escrita apenas para admins (mesmo padrão de profiles).
create policy "kind_insert_admin"
  on public.kind
  for insert
  to authenticated
  with check (public.is_admin());

create policy "kind_update_admin"
  on public.kind
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "kind_delete_admin"
  on public.kind
  for delete
  to authenticated
  using (public.is_admin());

create policy "kind_facet_config_insert_admin"
  on public.kind_facet_config
  for insert
  to authenticated
  with check (public.is_admin());

create policy "kind_facet_config_update_admin"
  on public.kind_facet_config
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "kind_facet_config_delete_admin"
  on public.kind_facet_config
  for delete
  to authenticated
  using (public.is_admin());

create trigger kind_set_updated_at
  before update on public.kind
  for each row
  execute function public.set_updated_at();
