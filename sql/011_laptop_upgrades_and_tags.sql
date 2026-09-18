-- ============================================================
-- Laptop upgrades, and two more ways to say what the machine is for.
--
-- PART A — WHAT CAN ACTUALLY BE CHANGED ON A LAPTOP
--   Almost nothing, and that is the point. The graphics card, the
--   processor, the screen and the cooling are soldered or structural:
--   they are fixed for the life of the machine. Memory and storage are
--   the only real levers, and only on some machines. So the columns
--   below exist to let the site offer exactly those two, exactly when
--   they are possible, and to say plainly that everything else is not.
--
--   Getting this wrong in the customer-friendly direction is the most
--   expensive mistake this module could make: someone who buys 8GB
--   expecting to "add more later" on a soldered machine has bought the
--   wrong laptop and cannot undo it.
--
-- PART B — dev_score AND cad_score
--   Four workloads could not express the two jobs people most often
--   bring to a laptop shop after gaming. They are genuinely different
--   from what already existed:
--     Software development  RAM and CPU decide it; the graphics card is
--                           close to irrelevant. An office laptop with
--                           8GB is not a dev machine, and creator_score
--                           does not capture that.
--     CAD / engineering     Wants certified drivers and VRAM for large
--                           assemblies — and SolidWorks, Revit, Inventor
--                           and NX do not run on macOS at all, which no
--                           score can express and the UI states in words.
--   Laptop-only for now: desktop parts carry no value in these columns,
--   so profiles.js scopes both workloads to the laptop track until the
--   parts catalogue is scored too.
--
-- Safe to re-run. Run after 010.
-- ============================================================

-- ---------- COLUMNS ----------
alter table public.pc_components
  add column if not exists dev_score          int not null default 0,
  add column if not exists cad_score          int not null default 0,
  add column if not exists storage_upgradable boolean,
  add column if not exists m2_slots           int;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pc_components_dev_score_chk') then
    alter table public.pc_components add constraint pc_components_dev_score_chk
      check (dev_score between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pc_components_cad_score_chk') then
    alter table public.pc_components add constraint pc_components_cad_score_chk
      check (cad_score between 0 and 100);
  end if;
end $$;

comment on column public.pc_components.storage_upgradable is
  'Laptop only. False means the SSD is soldered (all current Apple Silicon) — the capacity bought is the capacity forever.';
comment on column public.pc_components.m2_slots is
  'Laptop only. 2+ means a drive can be ADDED alongside the original; 1 means any upgrade REPLACES it.';

-- ---------- BACKFILL ----------
-- update ... from (values) so all 28 laptops move in one statement.
update public.pc_components c set
  dev_score          = v.dev,
  cad_score          = v.cad,
  storage_upgradable = v.storage_up,
  m2_slots           = v.slots
from (values
  ('lenovo-ideapad-slim-3-15',         48,   8, true , 1),
  ('asus-vivobook-16',                 66,  15, true , 2),
  ('hp-pavilion-plus-14',              62,  18, true , 1),
  ('acer-nitro-v-15',                  60,  38, true , 2),
  ('hp-victus-15',                     66,  46, true , 2),
  ('lenovo-loq-15',                    66,  45, true , 2),
  ('apple-macbook-air-13-m4',          72,  18, false, 0),
  ('asus-tuf-gaming-a15',              70,  55, true , 2),
  ('lenovo-legion-slim-5-16',          84,  54, true , 2),
  ('dell-14-premium',                  86,  25, true , 1),
  ('hp-omen-16',                       84,  66, true , 2),
  ('lenovo-thinkpad-x1-carbon-g13',    92,  22, true , 1),
  ('asus-rog-zephyrus-g14',            86,  60, true , 1),
  ('lenovo-legion-pro-5i-16',          85,  76, true , 2),
  ('apple-macbook-pro-14-m4-pro',      95,  40, false, 0),
  ('asus-rog-flow-z13-2025',           88,  50, true , 1),
  ('lenovo-legion-pro-7i-16',          86,  84, true , 2),
  ('hp-zbook-ultra-g1a-14',            94,  92, true , 1),
  ('apple-macbook-pro-16-m4-max',      98,  45, false, 0),
  ('asus-rog-strix-scar-18',           88,  88, true , 2),
  ('hp-15s',                           35,   6, true , 1),
  ('infinix-inbook-air-pro-plus',      55,  10, true , 1),
  ('dell-inspiron-15-3530',            56,  12, true , 2),
  ('msi-katana-15',                    68,  53, true , 2),
  ('samsung-galaxy-book5-pro-14',      70,  20, true , 1),
  ('gigabyte-aorus-16x',               70,  64, true , 2),
  ('acer-predator-helios-neo-16',      72,  75, true , 2),
  ('msi-stealth-16-ai',                88,  72, true , 2)
) as v(slug, dev, cad, storage_up, slots)
where c.slug = v.slug;

-- ---------- UPGRADE PARTS ----------
-- Separate types from the desktop 'ram' and 'storage' pools on purpose.
-- A laptop takes SO-DIMM, not DIMM, and putting them in one bucket would
-- eventually let the desktop engine quote a SO-DIMM into a tower. The
-- desktop engine only pulls the types profiles.js declares, so these are
-- invisible to it.

insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability,
   ai_score, creator_score, gaming_score, office_score, dev_score, cad_score,
   ram_type, capacity_gb, specs)
values
  ('laptop_ram','Crucial','16GB (1x16) DDR5-5600 SO-DIMM','sodimm-16gb-ddr5-5600','8473','order_on_demand',
    0,0,0,0,0,0,'DDR5',16,
    '[{"label":"Form factor","value":"SO-DIMM — laptop memory, not the desktop kind"},{"label":"Speed","value":"5600 MT/s"},{"label":"Note","value":"Single module. Fine on a machine with a free slot; on a full machine one of the originals comes out."}]'::jsonb),
  ('laptop_ram','Crucial','32GB (2x16) DDR5-5600 SO-DIMM kit','sodimm-32gb-ddr5-5600','8473','order_on_demand',
    0,0,0,0,0,0,'DDR5',32,
    '[{"label":"Form factor","value":"SO-DIMM — laptop memory, not the desktop kind"},{"label":"Speed","value":"5600 MT/s"},{"label":"Note","value":"The sensible target for development work, virtual machines and large projects."}]'::jsonb),
  ('laptop_ram','Crucial','48GB (2x24) DDR5-5600 SO-DIMM kit','sodimm-48gb-ddr5-5600','8473','order_on_demand',
    0,0,0,0,0,0,'DDR5',48,
    '[{"label":"Form factor","value":"SO-DIMM — laptop memory, not the desktop kind"},{"label":"Speed","value":"5600 MT/s"},{"label":"Note","value":"Odd capacity, real part. Useful when 32GB is tight and 64GB is not worth the money."}]'::jsonb),
  ('laptop_ram','Kingston','64GB (2x32) DDR5-5600 SO-DIMM kit','sodimm-64gb-ddr5-5600','8473','order_on_demand',
    0,0,0,0,0,0,'DDR5',64,
    '[{"label":"Form factor","value":"SO-DIMM — laptop memory, not the desktop kind"},{"label":"Speed","value":"5600 MT/s"},{"label":"Note","value":"Heavy multitasking, big datasets, several virtual machines at once."}]'::jsonb),
  ('laptop_ram','Kingston','96GB (2x48) DDR5-5600 SO-DIMM kit','sodimm-96gb-ddr5-5600','8473','order_on_demand',
    0,0,0,0,0,0,'DDR5',96,
    '[{"label":"Form factor","value":"SO-DIMM — laptop memory, not the desktop kind"},{"label":"Speed","value":"5600 MT/s"},{"label":"Note","value":"The ceiling on most two-slot laptops."}]'::jsonb)
on conflict (slug) do nothing;

insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability,
   ai_score, creator_score, gaming_score, office_score, dev_score, cad_score,
   capacity_gb, specs)
values
  ('laptop_storage','Crucial','P3 Plus 512GB NVMe Gen4 (M.2 2280)','m2-512gb-nvme-gen4','8471','order_on_demand',
    0,0,0,0,0,0,512,
    '[{"label":"Form factor","value":"M.2 2280 — check the bay length on very thin machines"},{"label":"Interface","value":"PCIe 4.0 x4"}]'::jsonb),
  ('laptop_storage','WD','Black SN770 1TB NVMe Gen4 (M.2 2280)','m2-1tb-nvme-gen4','8471','order_on_demand',
    0,0,0,0,0,0,1024,
    '[{"label":"Form factor","value":"M.2 2280 — check the bay length on very thin machines"},{"label":"Interface","value":"PCIe 4.0 x4, 5150 MB/s read"}]'::jsonb),
  ('laptop_storage','Samsung','990 PRO 2TB NVMe Gen4 (M.2 2280)','m2-2tb-nvme-gen4','8471','order_on_demand',
    0,0,0,0,0,0,2048,
    '[{"label":"Form factor","value":"M.2 2280 — check the bay length on very thin machines"},{"label":"Interface","value":"PCIe 4.0 x4, 7450 MB/s read"}]'::jsonb),
  ('laptop_storage','Samsung','990 PRO 4TB NVMe Gen4 (M.2 2280)','m2-4tb-nvme-gen4','8471','order_on_demand',
    0,0,0,0,0,0,4096,
    '[{"label":"Form factor","value":"M.2 2280 — check the bay length on very thin machines"},{"label":"Interface","value":"PCIe 4.0 x4 — for video libraries and model weights"}]'::jsonb)
on conflict (slug) do nothing;

insert into public.pc_component_prices (component_id, seller, price, source)
select c.id, v.seller, v.price, 'manual'
from (values
  ('sodimm-16gb-ddr5-5600',       'mdcomputers', 11440.68), -- Rs 13,500 street
  ('sodimm-32gb-ddr5-5600',       'mdcomputers', 22881.36), -- Rs 27,000 street
  ('sodimm-48gb-ddr5-5600',       'mdcomputers', 33898.31), -- Rs 40,000 street
  ('sodimm-64gb-ddr5-5600',       'mdcomputers', 45762.71), -- Rs 54,000 street
  ('sodimm-96gb-ddr5-5600',       'mdcomputers', 67796.61), -- Rs 80,000 street
  ('m2-512gb-nvme-gen4',          'mdcomputers', 10169.49), -- Rs 12,000 street
  ('m2-1tb-nvme-gen4',            'mdcomputers', 16525.42), -- Rs 19,500 street
  ('m2-2tb-nvme-gen4',            'mdcomputers', 25423.73), -- Rs 30,000 street
  ('m2-4tb-nvme-gen4',            'mdcomputers', 52542.37)  -- Rs 62,000 street
) as v(slug, seller, price)
join public.pc_components c on c.slug = v.slug
where not exists (
  select 1 from public.pc_component_prices p where p.component_id = c.id
);
