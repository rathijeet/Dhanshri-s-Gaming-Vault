-- ============================================================
-- Entry-level tier.
--
-- Without these the catalogue had no floor: the cheapest possible build came
-- to ~Rs 1,45,000, so anyone asking for a Rs 20,000-50,000 machine was told
-- only that they could not afford one. These parts let the builder answer a
-- small budget with an actual system, and the UI states plainly what that
-- system cannot do rather than overselling it.
--
-- Reference points (Indian street prices, Sept 2026):
--   Ryzen 5 5600G APU build, complete   ~ Rs 28,000-32,000
--   i3-12100F + GTX 1650, complete      ~ Rs 40,000
-- A Rs 20,000 office build is reachable with the Athlon/B450 combination below.
--
-- All DDR4 and AM4/LGA1700 — deliberately a separate platform generation from
-- the DDR5 parts in 007, and the engine's ram_type and socket rules keep the
-- two from being mixed into an impossible build.
--
-- Safe to re-run. Run after 006 and 007.
-- ============================================================

-- ---------- entry CPUs (integrated graphics) ----------
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   socket, tdp_watts, specs)
values
  ('cpu','AMD','Athlon 3000G','amd-athlon-3000g','8473','order_on_demand',
    5,8,12,45,'AM4',35,
    '[{"label":"Cores / Threads","value":"2 / 4"},{"label":"Graphics","value":"Radeon Vega 3 (integrated)"}]'::jsonb),
  ('cpu','AMD','Ryzen 5 5600G','amd-ryzen-5-5600g','8473','order_on_demand',
    18,28,34,70,'AM4',65,
    '[{"label":"Cores / Threads","value":"6 / 12"},{"label":"Graphics","value":"Radeon Vega 7 (integrated)"},{"label":"Note","value":"Plays esports titles at 1080p low without a graphics card"}]'::jsonb),
  ('cpu','Intel','Core i3-12100','intel-core-i3-12100','8473','order_on_demand',
    16,26,32,68,'LGA1700',60,
    '[{"label":"Cores / Threads","value":"4 / 8"},{"label":"Graphics","value":"UHD 730 (integrated)"}]'::jsonb),
  ('cpu','AMD','Ryzen 5 5600','amd-ryzen-5-5600','8473','order_on_demand',
    25,38,52,72,'AM4',65,
    '[{"label":"Cores / Threads","value":"6 / 12"},{"label":"Graphics","value":"None — needs a graphics card"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- entry motherboards (DDR4) ----------
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   socket, ram_type, form_factor, pcie_slots, specs)
values
  ('motherboard','Gigabyte','B450M DS3H','gigabyte-b450m-ds3h','8473','order_on_demand',
    12,15,22,60,'AM4','DDR4','mATX',1,
    '[{"label":"Memory slots","value":"4 x DDR4"},{"label":"M.2 slots","value":"1"}]'::jsonb),
  ('motherboard','MSI','A520M-A PRO','msi-a520m-a-pro','8473','order_on_demand',
    14,18,25,62,'AM4','DDR4','mATX',1,
    '[{"label":"Memory slots","value":"2 x DDR4"},{"label":"PCIe","value":"4.0"}]'::jsonb),
  ('motherboard','MSI','PRO H610M-E DDR4','msi-pro-h610m-e-ddr4','8473','order_on_demand',
    14,18,24,62,'LGA1700','DDR4','mATX',1,
    '[{"label":"Memory slots","value":"2 x DDR4"},{"label":"M.2 slots","value":"1"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- entry memory (DDR4) ----------
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   ram_type, capacity_gb, module_count, specs)
values
  ('ram','Crucial','8GB (1x8) DDR4-3200','crucial-8gb-ddr4-3200','8473','order_on_demand',
    6,10,22,50,'DDR4',8,1,
    '[{"label":"Speed","value":"3200 MT/s"},{"label":"Kit","value":"1 x 8 GB"},{"label":"Note","value":"Single channel — add a second stick later"}]'::jsonb),
  ('ram','Crucial','16GB (2x8) DDR4-3200','crucial-16gb-ddr4-3200','8473','order_on_demand',
    15,25,45,68,'DDR4',16,2,
    '[{"label":"Speed","value":"3200 MT/s"},{"label":"Kit","value":"2 x 8 GB dual channel"}]'::jsonb),
  ('ram','Crucial','32GB (2x16) DDR4-3200','crucial-32gb-ddr4-3200','8473','order_on_demand',
    35,50,60,75,'DDR4',32,2,
    '[{"label":"Speed","value":"3200 MT/s"},{"label":"Kit","value":"2 x 16 GB dual channel"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- entry storage ----------
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   capacity_gb, specs)
values
  ('storage','Crucial','P3 256GB NVMe','crucial-p3-256gb-nvme','8471','order_on_demand',
    5,8,20,50,256,
    '[{"label":"Interface","value":"PCIe 3.0 x4"},{"label":"Note","value":"Room for the OS and a few applications"}]'::jsonb),
  ('storage','Crucial','P3 512GB NVMe','crucial-p3-512gb-nvme','8471','order_on_demand',
    15,25,45,65,512,
    '[{"label":"Interface","value":"PCIe 3.0 x4"},{"label":"Read speed","value":"3500 MB/s"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- entry graphics ----------
-- The 3050 is the cheapest card that genuinely runs a 7B model at Q4; the 1650
-- has CUDA but only 4GB, which is why its ai_score is near the floor.
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   vram_gb, tdp_watts, length_mm, specs)
values
  ('gpu','NVIDIA','GeForce GTX 1650 4GB','nvidia-geforce-gtx-1650-4gb','8473','order_on_demand',
    8,22,30,55, 4,75,230,
    '[{"label":"Memory","value":"4 GB GDDR6"},{"label":"AI caveat","value":"4GB is too little for most local models"}]'::jsonb),
  ('gpu','NVIDIA','GeForce RTX 3050 8GB','nvidia-geforce-rtx-3050-8gb','8473','order_on_demand',
    28,38,45,58, 8,130,230,
    '[{"label":"Memory","value":"8 GB GDDR6"},{"label":"Runs locally","value":"7B models at Q4"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- entry power, cabinet, cooling ----------
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   psu_watts, specs)
values
  ('psu','Ant Esports','VS450L 450W','ant-esports-vs450l-450w','8504','order_on_demand',
    8,10,18,55,450,
    '[{"label":"Rating","value":"Non-modular"}]'::jsonb),
  ('psu','Cooler Master','MWE 550 V2 550W Bronze','cooler-master-mwe-550-v2','8504','order_on_demand',
    18,22,35,60,550,
    '[{"label":"Efficiency","value":"80+ Bronze"}]'::jsonb)
on conflict (slug) do nothing;

insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   supported_form_factors, max_gpu_length_mm, max_cooler_height_mm, specs)
values
  ('case','Ant Esports','ICE-100 mATX','ant-esports-ice-100-matx','8473','order_on_demand',
    10,12,25,70, array['mATX','ITX'],300,155,
    '[{"label":"Type","value":"Micro-ATX tower"}]'::jsonb),
  ('case','Zebronics','Cronus mATX','zebronics-cronus-matx','8473','order_on_demand',
    12,15,30,72, array['ATX','mATX','ITX'],330,160,
    '[{"label":"Type","value":"Mid tower"},{"label":"Fans included","value":"1 x rear"}]'::jsonb)
on conflict (slug) do nothing;

insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   height_mm, cooling_capacity_watts, specs)
values
  ('cooler','AMD','Wraith Stealth (stock)','amd-wraith-stealth-stock','8473','order_on_demand',
    5,8,15,55,65,70,
    '[{"label":"Type","value":"Stock air cooler"},{"label":"Rated for","value":"Up to 70W"}]'::jsonb),
  ('cooler','Deepcool','AG400 Single Tower','deepcool-ag400-single-tower','8473','order_on_demand',
    25,30,45,65,150,150,
    '[{"label":"Type","value":"Single-tower air"},{"label":"Rated for","value":"Up to 150W"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- prices ----------
insert into public.pc_component_prices (component_id, seller, price, source)
select c.id, v.seller, v.price, 'manual'
from (values
  ('amd-athlon-3000g',              'mdcomputers',  4200),
  ('amd-ryzen-5-5600g',             'mdcomputers',  9500),
  ('intel-core-i3-12100',           'primeabgb',    9000),
  ('amd-ryzen-5-5600',              'mdcomputers',  8800),
  ('gigabyte-b450m-ds3h',           'mdcomputers',  4200),
  ('msi-a520m-a-pro',               'mdcomputers',  4800),
  ('msi-pro-h610m-e-ddr4',          'primeabgb',    6500),
  ('crucial-8gb-ddr4-3200',         'mdcomputers',  2400),
  ('crucial-16gb-ddr4-3200',        'mdcomputers',  4800),
  ('crucial-32gb-ddr4-3200',        'mdcomputers',  9200),
  ('crucial-p3-256gb-nvme',         'mdcomputers',  2200),
  ('crucial-p3-512gb-nvme',         'mdcomputers',  3800),
  ('nvidia-geforce-gtx-1650-4gb',   'primeabgb',   12500),
  ('nvidia-geforce-rtx-3050-8gb',   'mdcomputers', 19000),
  ('ant-esports-vs450l-450w',       'mdcomputers',  2200),
  ('cooler-master-mwe-550-v2',      'mdcomputers',  3200),
  ('ant-esports-ice-100-matx',      'mdcomputers',  1800),
  ('zebronics-cronus-matx',         'mdcomputers',  2400),
  ('amd-wraith-stealth-stock',      'vendor',        900),
  ('deepcool-ag400-single-tower',   'mdcomputers',  2300)
) as v(slug, seller, price)
join public.pc_components c on c.slug = v.slug
where not exists (
  select 1 from public.pc_component_prices p where p.component_id = c.id
);
