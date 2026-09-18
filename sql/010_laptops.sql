-- ============================================================
-- Laptops.
--
-- A laptop is ONE row in pc_components with type='laptop' — a whole
-- machine, not a part. That is the entire design decision here, and it
-- is why there is no laptop "build engine": you cannot choose the cooler
-- in a Legion Pro. Laptops are MATCHED against a brief, not assembled
-- from a parts bin. See src/systems/laptops.js.
--
-- WHY REUSE pc_components RATHER THAN A NEW TABLE
--   Everything a laptop needs already exists here and is already wired
--   up: dated price history with a seller (laptop street prices move as
--   violently as component prices), the current_price cache trigger, the
--   RLS split that keeps cost intelligence admin-only, HSN/GST for an
--   institutional quotation, the admin CRUD screens, and the four
--   workload scores. A second table would duplicate all of it.
--   The desktop engine never sees these rows: it only ever pulls the
--   part types a workload declares in profiles.js, and 'laptop' is not
--   one of them.
--
-- THE DECISIVE FIELD IS gpu_tgp_watts
--   Two laptops that both advertise "RTX 5070" can be ~40% apart in real
--   performance, because the chassis decides how many watts the card is
--   allowed to draw. Retailers do not print this. It is the single most
--   useful thing we can tell a laptop buyer, so it is a first-class
--   column and the matcher leads with it.
--
-- TWO KINDS OF AI LAPTOP, AND THEY ARE NOT COMPARABLE ON ONE NUMBER
--   Dedicated VRAM on a laptop tops out at 24GB (RTX 5090 Laptop). Unified
--   memory does not: an M4 Max or a Ryzen AI Max+ 395 fits 128GB, of which
--   ~96GB is reachable by the GPU. So a 1.2kg tablet can run a 70B model
--   that the fastest gaming laptop here cannot load at all — while being
--   slower per token, and outside CUDA. `vram_gb` therefore records what
--   the GPU can actually ADDRESS (not the total fitted), `compute_platform`
--   records whether the mainstream toolchain runs, and the matcher states
--   the capacity/speed/ecosystem trade in words rather than pretending one
--   score settles it.
--
-- PRICES ARE STORED EX-GST, like every other row in this table, so a
-- quotation line adds up correctly. Laptop buyers think in the sticker
-- price, so the UI shows the GST-inclusive figure — the conversion lives
-- in one place (LAPTOP_GST_MULTIPLIER in src/systems/laptops.js).
--
-- Safe to re-run. Run after 006.
-- ============================================================

-- ---------- LAPTOP COLUMNS ----------
-- Only fields the matcher actually reasons about get a column; anything
-- that is merely worth printing on a quote goes in `specs`.
alter table public.pc_components
  add column if not exists gpu_model         text,
  add column if not exists gpu_tgp_watts     int,
  add column if not exists compute_platform  text,
  add column if not exists cpu_model         text,
  add column if not exists ram_gb            int,
  add column if not exists ram_upgradable    boolean,
  add column if not exists max_ram_gb        int,
  add column if not exists screen_size_in    numeric(3,1),
  add column if not exists screen_res        text,
  add column if not exists screen_refresh_hz int,
  add column if not exists weight_kg         numeric(4,2),
  add column if not exists battery_wh        int,
  add column if not exists chassis_class     text,
  add column if not exists warranty_months   int;

comment on column public.pc_components.gpu_tgp_watts is
  'Laptop only. Watts the CHASSIS allows the GPU to draw, not the card''s class rating. Two laptops with the same gpu_model differ ~40% in real performance on this number alone.';
comment on column public.pc_components.vram_gb is
  'Dedicated VRAM. On unified-memory machines (Apple Silicon) this is the memory actually addressable by the GPU, not the total fitted.';
comment on column public.pc_components.compute_platform is
  'Laptop only: cuda | metal | rocm | integrated. Decides whether the mainstream local-LLM toolchain runs at all.';
comment on column public.pc_components.chassis_class is
  'Laptop only: thin | balanced | performance | desktop_replacement.';

-- Constraints added separately so re-running the file over an existing
-- table does not fail on a duplicate.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pc_components_compute_platform_chk') then
    alter table public.pc_components add constraint pc_components_compute_platform_chk
      check (compute_platform is null or compute_platform in ('cuda','metal','rocm','integrated'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pc_components_chassis_class_chk') then
    alter table public.pc_components add constraint pc_components_chassis_class_chk
      check (chassis_class is null or chassis_class in ('thin','balanced','performance','desktop_replacement'));
  end if;
end $$;

-- The matcher filters on type + status and then sorts on price, same as
-- the parts catalogue, so pc_components_type_status_idx already covers it.

-- ---------- SEED ----------
-- Current models, indicative Indian street prices, September 2026.
-- VERIFY BEFORE QUOTING: laptop pricing swings with festive offers, bank
-- cashback and refresh cycles, and the admin price-history screen is the
-- place to correct it. Prices below are EX-GST; the street figure each one
-- came from is in the comment beside it.
--
-- The pairs that teach the customer something are deliberate:
--   TUF A15 (RTX 5060 @ 115W) vs Legion Slim 5 (RTX 5060 @ 85W)
--   Omen 16  (RTX 5070 @ 115W) vs Zephyrus G14 (RTX 5070 @ 65W)
-- Same GPU name on the box, ~15-25% apart in practice. The matcher shows
-- the pair side by side whenever one of them is a candidate.
--
-- image_url points at the drawn chassis illustrations in public/laptops/.
-- They are ours, so there is no licensing or hotlinking problem, and they
-- read as deliberate rather than as a missing image. Replace them per
-- machine with a real photo through the admin upload field when you have
-- one you are entitled to use.

insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability,
   ai_score, creator_score, gaming_score, office_score,
   gpu_model, vram_gb, gpu_tgp_watts, compute_platform, cpu_model,
   ram_gb, ram_type, ram_upgradable, max_ram_gb, capacity_gb,
   screen_size_in, screen_res, screen_refresh_hz, weight_kg, battery_wh,
   chassis_class, warranty_months, image_url, specs)
values
  ('laptop','Lenovo','IdeaPad Slim 3 15','lenovo-ideapad-slim-3-15','8471','in_stock',
    4,12,8,62,
    'Radeon 610M (integrated)',0,null,'integrated','Ryzen 5 7520U',
    16,'LPDDR5',false,16,512,
    15.6,'1920x1080',60,1.62,47,
    'thin',12,'/laptops/thin.svg',
    '[{"label":"Ports","value":"2x USB-A, 1x USB-C, HDMI 1.4, 3.5mm"},{"label":"Display","value":"15.6\" FHD, 300 nits - fine indoors, dim outside"},{"label":"Memory","value":"Soldered at 16GB. Cannot be increased, ever."},{"label":"Honest note","value":"Documents, browsing, video calls and classwork. No dedicated graphics, so no modern games and no local AI models."}]'::jsonb),
  ('laptop','ASUS','Vivobook 16','asus-vivobook-16','8471','in_stock',
    8,26,16,74,
    'Intel Arc 130T (integrated)',0,null,'integrated','Core Ultra 5 225H',
    16,'DDR5',true,32,512,
    16.0,'1920x1200',60,1.88,50,
    'balanced',12,'/laptops/balanced.svg',
    '[{"label":"Ports","value":"2x USB-A, 1x USB-C, HDMI 2.1, SD reader, 3.5mm"},{"label":"Upgradable","value":"One free memory slot to 32GB, plus a second M.2 bay"},{"label":"Display","value":"16\" 16:10 - a genuinely useful amount of screen for spreadsheets"},{"label":"Honest note","value":"A capable everyday machine. Light photo editing is fine; video exports will take their time."}]'::jsonb),
  ('laptop','HP','Pavilion Plus 14 OLED','hp-pavilion-plus-14','8471','in_stock',
    10,34,20,78,
    'Intel Arc 130T (integrated)',0,null,'integrated','Core Ultra 5 225H',
    16,'LPDDR5X',false,16,1024,
    14.0,'2880x1800 OLED',120,1.41,68,
    'thin',12,'/laptops/thin.svg',
    '[{"label":"Display","value":"2.8K OLED, 120Hz, 100% DCI-P3 - colour-accurate enough for real photo work"},{"label":"Ports","value":"2x USB-C (Thunderbolt 4), 1x USB-A, HDMI 2.1"},{"label":"Memory","value":"Soldered at 16GB. Cannot be increased, ever."},{"label":"Honest note","value":"Photo and design work travel well on this. Video editing and 3D do not - there is no dedicated graphics card."}]'::jsonb),
  ('laptop','Acer','Nitro V 15','acer-nitro-v-15','8471','in_stock',
    16,35,42,70,
    'GeForce RTX 4050 Laptop',6,75,'cuda','Core i5-13420H',
    16,'DDR5',true,32,512,
    15.6,'1920x1080',144,2.1,57,
    'balanced',12,'/laptops/balanced.svg',
    '[{"label":"Generation","value":"Last-generation parts, which is exactly why it costs this. Still the cheapest way into a real graphics card."},{"label":"Upgradable","value":"2 memory slots, 2 M.2 bays - unusually serviceable at this price"},{"label":"GPU power","value":"75W of a 115W-capable card"},{"label":"AI caveat","value":"6GB of VRAM is below the 8GB floor where local models become usable."}]'::jsonb),
  ('laptop','HP','Victus 15','hp-victus-15','8471','in_stock',
    24,40,54,72,
    'GeForce RTX 5050 Laptop',8,115,'cuda','Core i5-13500HX',
    16,'DDR5',true,64,512,
    15.6,'1920x1080',144,2.29,70,
    'balanced',12,'/laptops/balanced.svg',
    '[{"label":"GPU power","value":"115W - the full rating for this card, which is rare at this price"},{"label":"Upgradable","value":"2 memory slots to 64GB, 2 M.2 bays"},{"label":"Runs locally","value":"7B models at Q4"},{"label":"Honest note","value":"Plain plastic and a basic FHD panel. The money went into the parts that decide performance."}]'::jsonb),
  ('laptop','Lenovo','LOQ 15','lenovo-loq-15','8471','in_stock',
    26,42,52,74,
    'GeForce RTX 5050 Laptop',8,100,'cuda','Ryzen 7 260',
    16,'DDR5',true,32,512,
    15.6,'1920x1080',144,2.38,60,
    'balanced',12,'/laptops/balanced.svg',
    '[{"label":"GPU power","value":"100W of a 115W-capable card"},{"label":"Upgradable","value":"2 memory slots, 2 M.2 bays"},{"label":"Runs locally","value":"7B models at Q4"},{"label":"Display","value":"144Hz FHD - the right panel for esports titles at this budget"}]'::jsonb),
  ('laptop','Apple','MacBook Air 13 M4','apple-macbook-air-13-m4','8471','in_stock',
    18,55,15,92,
    'Apple M4 10-core GPU',12,null,'metal','Apple M4',
    16,'Unified',false,16,512,
    13.6,'2560x1664',60,1.24,53,
    'thin',12,'/laptops/thin.svg',
    '[{"label":"Memory","value":"16GB unified - roughly 12GB reachable by the GPU"},{"label":"Battery","value":"15+ hours of real work, and completely fanless"},{"label":"Ports","value":"2x Thunderbolt 4, MagSafe, 3.5mm. No HDMI, no USB-A, no card reader."},{"label":"AI caveat","value":"No CUDA. Ollama and LM Studio run well; anything requiring CUDA does not run at all."},{"label":"Honest note","value":"The best machine here for writing, studying and carrying. Not a machine for games or sustained rendering."}]'::jsonb),
  ('laptop','ASUS','TUF Gaming A15','asus-tuf-gaming-a15','8471','in_stock',
    32,52,64,78,
    'GeForce RTX 5060 Laptop',8,115,'cuda','Ryzen 9 8945HS',
    16,'DDR5',true,64,1024,
    15.6,'2560x1440',165,2.2,90,
    'performance',12,'/laptops/performance.svg',
    '[{"label":"GPU power","value":"115W - the full rating for this card"},{"label":"Upgradable","value":"2 memory slots to 64GB, 2 M.2 bays"},{"label":"Build","value":"MIL-STD-810H tested chassis and a 90Wh battery"},{"label":"Runs locally","value":"7B models at Q4, comfortably"}]'::jsonb),
  ('laptop','Lenovo','Legion Slim 5 16','lenovo-legion-slim-5-16','8471','in_stock',
    34,56,56,84,
    'GeForce RTX 5060 Laptop',8,85,'cuda','Ryzen AI 9 365',
    32,'DDR5',true,64,1024,
    16.0,'2560x1600',165,1.99,80,
    'balanced',36,'/laptops/balanced.svg',
    '[{"label":"GPU power","value":"85W, not 115W - a thinner chassis, so roughly 15-20% behind the same card at full power"},{"label":"Why you would buy it","value":"32GB of memory as standard, under 2kg, and it is quiet. The TUF is faster and none of those things."},{"label":"Upgradable","value":"2 memory slots to 64GB"},{"label":"Warranty","value":"3 years on-site"}]'::jsonb),
  ('laptop','Dell','14 Premium','dell-14-premium','8471','order_on_demand',
    14,45,18,93,
    'Intel Arc 140V (integrated)',0,null,'integrated','Core Ultra 7 258V',
    32,'LPDDR5X',false,32,1024,
    14.5,'3200x2000 OLED touch',120,1.66,69,
    'thin',12,'/laptops/thin.svg',
    '[{"label":"Display","value":"3.2K OLED touch, 120Hz - among the best panels on any laptop"},{"label":"Battery","value":"Lunar Lake is genuinely frugal: a full working day away from a socket"},{"label":"Copilot+ NPU","value":"47 TOPS on-device NPU runs Windows AI features locally - useful, and not the same thing as running an LLM"},{"label":"Memory","value":"Soldered at 32GB. Cannot be increased, ever."},{"label":"AI caveat","value":"No dedicated VRAM. Local models are not realistic on this machine."}]'::jsonb),
  ('laptop','HP','Omen 16','hp-omen-16','8471','in_stock',
    36,66,72,86,
    'GeForce RTX 5070 Laptop',8,115,'cuda','Core Ultra 9 275HX',
    32,'DDR5',true,64,1024,
    16.1,'2560x1600',240,2.38,83,
    'performance',12,'/laptops/performance.svg',
    '[{"label":"GPU power","value":"115W - the full rating for this card"},{"label":"Upgradable","value":"2 memory slots to 64GB, 2 M.2 bays"},{"label":"Display","value":"16.1\" WQXGA at 240Hz"},{"label":"Honest note","value":"A fast machine that is loud under load and heavy in a bag. That is the trade for full-power silicon."}]'::jsonb),
  ('laptop','Lenovo','ThinkPad X1 Carbon Gen 13','lenovo-thinkpad-x1-carbon-g13','8471','order_on_demand',
    14,40,12,96,
    'Intel Arc 140V (integrated)',0,null,'integrated','Core Ultra 7 268V',
    32,'LPDDR5X',false,32,1024,
    14.0,'2880x1800 OLED',120,0.99,57,
    'thin',36,'/laptops/thin.svg',
    '[{"label":"Weight","value":"990 grams. You stop noticing it is in the bag."},{"label":"Build","value":"MIL-STD-810H, carbon-fibre lid, and the best keyboard sold on a laptop"},{"label":"Warranty","value":"3 years on-site - the reason organisations buy these rather than something faster"},{"label":"Memory","value":"Soldered at 32GB. Cannot be increased, ever."},{"label":"Honest note","value":"Bought for the keyboard, the weight and the service network. It is not fast, and it is not meant to be."}]'::jsonb),
  ('laptop','ASUS','ROG Zephyrus G14','asus-rog-zephyrus-g14','8471','order_on_demand',
    33,62,60,88,
    'GeForce RTX 5070 Laptop',8,65,'cuda','Ryzen AI 9 HX 370',
    32,'LPDDR5X',false,32,1024,
    14.0,'2880x1800 OLED',120,1.5,73,
    'thin',12,'/laptops/thin.svg',
    '[{"label":"GPU power","value":"65W - the price of a 1.5kg chassis, roughly 25% behind the same card at 115W"},{"label":"Display","value":"14\" 3K OLED, 120Hz"},{"label":"Memory","value":"Soldered at 32GB. Cannot be increased, ever."},{"label":"Why you would buy it","value":"It is the only machine on this list with a real graphics card that you will actually carry every day."}]'::jsonb),
  ('laptop','Lenovo','Legion Pro 5i 16','lenovo-legion-pro-5i-16','8471','order_on_demand',
    44,74,80,86,
    'GeForce RTX 5070 Ti Laptop',12,140,'cuda','Core Ultra 9 275HX',
    32,'DDR5',true,64,1024,
    16.0,'2560x1600',240,2.72,80,
    'performance',36,'/laptops/performance.svg',
    '[{"label":"GPU power","value":"140W - the full rating for this card"},{"label":"Runs locally","value":"12GB of VRAM - comfortable with 13-14B models at Q4"},{"label":"Upgradable","value":"2 memory slots to 64GB, 2 M.2 bays"},{"label":"Warranty","value":"3 years on-site"}]'::jsonb),
  ('laptop','Apple','MacBook Pro 14 M4 Pro','apple-macbook-pro-14-m4-pro','8471','order_on_demand',
    52,88,28,95,
    'Apple M4 Pro 20-core GPU',36,null,'metal','Apple M4 Pro',
    48,'Unified',false,48,1024,
    14.2,'3024x1964 XDR',120,1.6,72,
    'thin',12,'/laptops/thin.svg',
    '[{"label":"Memory","value":"48GB unified - roughly 36GB reachable by the GPU, more than any NVIDIA laptop card"},{"label":"Runs locally","value":"30B models at Q4. Slower per token than an RTX card, but far larger models fit."},{"label":"Ports","value":"3x Thunderbolt 5, HDMI, SD reader, MagSafe - unusually complete"},{"label":"AI caveat","value":"No CUDA. If your course, client or toolchain specifies CUDA, buy the Legion instead."}]'::jsonb),
  ('laptop','ASUS','ROG Flow Z13 (2025)','asus-rog-flow-z13-2025','8471','order_on_demand',
    70,72,62,90,
    'Radeon 8060S (Ryzen AI Max+ 395)',96,null,'rocm','Ryzen AI Max+ 395',
    128,'LPDDR5X',false,128,1024,
    13.4,'2560x1600 touch',180,1.2,70,
    'thin',12,'/laptops/thin.svg',
    '[{"label":"Memory","value":"128GB unified LPDDR5X, up to 96GB of it allocatable to the GPU - four times the VRAM of an RTX 5090 laptop"},{"label":"Runs locally","value":"70B models at Q4, on a 1.2kg tablet. Nothing else this size can."},{"label":"AI caveat","value":"ROCm and Vulkan, not CUDA. Ollama, LM Studio and llama.cpp are fine; CUDA-only training code is not."},{"label":"Honest note","value":"Memory bandwidth is roughly half an RTX 5090 laptop, so tokens arrive slower and long prompts take longer to process. It fits models nothing else portable can fit. Which matters more is your call."},{"label":"Form","value":"Detachable tablet with a keyboard cover. 1.2kg is the tablet alone."}]'::jsonb),
  ('laptop','Lenovo','Legion Pro 7i 16','lenovo-legion-pro-7i-16','8471','order_on_demand',
    58,82,86,88,
    'GeForce RTX 5080 Laptop',16,175,'cuda','Core Ultra 9 275HX',
    32,'DDR5',true,64,2048,
    16.0,'2560x1600',240,2.72,99,
    'performance',36,'/laptops/performance.svg',
    '[{"label":"GPU power","value":"175W with Dynamic Boost - the full rating"},{"label":"Runs locally","value":"16GB of VRAM - 14B models comfortably, and a small LoRA fine-tune"},{"label":"Upgradable","value":"2 memory slots to 64GB, 2 M.2 bays"},{"label":"Warranty","value":"3 years on-site"},{"label":"Honest note","value":"The fastest CUDA machine here that is still a normal-sized laptop."}]'::jsonb),
  ('laptop','HP','ZBook Ultra G1a 14','hp-zbook-ultra-g1a-14','8471','order_on_demand',
    74,80,55,94,
    'Radeon 8060S (Ryzen AI Max+ 395)',96,null,'rocm','Ryzen AI Max+ 395',
    128,'LPDDR5X',false,128,2048,
    14.0,'2880x1800 OLED',120,1.5,74,
    'thin',36,'/laptops/thin.svg',
    '[{"label":"Class","value":"Mobile workstation - ISV certified, business-grade service"},{"label":"Memory","value":"128GB unified LPDDR5X, up to 96GB allocatable to the GPU"},{"label":"Runs locally","value":"70B models at Q4 in a 1.5kg 14-inch chassis"},{"label":"AI caveat","value":"ROCm and Vulkan, not CUDA."},{"label":"Warranty","value":"3 years on-site"}]'::jsonb),
  ('laptop','Apple','MacBook Pro 16 M4 Max','apple-macbook-pro-16-m4-max','8471','order_on_demand',
    78,98,35,96,
    'Apple M4 Max 40-core GPU',96,null,'metal','Apple M4 Max',
    128,'Unified',false,128,1024,
    16.2,'3456x2234 XDR',120,2.15,100,
    'balanced',12,'/laptops/balanced.svg',
    '[{"label":"Memory","value":"128GB unified - roughly 96GB reachable by the GPU, and at 546GB/s the fastest memory of any laptop here"},{"label":"Runs locally","value":"70B models at Q4 with room to spare, and usably quick with it"},{"label":"Creative work","value":"The fastest machine on this list for video editing and colour grading, by a distance"},{"label":"AI caveat","value":"No CUDA. Excellent for running models, wrong for CUDA-only training code."},{"label":"Battery","value":"Does the above for hours unplugged, which no gaming laptop can claim."}]'::jsonb),
  ('laptop','ASUS','ROG Strix SCAR 18','asus-rog-strix-scar-18','8471','order_on_demand',
    76,92,94,90,
    'GeForce RTX 5090 Laptop',24,175,'cuda','Core Ultra 9 275HX',
    64,'DDR5',true,96,2048,
    18.0,'2560x1600',240,3.1,90,
    'desktop_replacement',24,'/laptops/desktop-replacement.svg',
    '[{"label":"GPU power","value":"175W with Dynamic Boost - the full rating"},{"label":"Runs locally","value":"24GB of VRAM - the most on any NVIDIA laptop. 30B models at Q4, fast."},{"label":"Upgradable","value":"2 memory slots to 96GB, 2 M.2 bays"},{"label":"Honest note","value":"3.1kg plus a 380W power brick. This is a machine you move between rooms, not one you carry."}]'::jsonb)
on conflict (slug) do nothing;

insert into public.pc_component_prices (component_id, seller, price, source)
select c.id, v.seller, v.price, 'manual'
from (values
  ('lenovo-ideapad-slim-3-15',          'vendor',  35593.22), -- Rs 42,000 street
  ('asus-vivobook-16',                  'vendor',  49152.54), -- Rs 58,000 street
  ('hp-pavilion-plus-14',               'vendor',  61016.95), -- Rs 72,000 street
  ('acer-nitro-v-15',                   'vendor',  58474.58), -- Rs 69,000 street
  ('hp-victus-15',                      'vendor',  72033.90), -- Rs 85,000 street
  ('lenovo-loq-15',                     'vendor',  77966.10), -- Rs 92,000 street
  ('apple-macbook-air-13-m4',           'vendor',  97457.63), -- Rs 115,000 street
  ('asus-tuf-gaming-a15',               'vendor', 105932.20), -- Rs 125,000 street
  ('lenovo-legion-slim-5-16',           'vendor', 122881.36), -- Rs 145,000 street
  ('dell-14-premium',                   'vendor', 148305.08), -- Rs 175,000 street
  ('hp-omen-16',                        'vendor', 148305.08), -- Rs 175,000 street
  ('lenovo-thinkpad-x1-carbon-g13',     'vendor', 165254.24), -- Rs 195,000 street
  ('asus-rog-zephyrus-g14',             'vendor', 165254.24), -- Rs 195,000 street
  ('lenovo-legion-pro-5i-16',           'vendor', 190677.97), -- Rs 225,000 street
  ('apple-macbook-pro-14-m4-pro',       'vendor', 220338.98), -- Rs 260,000 street
  ('asus-rog-flow-z13-2025',            'vendor', 250000.00), -- Rs 295,000 street
  ('lenovo-legion-pro-7i-16',           'vendor', 279661.02), -- Rs 330,000 street
  ('hp-zbook-ultra-g1a-14',             'vendor', 322033.90), -- Rs 380,000 street
  ('apple-macbook-pro-16-m4-max',       'vendor', 381355.93), -- Rs 450,000 street
  ('asus-rog-strix-scar-18',            'vendor', 389830.51)  -- Rs 460,000 street
) as v(slug, seller, price)
join public.pc_components c on c.slug = v.slug
where not exists (
  select 1 from public.pc_component_prices p where p.component_id = c.id
);

-- ============================================================
-- SEED, PART 2 — brand coverage.
--
-- Added after the first pass left a customer searching "HP laptop budget
-- 40000" with nothing: the catalogue had six brands and a Rs 42,000 floor,
-- so both the brand and the budget missed. The matcher reads brands from
-- whatever is in this table rather than a list in the code, so every brand
-- below became searchable the moment it was inserted — including any you
-- add later through the admin screen.
--
-- These also widen the TGP teaching spread, which is the whole point of
-- the laptop track. Same card, three different machines:
--   RTX 5060    Legion Slim 5 85W  <  Katana 15 105W  <  TUF A15 115W
--   RTX 5070    Zephyrus G14 65W   <  AORUS 16X 100W  <  Omen 16 115W
--   RTX 5070 Ti Stealth 16 AI 105W <  Helios Neo 140W = Legion Pro 5i 140W
--
-- Safe to re-run, and safe to run on top of part 1.
-- ============================================================

insert into public.pc_components
  (type, brand, name, slug, hsn_code, availability,
   ai_score, creator_score, gaming_score, office_score,
   gpu_model, vram_gb, gpu_tgp_watts, compute_platform, cpu_model,
   ram_gb, ram_type, ram_upgradable, max_ram_gb, capacity_gb,
   screen_size_in, screen_res, screen_refresh_hz, weight_kg, battery_wh,
   chassis_class, warranty_months, image_url, specs)
values
  ('laptop','HP','15s','hp-15s','8471','in_stock',
    3,8,6,55,
    'Intel UHD (integrated)',0,null,'integrated','Core i3-1315U',
    8,'DDR4',true,16,512,
    15.6,'1920x1080',60,1.59,41,
    'thin',12,'/laptops/thin.svg',
    '[{"label":"Upgradable","value":"One free memory slot — take it to 16GB on day one, it needs it"},{"label":"Ports","value":"2x USB-A, 1x USB-C, HDMI, SD reader, 3.5mm"},{"label":"Honest note","value":"8GB and a base i3. It types, browses and runs Office. Ask it for more and it will struggle."}]'::jsonb),
  ('laptop','Infinix','INBook Air Pro+','infinix-inbook-air-pro-plus','8471','in_stock',
    6,24,12,72,
    'Intel Iris Xe (integrated)',0,null,'integrated','Core i5-1334U',
    16,'LPDDR5',false,16,512,
    14.0,'2880x1800',60,1.19,50,
    'thin',12,'/laptops/thin.svg',
    '[{"label":"Weight","value":"1.19kg in a metal body — the lightest machine on this list by some way"},{"label":"Display","value":"2.8K at 14 inches, which is unusual at this price"},{"label":"Memory","value":"Soldered at 16GB. Cannot be increased, ever."},{"label":"Honest note","value":"Remarkable value on paper. Service network is thinner than HP, Lenovo or Dell — worth knowing before you buy."}]'::jsonb),
  ('laptop','Dell','Inspiron 15 3530','dell-inspiron-15-3530','8471','in_stock',
    6,22,14,70,
    'Intel UHD (integrated)',0,null,'integrated','Core i5-1334U',
    16,'DDR4',true,32,512,
    15.6,'1920x1080',120,1.66,54,
    'balanced',12,'/laptops/balanced.svg',
    '[{"label":"Upgradable","value":"2 memory slots to 32GB, plus a second M.2 bay"},{"label":"Display","value":"120Hz FHD — smoother than the 60Hz panels usual at this price"},{"label":"Honest note","value":"A plain, serviceable office machine with Dell support behind it."}]'::jsonb),
  ('laptop','MSI','Katana 15','msi-katana-15','8471','in_stock',
    30,50,61,76,
    'GeForce RTX 5060 Laptop',8,105,'cuda','Core i7-13620H',
    16,'DDR5',true,64,1024,
    15.6,'1920x1080',144,2.25,53,
    'performance',12,'/laptops/performance.svg',
    '[{"label":"GPU power","value":"105W of a 115W-capable card — nearly full power, and cheaper than the machines that match it"},{"label":"Upgradable","value":"2 memory slots to 64GB, 2 M.2 bays"},{"label":"Runs locally","value":"7B models at Q4"},{"label":"Honest note","value":"53Wh battery. It is a mains-powered machine that happens to fold shut."}]'::jsonb),
  ('laptop','Samsung','Galaxy Book5 Pro 14','samsung-galaxy-book5-pro-14','8471','order_on_demand',
    12,42,17,94,
    'Intel Arc 140V (integrated)',0,null,'integrated','Core Ultra 7 256V',
    16,'LPDDR5X',false,16,512,
    14.0,'2880x1800 AMOLED',120,1.23,63,
    'thin',12,'/laptops/thin.svg',
    '[{"label":"Display","value":"3K AMOLED, 120Hz, touch"},{"label":"Weight","value":"1.23kg, and it runs a full day off the charger"},{"label":"Memory","value":"Soldered at 16GB. Cannot be increased, ever — the one thing to think hard about here."},{"label":"AI caveat","value":"No dedicated VRAM. Local models are not realistic on this machine."}]'::jsonb),
  ('laptop','Gigabyte','AORUS 16X','gigabyte-aorus-16x','8471','order_on_demand',
    33,60,69,82,
    'GeForce RTX 5070 Laptop',8,100,'cuda','Core Ultra 7 255HX',
    16,'DDR5',true,64,1024,
    16.0,'2560x1600',165,2.3,99,
    'performance',24,'/laptops/performance.svg',
    '[{"label":"GPU power","value":"100W of a 115W-capable card"},{"label":"Upgradable","value":"2 memory slots to 64GB, 2 M.2 bays"},{"label":"Battery","value":"99Wh — the largest a laptop is legally allowed to fly with"},{"label":"Honest note","value":"16GB of memory at this price is the weak point. Budget for another 16GB."}]'::jsonb),
  ('laptop','Acer','Predator Helios Neo 16','acer-predator-helios-neo-16','8471','order_on_demand',
    43,72,79,84,
    'GeForce RTX 5070 Ti Laptop',12,140,'cuda','Core Ultra 9 275HX',
    16,'DDR5',true,64,1024,
    16.0,'2560x1600',180,2.7,90,
    'performance',12,'/laptops/performance.svg',
    '[{"label":"GPU power","value":"140W — the full rating for this card"},{"label":"Runs locally","value":"12GB of VRAM — comfortable with 13-14B models at Q4"},{"label":"Upgradable","value":"2 memory slots to 64GB, 2 M.2 bays"},{"label":"Honest note","value":"The cheapest way to a full-power 5070 Ti. It is heavy and the fans are audible."}]'::jsonb),
  ('laptop','MSI','Stealth 16 AI','msi-stealth-16-ai','8471','order_on_demand',
    42,76,74,90,
    'GeForce RTX 5070 Ti Laptop',12,105,'cuda','Core Ultra 9 285H',
    32,'DDR5',true,64,1024,
    16.0,'2560x1600 OLED',240,1.99,99,
    'balanced',12,'/laptops/balanced.svg',
    '[{"label":"GPU power","value":"105W of a 140W-capable card — about 12% behind the Helios Neo, in a chassis 700g lighter"},{"label":"Display","value":"16\" QHD+ OLED at 240Hz"},{"label":"Upgradable","value":"2 memory slots to 64GB"},{"label":"Why you would buy it","value":"A 5070 Ti and 32GB under 2kg. The Helios Neo is faster and you will not carry it."}]'::jsonb)
on conflict (slug) do nothing;

insert into public.pc_component_prices (component_id, seller, price, source)
select c.id, v.seller, v.price, 'manual'
from (values
  ('hp-15s',                            'vendor',  32203.39), -- Rs 38,000 street
  ('infinix-inbook-air-pro-plus',       'vendor',  36440.68), -- Rs 43,000 street
  ('dell-inspiron-15-3530',             'vendor',  44067.80), -- Rs 52,000 street
  ('msi-katana-15',                     'vendor',  97457.63), -- Rs 115,000 street
  ('samsung-galaxy-book5-pro-14',       'vendor', 110169.49), -- Rs 130,000 street
  ('gigabyte-aorus-16x',                'vendor', 139830.51), -- Rs 165,000 street
  ('acer-predator-helios-neo-16',       'vendor', 173728.81), -- Rs 205,000 street
  ('msi-stealth-16-ai',                 'vendor', 207627.12)  -- Rs 245,000 street
) as v(slug, seller, price)
join public.pc_components c on c.slug = v.slug
where not exists (
  select 1 from public.pc_component_prices p where p.component_id = c.id
);
