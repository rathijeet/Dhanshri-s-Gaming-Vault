-- ============================================================
-- Site-wide settings (feature flags, toggles, etc.).
-- Single key-value table — flexible enough for any future flag.
--
-- Currently holds:
--   shop_enabled  : boolean — controls visibility of /apparels
--                   (the public Store) on the public site.
--
-- Safe to re-run.
-- ============================================================

create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Seed defaults (only if not present)
insert into public.app_settings (key, value)
values ('shop_enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- updated_at trigger reuses the function from 001
drop trigger if exists trg_app_settings_touch on public.app_settings;
create trigger trg_app_settings_touch
  before update on public.app_settings
  for each row execute procedure public.touch_updated_at();

-- ---------- RLS ----------
alter table public.app_settings enable row level security;

-- Public can READ every setting (so the public site can check shop_enabled)
drop policy if exists "public read settings" on public.app_settings;
create policy "public read settings" on public.app_settings
  for select using (true);

-- Only authenticated admins can INSERT/UPDATE/DELETE
drop policy if exists "admin write settings" on public.app_settings;
create policy "admin write settings" on public.app_settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
