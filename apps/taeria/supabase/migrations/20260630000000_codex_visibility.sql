-- Visibilidade do codex (privado/público) e compartilhamento com jogadores.

create type public.codex_entry_visibility as enum ('private', 'public');

alter table public.codex_entry
  add column visibility public.codex_entry_visibility not null default 'private';

update public.codex_entry
  set visibility = case
    when status = 'published' then 'public'::public.codex_entry_visibility
    else 'private'::public.codex_entry_visibility
  end;

-- Políticas antigas referenciam status; remover antes de dropar a coluna.
drop policy if exists "codex_entry_select_published" on public.codex_entry;
drop policy if exists "codex_facet_select_published" on public.codex_facet;
drop policy if exists "codex_edge_select_published" on public.codex_edge;

alter table public.codex_entry drop column status;

drop type public.codex_entry_status;

create table public.codex_entry_share (
  entry_id uuid not null references public.codex_entry (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id)
);

create index codex_entry_share_user_id_idx on public.codex_entry_share (user_id);

alter table public.codex_entry_share enable row level security;

create policy "codex_entry_select_visible"
  on public.codex_entry
  for select
  to authenticated
  using (
    visibility = 'public'
    or exists (
      select 1
      from public.codex_entry_share s
      where s.entry_id = id and s.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "codex_facet_select_visible"
  on public.codex_facet
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.codex_entry e
      where e.id = entry_id
        and (
          e.visibility = 'public'
          or exists (
            select 1
            from public.codex_entry_share s
            where s.entry_id = e.id and s.user_id = auth.uid()
          )
          or public.is_admin()
        )
    )
  );

create policy "codex_edge_select_visible"
  on public.codex_edge
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.codex_entry e
      where e.id = from_entry_id
        and (
          e.visibility = 'public'
          or exists (
            select 1
            from public.codex_entry_share s
            where s.entry_id = e.id and s.user_id = auth.uid()
          )
          or public.is_admin()
        )
    )
  );

create policy "codex_embedding_select_visible"
  on public.codex_embedding
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.codex_entry e
      where e.id = entry_id
        and (
          e.visibility = 'public'
          or exists (
            select 1
            from public.codex_entry_share s
            where s.entry_id = e.id and s.user_id = auth.uid()
          )
          or public.is_admin()
        )
    )
  );

create policy "codex_entry_share_select"
  on public.codex_entry_share
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "codex_entry_share_insert_admin"
  on public.codex_entry_share
  for insert
  to authenticated
  with check (public.is_admin());

create policy "codex_entry_share_delete_admin"
  on public.codex_entry_share
  for delete
  to authenticated
  using (public.is_admin());
