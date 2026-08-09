-- Admin pode ler todas as entradas do codex (rascunhos e publicadas).

create policy "codex_entry_select_admin"
  on public.codex_entry
  for select
  to authenticated
  using (public.is_admin());

create policy "codex_facet_select_admin"
  on public.codex_facet
  for select
  to authenticated
  using (public.is_admin());

create policy "codex_edge_select_admin"
  on public.codex_edge
  for select
  to authenticated
  using (public.is_admin());

create policy "codex_embedding_select_admin"
  on public.codex_embedding
  for select
  to authenticated
  using (public.is_admin());
