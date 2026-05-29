-- ============================================================
-- Pivot from apparel-only to generic store + per-product variant labels.
--
-- Run this after 001_apparels.sql and 002_apparel_storage_policies.sql.
-- Safe to re-run.
--
-- Three things happen here:
--   1. Drop the CHECK constraints on `category` and `gender` so any
--      product line works (toys, mangoes, achar, crackers, sweets, …).
--   2. Make `gender` nullable (food / books / electronics don't have one).
--   3. Add `option1_label` (default 'Size') and `option2_label` (nullable)
--      so each product can call its variant axes anything — Weight,
--      Pack, Flavor, Storage, etc. — instead of the hardcoded Size/Color.
-- ============================================================

-- 1. Drop auto-named CHECK constraints on category and gender
do $$
declare
  rec record;
begin
  for rec in
    select conname
    from pg_constraint
    where conrelid = 'public.apparel_products'::regclass
      and contype  = 'c'
      and (
        pg_get_constraintdef(oid) ilike '%category%' or
        pg_get_constraintdef(oid) ilike '%gender%'
      )
  loop
    execute format('alter table public.apparel_products drop constraint %I', rec.conname);
  end loop;
end $$;

-- 2. Gender becomes optional
alter table public.apparel_products
  alter column gender drop not null;

-- 3. Per-product variant labels
alter table public.apparel_products
  add column if not exists option1_label text not null default 'Size',
  add column if not exists option2_label text;
