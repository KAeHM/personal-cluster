-- Backfill da faceta visual, display_order e bucket codex-assets.

insert into public.kind_facet_config (kind_id, facet_type, enabled, required, display_order, schema)
select
  k.id,
  'visual'::public.facet_type,
  false,
  false,
  3,
  '{"type":"object","properties":{"banner_url":{"type":"string","format":"image","title":"Banner"}}}'::jsonb
from public.kind k
where not exists (
  select 1
  from public.kind_facet_config c
  where c.kind_id = k.id and c.facet_type = 'visual'
);

update public.kind_facet_config
set display_order = 4
where facet_type = 'edges';

update public.kind_facet_config
set display_order = 5
where facet_type = 'embeddings';

insert into storage.buckets (id, name, public)
values ('codex-assets', 'codex-assets', true)
on conflict (id) do nothing;

create policy "codex_assets_public_read"
  on storage.objects
  for select
  using (bucket_id = 'codex-assets');

create policy "codex_assets_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'codex-assets' and public.is_admin());

create policy "codex_assets_admin_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'codex-assets' and public.is_admin());

create policy "codex_assets_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'codex-assets' and public.is_admin());
