-- ============================================================
-- PC / AI system component catalogue.
--
-- Phase 1 of the AI Systems Recommender: the parts inventory that
-- every generated build and quotation is priced from.
--
-- Two tables:
--   pc_components        one row per part the shop can sell
--   pc_component_prices  dated, sourced price history per part
--
-- WHY PRICE HISTORY INSTEAD OF A PRICE COLUMN
--   Indian component pricing moved violently through 2026 (a 32GB DDR5
--   kit went ~Rs 8,000 -> Rs 25,000-30,000 in twelve months), and the
--   same SKU routinely differs 60% between retailers. A single `price`
--   column cannot say WHERE a number came from or WHEN, so quotes built
--   on it go stale silently. Every price is therefore recorded against a
--   seller and a timestamp; `pc_components.current_price` is only a
--   denormalised cache of the newest row, maintained by trigger.
--
-- Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE.
-- ============================================================

-- ---------- COMPONENTS ----------
create table if not exists public.pc_components (
  id    uuid primary key default gen_random_uuid(),
  type  text not null,   -- cpu|gpu|motherboard|ram|storage|psu|case|cooler|os|monitor|peripheral|network
  brand text not null,
  name  text not null,
  slug  text unique not null,

  -- Denormalised cache of the newest pc_component_prices row.
  -- Never write these directly — the trigger below owns them.
  current_price    numeric(10,2),
  price_updated_at timestamptz,

  -- Tax fields, required on a GST quotation for institutional buyers.
  hsn_code text,
  gst_rate numeric(4,2) not null default 18 check (gst_rate >= 0 and gst_rate <= 100),

  stock_qty    int  not null default 0 check (stock_qty >= 0),
  availability text not null default 'in_stock'
               check (availability in ('in_stock','order_on_demand','discontinued')),

  -- Admin-set workload scores (0-100). These are the tuning knob that makes
  -- recommendations genuine: the engine ranks candidates within a category by
  -- the score matching the customer's stated workload.
  ai_score      int not null default 0 check (ai_score      between 0 and 100),
  creator_score int not null default 0 check (creator_score between 0 and 100),
  gaming_score  int not null default 0 check (gaming_score  between 0 and 100),
  office_score  int not null default 0 check (office_score  between 0 and 100),

  -- Typed compatibility fields. Only what the engine actually JOINs on lives
  -- here; everything else is free-form in `specs`.
  socket       text,          -- cpu <-> motherboard
  ram_type     text,          -- ddr4|ddr5 : motherboard <-> ram
  form_factor  text,          -- motherboard: atx|matx|itx
  supported_form_factors text[],   -- case: which board sizes it accepts
  tdp_watts    int,           -- cpu, gpu — POWER DRAWN. Summed and checked against psu_watts.
  cooling_capacity_watts int, -- cooler — HEAT DISSIPATED. Deliberately a separate
                              -- column: overloading tdp_watts here makes any naive
                              -- sum over a build double-count the cooler as load.
  psu_watts    int,           -- psu
  length_mm    int,           -- gpu length
  max_gpu_length_mm    int,   -- case clearance
  height_mm    int,           -- cooler height
  max_cooler_height_mm int,   -- case clearance
  vram_gb      int,           -- gpu — decisive for AI workloads
  capacity_gb  int,           -- ram stick / storage drive
  module_count int,           -- ram kit (2x16GB -> 2)
  pcie_slots   int,           -- motherboard — multi-GPU capability

  specs     jsonb not null default '[]'::jsonb,   -- [{label, value}], same shape as apparel_products.specifications
  image_url text,
  notes     text,
  status    text not null default 'active' check (status in ('draft','active','archived')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Guard for anyone who ran an earlier copy of this file: CREATE TABLE IF NOT
-- EXISTS will not add a column to a table that already exists.
alter table public.pc_components
  add column if not exists cooling_capacity_watts int;

create index if not exists pc_components_type_status_idx on public.pc_components(type, status);
create index if not exists pc_components_type_price_idx  on public.pc_components(type, current_price);
create index if not exists pc_components_specs_gin_idx   on public.pc_components using gin (specs);

-- ---------- PRICE HISTORY ----------
create table if not exists public.pc_component_prices (
  id           uuid primary key default gen_random_uuid(),
  component_id uuid not null references public.pc_components(id) on delete cascade,
  seller       text not null,   -- mdcomputers | primeabgb | vedant | theitgear | vendor | ...
  price        numeric(10,2) not null check (price >= 0),
  url          text,
  source       text not null default 'manual' check (source in ('manual','scraper','vendor_quote')),
  fetched_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists pc_component_prices_lookup_idx
  on public.pc_component_prices(component_id, fetched_at desc);

-- ---------- current_price CACHE ----------
-- Recomputes from scratch on every change so inserts, edits and deletes all
-- converge. Setting to NULL when the last price row is removed is intentional:
-- a component with no recorded price must not appear priced in a quotation.
create or replace function public.sync_component_current_price()
returns trigger language plpgsql as $$
declare
  target uuid := coalesce(new.component_id, old.component_id);
  latest_price numeric(10,2);
  latest_at    timestamptz;
begin
  select price, fetched_at
    into latest_price, latest_at
    from public.pc_component_prices
   where component_id = target
   order by fetched_at desc, created_at desc
   limit 1;

  update public.pc_components
     set current_price    = latest_price,
         price_updated_at = latest_at
   where id = target;

  return null;
end $$;

drop trigger if exists trg_pc_component_prices_sync on public.pc_component_prices;
create trigger trg_pc_component_prices_sync
  after insert or update or delete on public.pc_component_prices
  for each row execute procedure public.sync_component_current_price();

-- ---------- updated_at ----------
-- Reuses the function defined in 001_apparels.sql.
drop trigger if exists trg_pc_components_touch on public.pc_components;
create trigger trg_pc_components_touch
  before update on public.pc_components
  for each row execute procedure public.touch_updated_at();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.pc_components       enable row level security;
alter table public.pc_component_prices enable row level security;

-- Public sees only active parts, and only the cached current_price.
drop policy if exists "public read active components" on public.pc_components;
create policy "public read active components" on public.pc_components
  for select using (status = 'active');

drop policy if exists "admin all components" on public.pc_components;
create policy "admin all components" on public.pc_components
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Price history is cost intelligence — which seller, at what price, when.
-- Admin only. There is deliberately NO public select policy here.
drop policy if exists "admin all component prices" on public.pc_component_prices;
create policy "admin all component prices" on public.pc_component_prices
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE
-- Component images reuse the existing PUBLIC `apparel-images` bucket
-- (created for sql/001) under a `components/` path prefix, so no new
-- bucket or storage policies are needed. The policies in
-- sql/002_apparel_storage_policies.sql already cover it.
-- ============================================================
