-- ============================================================
-- Per-product specifications (Amazon-style).
-- Stored as a JSONB array of {label, value} objects so order
-- is preserved and the admin can mix template + custom rows.
--
-- Examples:
--   Mobile:  [{"label":"Brand","value":"Samsung"},
--            {"label":"RAM","value":"8 GB"}, …]
--   Mango:   [{"label":"Variety","value":"Alphonso"},
--            {"label":"Origin","value":"Ratnagiri"}, …]
--
-- Safe to re-run.
-- ============================================================

alter table public.apparel_products
  add column if not exists specifications jsonb not null default '[]'::jsonb;

-- Quick lookup if you ever want to filter by spec value (not used yet)
create index if not exists apparel_products_specs_gin_idx
  on public.apparel_products using gin (specifications);
