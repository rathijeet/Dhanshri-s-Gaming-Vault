-- ============================================================
-- Seed catalogue for the AI Systems Recommender.
--
-- Covers the full bill of materials for the four build profiles, with the
-- AI / ML workstation tiers deliberately deepest (that is the v1 segment).
--
-- PRICES ARE INDICATIVE, RESEARCHED SEPT 2026 INDIAN STREET PRICES.
-- They are a starting point to be replaced by your hardware vendor's real
-- numbers. Two reasons they will drift fast:
--   * the 2026 memory crunch - a 32GB DDR5 kit went ~Rs 8,000 -> ~Rs 27,000
--     in twelve months, and NAND is forecast +55-60%
--   * the same SKU differs up to 60% between Indian retailers
-- The admin panel flags anything older than 14 days for exactly this reason.
--
-- HSN codes are sensible defaults - confirm them with your CA before you
-- put them on a GST invoice.
--
-- Safe to re-run. Components conflict on slug and DO NOTHING, and a price row
-- is only inserted for a component that has no price at all, so re-running
-- this file will never overwrite a number you have since verified yourself.
--
-- Run after sql/006_pc_components.sql.
-- ============================================================

-- ---------- GPUs ----------
-- ai_score is driven by VRAM and CUDA availability, not raw gaming speed.
-- Note the RX 9070 XT: a strong gaming card, but no CUDA, so its AI score is
-- deliberately low. That single number is what stops the engine recommending
-- an AMD card to someone who said they want to run local LLMs.
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   vram_gb, tdp_watts, length_mm, specs)
values
  ('gpu','NVIDIA','GeForce RTX 5060 Ti 16GB','nvidia-geforce-rtx-5060-ti-16gb','8473','order_on_demand',
    45,55,62,60, 16,180,240,
    '[{"label":"Architecture","value":"Blackwell"},{"label":"Memory","value":"16 GB GDDR7"},{"label":"Runs locally","value":"7B-13B models at Q4"}]'::jsonb),
  ('gpu','NVIDIA','GeForce RTX 5070 12GB','nvidia-geforce-rtx-5070-12gb','8473','order_on_demand',
    40,65,72,60, 12,250,300,
    '[{"label":"Architecture","value":"Blackwell"},{"label":"Memory","value":"12 GB GDDR7"},{"label":"Runs locally","value":"7B-13B models at Q4"}]'::jsonb),
  ('gpu','NVIDIA','GeForce RTX 5070 Ti 16GB','nvidia-geforce-rtx-5070-ti-16gb','8473','order_on_demand',
    58,75,82,60, 16,300,305,
    '[{"label":"Architecture","value":"Blackwell"},{"label":"Memory","value":"16 GB GDDR7"},{"label":"Runs locally","value":"14B models comfortably"}]'::jsonb),
  ('gpu','NVIDIA','GeForce RTX 5080 16GB','nvidia-geforce-rtx-5080-16gb','8473','order_on_demand',
    65,85,90,60, 16,360,330,
    '[{"label":"Architecture","value":"Blackwell"},{"label":"Memory","value":"16 GB GDDR7"},{"label":"Runs locally","value":"14B models, light fine-tuning"}]'::jsonb),
  ('gpu','NVIDIA','GeForce RTX 4090 24GB','nvidia-geforce-rtx-4090-24gb','8473','order_on_demand',
    85,92,94,60, 24,450,336,
    '[{"label":"Architecture","value":"Ada Lovelace"},{"label":"Memory","value":"24 GB GDDR6X"},{"label":"Runs locally","value":"30B models at Q4 - the VRAM sweet spot"}]'::jsonb),
  ('gpu','NVIDIA','GeForce RTX 5090 32GB','nvidia-geforce-rtx-5090-32gb','8473','order_on_demand',
    92,98,100,60, 32,575,360,
    '[{"label":"Architecture","value":"Blackwell"},{"label":"Memory","value":"32 GB GDDR7"},{"label":"CUDA cores","value":"21,760"},{"label":"Runs locally","value":"30B+ models, serious fine-tuning"}]'::jsonb),
  ('gpu','NVIDIA','RTX PRO 6000 Blackwell 96GB','nvidia-rtx-pro-6000-blackwell-96gb','8473','order_on_demand',
    100,100,85,60, 96,600,338,
    '[{"label":"Class","value":"Professional workstation"},{"label":"Memory","value":"96 GB GDDR7 ECC"},{"label":"Runs locally","value":"70B models unquantised"}]'::jsonb),
  ('gpu','AMD','Radeon RX 9070 XT 16GB','amd-radeon-rx-9070-xt-16gb','8473','order_on_demand',
    25,70,84,60, 16,304,320,
    '[{"label":"Architecture","value":"RDNA 4"},{"label":"Memory","value":"16 GB GDDR6"},{"label":"AI caveat","value":"No CUDA - poor fit for most local LLM tooling"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- CPUs ----------
-- For AI the score tracks core count and PCIe lanes (feeding multiple GPUs),
-- not gaming cache. Hence the 9800X3D scores 100 for gaming but only 55 for AI.
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   socket, tdp_watts, specs)
values
  ('cpu','AMD','Ryzen 5 9600X','amd-ryzen-5-9600x','8473','order_on_demand',
    40,55,72,80,'AM5',65,
    '[{"label":"Cores / Threads","value":"6 / 12"},{"label":"Boost clock","value":"5.4 GHz"}]'::jsonb),
  ('cpu','AMD','Ryzen 7 9700X','amd-ryzen-7-9700x','8473','order_on_demand',
    52,68,80,85,'AM5',65,
    '[{"label":"Cores / Threads","value":"8 / 16"},{"label":"Boost clock","value":"5.5 GHz"}]'::jsonb),
  ('cpu','AMD','Ryzen 7 9800X3D','amd-ryzen-7-9800x3d','8473','order_on_demand',
    55,72,100,85,'AM5',120,
    '[{"label":"Cores / Threads","value":"8 / 16"},{"label":"Boost clock","value":"5.2 GHz"},{"label":"Cache","value":"96 MB 3D V-Cache"}]'::jsonb),
  ('cpu','AMD','Ryzen 9 9950X','amd-ryzen-9-9950x','8473','order_on_demand',
    72,95,88,90,'AM5',170,
    '[{"label":"Cores / Threads","value":"16 / 32"},{"label":"Boost clock","value":"5.7 GHz"}]'::jsonb),
  ('cpu','Intel','Core Ultra 7 265K','intel-core-ultra-7-265k','8473','order_on_demand',
    55,78,82,88,'LGA1851',125,
    '[{"label":"Cores / Threads","value":"20 / 20"},{"label":"Boost clock","value":"5.5 GHz"}]'::jsonb),
  ('cpu','AMD','Ryzen Threadripper 7960X','amd-ryzen-threadripper-7960x','8473','order_on_demand',
    90,100,78,90,'sTR5',350,
    '[{"label":"Cores / Threads","value":"24 / 48"},{"label":"PCIe lanes","value":"48 - multi-GPU capable"}]'::jsonb),
  ('cpu','AMD','Ryzen Threadripper 9960X','amd-ryzen-threadripper-9960x','8473','order_on_demand',
    94,100,80,90,'sTR5',350,
    '[{"label":"Cores / Threads","value":"24 / 48"},{"label":"PCIe lanes","value":"48 - multi-GPU capable"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- Motherboards ----------
-- pcie_slots is what gates a dual-GPU AI build.
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   socket, ram_type, form_factor, pcie_slots, specs)
values
  ('motherboard','Gigabyte','B850 Eagle WiFi6E','gigabyte-b850-eagle-wifi6e','8473','order_on_demand',
    45,50,62,80,'AM5','DDR5','ATX',1,
    '[{"label":"Memory slots","value":"4 x DDR5"},{"label":"M.2 slots","value":"2"}]'::jsonb),
  ('motherboard','Gigabyte','X870E Aorus Elite WiFi7','gigabyte-x870e-aorus-elite-wifi7','8473','order_on_demand',
    72,78,85,80,'AM5','DDR5','ATX',2,
    '[{"label":"Memory slots","value":"4 x DDR5"},{"label":"M.2 slots","value":"4"},{"label":"PCIe","value":"5.0"}]'::jsonb),
  ('motherboard','ASUS','ROG Strix X870E-E Gaming WiFi','asus-rog-strix-x870e-e-gaming-wifi','8473','order_on_demand',
    78,85,92,80,'AM5','DDR5','ATX',2,
    '[{"label":"Memory slots","value":"4 x DDR5"},{"label":"M.2 slots","value":"5"},{"label":"PCIe","value":"5.0"}]'::jsonb),
  ('motherboard','MSI','Z890 Tomahawk WiFi','msi-z890-tomahawk-wifi','8473','order_on_demand',
    68,75,84,80,'LGA1851','DDR5','ATX',2,
    '[{"label":"Memory slots","value":"4 x DDR5"},{"label":"M.2 slots","value":"4"}]'::jsonb),
  ('motherboard','ASRock','TRX50 WS','asrock-trx50-ws','8473','order_on_demand',
    96,92,70,70,'sTR5','DDR5','E-ATX',4,
    '[{"label":"Memory slots","value":"4 x DDR5 RDIMM"},{"label":"PCIe x16 slots","value":"4 - quad GPU"},{"label":"Class","value":"Workstation"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- Memory ----------
-- The 2026 crunch lives here. System RAM matters enormously for AI work
-- (dataset staging, KV cache spillover), which is why 64GB+ scores high.
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   ram_type, capacity_gb, module_count, specs)
values
  ('ram','G.Skill','Flare X5 16GB (2x8) DDR5-5600','gskill-flare-x5-16gb-ddr5-5600','8473','order_on_demand',
    20,30,55,75,'DDR5',16,2,
    '[{"label":"Speed","value":"5600 MT/s"},{"label":"Kit","value":"2 x 8 GB"}]'::jsonb),
  ('ram','Corsair','Vengeance 32GB (2x16) DDR5-6000','corsair-vengeance-32gb-ddr5-6000','8473','order_on_demand',
    55,65,85,90,'DDR5',32,2,
    '[{"label":"Speed","value":"6000 MT/s"},{"label":"Kit","value":"2 x 16 GB"}]'::jsonb),
  ('ram','Corsair','Vengeance 64GB (2x32) DDR5-6000','corsair-vengeance-64gb-ddr5-6000','8473','order_on_demand',
    85,90,88,90,'DDR5',64,2,
    '[{"label":"Speed","value":"6000 MT/s"},{"label":"Kit","value":"2 x 32 GB"}]'::jsonb),
  ('ram','Kingston','Fury Beast 128GB (4x32) DDR5-5600','kingston-fury-beast-128gb-ddr5-5600','8473','order_on_demand',
    100,100,80,90,'DDR5',128,4,
    '[{"label":"Speed","value":"5600 MT/s"},{"label":"Kit","value":"4 x 32 GB"},{"label":"Use case","value":"Large dataset staging"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- Storage ----------
-- Model weights are large: a 70B model at Q4 is ~40GB on disk before you have
-- stored a single dataset. 2TB is the realistic floor for AI work.
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   capacity_gb, specs)
values
  ('storage','WD','Black SN770 1TB NVMe Gen4','wd-black-sn770-1tb-nvme','8471','order_on_demand',
    40,45,70,85,1000,
    '[{"label":"Interface","value":"PCIe 4.0 x4"},{"label":"Read speed","value":"5150 MB/s"}]'::jsonb),
  ('storage','Samsung','990 PRO 2TB NVMe Gen4','samsung-990-pro-2tb-nvme','8471','order_on_demand',
    80,85,88,85,2000,
    '[{"label":"Interface","value":"PCIe 4.0 x4"},{"label":"Read speed","value":"7450 MB/s"}]'::jsonb),
  ('storage','Samsung','9100 PRO 4TB NVMe Gen5','samsung-9100-pro-4tb-nvme','8471','order_on_demand',
    100,100,92,85,4000,
    '[{"label":"Interface","value":"PCIe 5.0 x4"},{"label":"Read speed","value":"14800 MB/s"},{"label":"Use case","value":"Model weights + scratch"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- Power supplies ----------
-- The engine requires psu_watts >= total TDP x 1.3. A dual-RTX-5090 build
-- draws ~1150W from the GPUs alone, which is why the 1600W unit is here.
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   psu_watts, specs)
values
  ('psu','Corsair','RM750e 750W 80+ Gold','corsair-rm750e-750w-gold','8504','order_on_demand',
    40,50,70,85,750,
    '[{"label":"Efficiency","value":"80+ Gold"},{"label":"Modular","value":"Fully modular"},{"label":"Standard","value":"ATX 3.0"}]'::jsonb),
  ('psu','Corsair','RM1000e 1000W 80+ Gold','corsair-rm1000e-1000w-gold','8504','order_on_demand',
    70,75,85,85,1000,
    '[{"label":"Efficiency","value":"80+ Gold"},{"label":"Modular","value":"Fully modular"},{"label":"Standard","value":"ATX 3.0"}]'::jsonb),
  ('psu','Corsair','HX1200i 1200W 80+ Platinum','corsair-hx1200i-1200w-platinum','8504','order_on_demand',
    88,88,90,85,1200,
    '[{"label":"Efficiency","value":"80+ Platinum"},{"label":"Modular","value":"Fully modular"},{"label":"Standard","value":"ATX 3.1"}]'::jsonb),
  ('psu','Corsair','AX1600i 1600W 80+ Titanium','corsair-ax1600i-1600w-titanium','8504','order_on_demand',
    100,95,92,85,1600,
    '[{"label":"Efficiency","value":"80+ Titanium"},{"label":"Use case","value":"Dual-GPU AI workstation"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- Cabinets ----------
-- max_gpu_length_mm matters: an RTX 5090 is 360mm and will not fit a compact case.
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   supported_form_factors, max_gpu_length_mm, max_cooler_height_mm, specs)
values
  ('case','Cooler Master','MasterBox Q300L mATX','cooler-master-masterbox-q300l','8473','order_on_demand',
    25,35,50,90, array['mATX','ITX'],360,160,
    '[{"label":"Type","value":"Micro-ATX mini tower"}]'::jsonb),
  ('case','Antec','C8 ARGB Mid Tower','antec-c8-argb-mid-tower','8473','order_on_demand',
    60,65,88,70, array['ATX','mATX','ITX'],400,175,
    '[{"label":"Type","value":"Mid tower"},{"label":"Side panel","value":"Tempered glass"},{"label":"Fans included","value":"4 x ARGB"}]'::jsonb),
  ('case','Lian Li','O11 Dynamic EVO','lian-li-o11-dynamic-evo','8473','order_on_demand',
    75,80,95,70, array['E-ATX','ATX','mATX','ITX'],423,167,
    '[{"label":"Type","value":"Mid tower"},{"label":"Side panel","value":"Tempered glass"}]'::jsonb),
  ('case','Fractal Design','Meshify 2 XL','fractal-design-meshify-2-xl','8473','order_on_demand',
    95,92,82,70, array['E-ATX','ATX','mATX','ITX'],460,185,
    '[{"label":"Type","value":"Full tower"},{"label":"Airflow","value":"High - mesh front"},{"label":"Use case","value":"Multi-GPU workstation"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- Cooling ----------
-- height_mm is checked against the cabinet max_cooler_height_mm. AIO blocks are
-- recorded at block height, since radiator clearance is a separate concern.
-- Note these use cooling_capacity_watts, NOT tdp_watts: a cooler dissipates
-- heat, it does not draw that much power, and summing it as load would inflate
-- every build's PSU requirement.
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score,
   height_mm, cooling_capacity_watts, specs)
values
  ('cooler','Thermalright','Peerless Assassin 120 SE','thermalright-peerless-assassin-120-se','8473','order_on_demand',
    50,55,75,85,155,240,
    '[{"label":"Type","value":"Dual-tower air"},{"label":"Rated for","value":"Up to 240W"}]'::jsonb),
  ('cooler','Noctua','NH-D15 G2','noctua-nh-d15-g2','8473','order_on_demand',
    80,85,88,85,168,280,
    '[{"label":"Type","value":"Dual-tower air"},{"label":"Rated for","value":"Up to 280W"},{"label":"Noise","value":"Very low"}]'::jsonb),
  ('cooler','Arctic','Liquid Freezer III 360','arctic-liquid-freezer-iii-360','8473','order_on_demand',
    92,90,92,85,55,350,
    '[{"label":"Type","value":"360mm AIO liquid"},{"label":"Rated for","value":"Up to 350W"},{"label":"Note","value":"Needs 360mm radiator clearance"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- OS / licences ----------
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score, specs)
values
  ('os','Microsoft','Windows 11 Pro OEM','microsoft-windows-11-pro-oem','8523','order_on_demand',
    70,85,90,95,
    '[{"label":"Licence","value":"OEM, single device"}]'::jsonb),
  ('os','Canonical','Ubuntu 24.04 LTS','canonical-ubuntu-24-04-lts','8523','in_stock',
    95,60,40,70,
    '[{"label":"Licence","value":"Free and open source"},{"label":"Note","value":"Preferred for CUDA / ML tooling"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- Monitors ----------
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score, specs)
values
  ('monitor','Dell','P2425H 24" 1080p IPS','dell-p2425h-24-1080p','8528','order_on_demand',
    60,45,50,95,
    '[{"label":"Size","value":"24 inch"},{"label":"Resolution","value":"1920 x 1080"},{"label":"Use case","value":"Lab seat / office"}]'::jsonb),
  ('monitor','LG','27UP850N 27" 4K USB-C','lg-27up850n-27-4k-usbc','8528','order_on_demand',
    65,95,70,85,
    '[{"label":"Size","value":"27 inch"},{"label":"Resolution","value":"3840 x 2160"},{"label":"Colour","value":"95% DCI-P3, 10-bit"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- Peripherals and power backup ----------
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score, specs)
values
  ('peripheral','Logitech','MK270r Wireless Keyboard + Mouse','logitech-mk270r-combo','8471','order_on_demand',
    50,50,50,90,
    '[{"label":"Type","value":"Wireless combo"}]'::jsonb),
  ('peripheral','APC','Back-UPS 1.5kVA','apc-back-ups-1-5kva','8504','order_on_demand',
    85,80,60,90,
    '[{"label":"Capacity","value":"1.5 kVA"},{"label":"Use case","value":"Protects a workstation through power cuts"}]'::jsonb)
on conflict (slug) do nothing;

-- ---------- Networking (lab builds) ----------
insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability, ai_score, creator_score, gaming_score, office_score, specs)
values
  ('network','TP-Link','TL-SG1024D 24-Port Gigabit Switch','tp-link-tl-sg1024d-24-port','8517','order_on_demand',
    80,60,40,85,
    '[{"label":"Ports","value":"24 x Gigabit"},{"label":"Use case","value":"Lab of up to 24 seats"}]'::jsonb)
on conflict (slug) do nothing;

-- ============================================================
-- SEED PRICES
-- One record per component, from the seller whose price was observed.
-- Guarded: a price is only inserted where the component has NO price at all,
-- so re-running never overwrites a number you verified yourself.
-- ============================================================
insert into public.pc_component_prices (component_id, seller, price, source)
select c.id, v.seller, v.price, 'manual'
from (values
  -- GPUs
  ('nvidia-geforce-rtx-5060-ti-16gb',        'mdcomputers',  42000),
  ('nvidia-geforce-rtx-5070-12gb',           'mdcomputers',  72000),
  ('nvidia-geforce-rtx-5070-ti-16gb',        'primeabgb',    95000),
  ('nvidia-geforce-rtx-5080-16gb',           'mdcomputers', 175000),
  ('nvidia-geforce-rtx-4090-24gb',           'primeabgb',   195000),
  ('nvidia-geforce-rtx-5090-32gb',           'mdcomputers', 350000),
  ('nvidia-rtx-pro-6000-blackwell-96gb',     'vendor',      950000),
  ('amd-radeon-rx-9070-xt-16gb',             'primeabgb',    95000),
  -- CPUs
  ('amd-ryzen-5-9600x',                      'mdcomputers',  22000),
  ('amd-ryzen-7-9700x',                      'mdcomputers',  31000),
  ('amd-ryzen-7-9800x3d',                    'mdcomputers',  48000),
  ('amd-ryzen-9-9950x',                      'mdcomputers',  62000),
  ('intel-core-ultra-7-265k',                'primeabgb',    34000),
  ('amd-ryzen-threadripper-7960x',           'mdcomputers', 135000),
  ('amd-ryzen-threadripper-9960x',           'vendor',      155000),
  -- Motherboards
  ('gigabyte-b850-eagle-wifi6e',             'mdcomputers',  17500),
  ('gigabyte-x870e-aorus-elite-wifi7',       'mdcomputers',  27700),
  ('asus-rog-strix-x870e-e-gaming-wifi',     'vedant',       59995),
  ('msi-z890-tomahawk-wifi',                 'primeabgb',    32000),
  ('asrock-trx50-ws',                        'vendor',       95000),
  -- Memory
  ('gskill-flare-x5-16gb-ddr5-5600',         'mdcomputers',  14000),
  ('corsair-vengeance-32gb-ddr5-6000',       'mdcomputers',  27000),
  ('corsair-vengeance-64gb-ddr5-6000',       'mdcomputers',  54000),
  ('kingston-fury-beast-128gb-ddr5-5600',    'vendor',      115000),
  -- Storage
  ('wd-black-sn770-1tb-nvme',                'mdcomputers',  19500),
  ('samsung-990-pro-2tb-nvme',               'primeabgb',    30000),
  ('samsung-9100-pro-4tb-nvme',              'vendor',       62000),
  -- Power supplies
  ('corsair-rm750e-750w-gold',               'mdcomputers',   9500),
  ('corsair-rm1000e-1000w-gold',             'mdcomputers',  14500),
  ('corsair-hx1200i-1200w-platinum',         'primeabgb',    26100),
  ('corsair-ax1600i-1600w-titanium',         'vendor',       52000),
  -- Cabinets
  ('cooler-master-masterbox-q300l',          'mdcomputers',   4500),
  ('antec-c8-argb-mid-tower',                'mdcomputers',   9500),
  ('lian-li-o11-dynamic-evo',                'primeabgb',    16500),
  ('fractal-design-meshify-2-xl',            'vedant',       22000),
  -- Cooling
  ('thermalright-peerless-assassin-120-se',  'mdcomputers',   3500),
  ('noctua-nh-d15-g2',                       'primeabgb',    14500),
  ('arctic-liquid-freezer-iii-360',          'mdcomputers',  11000),
  -- OS
  ('microsoft-windows-11-pro-oem',           'vendor',       12000),
  ('canonical-ubuntu-24-04-lts',             'vendor',           0),
  -- Monitors
  ('dell-p2425h-24-1080p',                   'vendor',       14000),
  ('lg-27up850n-27-4k-usbc',                 'vendor',       38000),
  -- Peripherals
  ('logitech-mk270r-combo',                  'vendor',        1500),
  ('apc-back-ups-1-5kva',                    'vendor',       18000),
  -- Networking
  ('tp-link-tl-sg1024d-24-port',             'vendor',       12000)
) as v(slug, seller, price)
join public.pc_components c on c.slug = v.slug
where not exists (
  select 1 from public.pc_component_prices p where p.component_id = c.id
);
