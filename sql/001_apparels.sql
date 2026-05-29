-- ============================================================
-- Dhanshri Apparels — initial schema
-- Run this in your Supabase SQL Editor.
-- Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE.
-- ============================================================

-- ---------- PRODUCTS ----------
create table if not exists public.apparel_products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text unique not null,
  description     text,
  category        text not null check (category in ('tshirt','pants','combo','hoodie','other')),
  gender          text not null check (gender in ('men','women','boys','girls','unisex')),
  price           numeric(10,2) not null check (price >= 0),
  mrp             numeric(10,2) check (mrp is null or mrp >= price),
  status          text not null default 'draft' check (status in ('draft','active','archived')),
  primary_image_url text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists apparel_products_status_idx   on public.apparel_products(status);
create index if not exists apparel_products_category_idx on public.apparel_products(category);

-- ---------- GALLERY IMAGES ----------
create table if not exists public.apparel_product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.apparel_products(id) on delete cascade,
  image_url    text not null,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists apparel_product_images_product_idx on public.apparel_product_images(product_id, sort_order);

-- ---------- VARIANTS (size + color + qty) ----------
create table if not exists public.apparel_product_variants (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.apparel_products(id) on delete cascade,
  size         text not null,
  color        text not null default 'Default',
  quantity     int  not null default 0 check (quantity >= 0),
  sku          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(product_id, size, color)
);

create index if not exists apparel_variants_product_idx on public.apparel_product_variants(product_id);

-- ---------- ORDERS ----------
create table if not exists public.apparel_orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text unique not null,
  customer_name   text not null,
  phone           text not null,
  email           text,
  address_line1   text not null,
  address_line2   text,
  city            text not null,
  state           text,
  pincode         text not null,
  items           jsonb not null,                  -- [{product_id, variant_id, name, size, color, qty, unit_price, line_total, image_url}]
  subtotal        numeric(10,2) not null,
  delivery_fee    numeric(10,2) not null default 0,
  total           numeric(10,2) not null,
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','packed','shipped','delivered','cancelled')),
  payment_method  text not null default 'cod' check (payment_method in ('cod','upi','whatsapp')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists apparel_orders_status_idx     on public.apparel_orders(status);
create index if not exists apparel_orders_created_at_idx on public.apparel_orders(created_at desc);

-- ---------- updated_at TRIGGER ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_apparel_products_touch  on public.apparel_products;
create trigger trg_apparel_products_touch  before update on public.apparel_products  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_apparel_variants_touch  on public.apparel_product_variants;
create trigger trg_apparel_variants_touch  before update on public.apparel_product_variants  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_apparel_orders_touch    on public.apparel_orders;
create trigger trg_apparel_orders_touch    before update on public.apparel_orders    for each row execute procedure public.touch_updated_at();

-- ---------- ROW LEVEL SECURITY ----------
alter table public.apparel_products        enable row level security;
alter table public.apparel_product_images  enable row level security;
alter table public.apparel_product_variants enable row level security;
alter table public.apparel_orders          enable row level security;

-- Public can READ active products + their images + variants
drop policy if exists "public read active products"           on public.apparel_products;
create policy "public read active products" on public.apparel_products
  for select using (status = 'active');

drop policy if exists "public read product images of active"  on public.apparel_product_images;
create policy "public read product images of active" on public.apparel_product_images
  for select using (
    exists (select 1 from public.apparel_products p where p.id = product_id and p.status = 'active')
  );

drop policy if exists "public read variants of active"        on public.apparel_product_variants;
create policy "public read variants of active" on public.apparel_product_variants
  for select using (
    exists (select 1 from public.apparel_products p where p.id = product_id and p.status = 'active')
  );

-- Admin (any authenticated user) can do everything
drop policy if exists "admin all products"       on public.apparel_products;
create policy "admin all products" on public.apparel_products
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin all product images" on public.apparel_product_images;
create policy "admin all product images" on public.apparel_product_images
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin all variants"       on public.apparel_product_variants;
create policy "admin all variants" on public.apparel_product_variants
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Orders: public can INSERT (place an order), only admins can read/update
drop policy if exists "public insert order"      on public.apparel_orders;
create policy "public insert order" on public.apparel_orders
  for insert with check (true);

drop policy if exists "admin read orders"        on public.apparel_orders;
create policy "admin read orders" on public.apparel_orders
  for select using (auth.role() = 'authenticated');

drop policy if exists "admin update orders"      on public.apparel_orders;
create policy "admin update orders" on public.apparel_orders
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin delete orders"      on public.apparel_orders;
create policy "admin delete orders" on public.apparel_orders
  for delete using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKET
-- After running this SQL, also create a PUBLIC bucket named:
--   apparel-images
-- via Supabase Dashboard → Storage → New bucket (toggle "Public").
-- ============================================================
