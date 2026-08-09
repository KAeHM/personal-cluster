-- Índice para consultas de filhos taxonômicos por pai (browse em árvore).

create index if not exists codex_edge_to_entry_id_idx
  on public.codex_edge (to_entry_id);
