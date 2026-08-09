-- Faceta visual: novo valor no enum (deve rodar sozinho — Postgres não permite
-- usar o valor na mesma transação em que ele é adicionado).

alter type public.facet_type add value if not exists 'visual';
