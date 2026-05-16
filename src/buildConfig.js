// Configurator data for refurbished consoles + custom gaming PCs.
// Prices are indicative — final price confirmed on WhatsApp.

export function formatPrice(n) {
  return `₹${n.toLocaleString('en-IN')}`
}

// ────────────────────────────────────────────────────────────────
// REFURBISHED CONSOLES
// ────────────────────────────────────────────────────────────────

export const REFURB_CONSOLES = [
  {
    id: 'ps5-refurb',
    name: 'PlayStation 5 (Refurbished)',
    tagline: '8K-capable · SSD · 4K @ 120Hz',
    basePrice: 35000,
    controller: { name: 'DualSense Controller', price: 4500 },
    maxControllers: 4,
  },
  {
    id: 'ps4-refurb',
    name: 'PlayStation 4 (Refurbished)',
    tagline: '1080p / 4K Pro · Huge game library',
    basePrice: 12000,
    controller: { name: 'DualShock 4 Controller', price: 2800 },
    maxControllers: 4,
  },
  {
    id: 'xbox-one-refurb',
    name: 'Xbox One (Refurbished)',
    tagline: 'Game Pass compatible · 4K Blu-ray',
    basePrice: 13000,
    controller: { name: 'Xbox Wireless Controller', price: 3200 },
    maxControllers: 4,
  },
  {
    id: 'xbox-series-s-refurb',
    name: 'Xbox Series S (Refurbished)',
    tagline: 'All-digital · 1440p @ 120fps',
    basePrice: 22000,
    controller: { name: 'Xbox Wireless Controller', price: 3500 },
    maxControllers: 4,
  },
  {
    id: 'psp-refurb',
    name: 'PSP (Refurbished)',
    tagline: 'Handheld classic · UMD / digital library',
    basePrice: 4500,
    controller: null,
    maxControllers: 0,
  },
]

export const CONSOLE_GAMES = {
  'ps5-refurb': [
    { id: 'spider2', name: "Marvel's Spider-Man 2", price: 3500 },
    { id: 'gow-r', name: 'God of War Ragnarök', price: 2800 },
    { id: 'fc24', name: 'EA Sports FC 24', price: 2500 },
    { id: 'gt7', name: 'Gran Turismo 7', price: 2500 },
    { id: 'horizon-fw', name: 'Horizon Forbidden West', price: 2500 },
    { id: 'demons-souls', name: "Demon's Souls", price: 2800 },
    { id: 'ratchet-ra', name: 'Ratchet & Clank: Rift Apart', price: 2500 },
    { id: 'ff16', name: 'Final Fantasy XVI', price: 3500 },
  ],
  'ps4-refurb': [
    { id: 'gtav-ps4', name: 'Grand Theft Auto V', price: 1500 },
    { id: 'tlou2-ps4', name: 'The Last of Us Part II', price: 1800 },
    { id: 'gow2018', name: 'God of War (2018)', price: 1800 },
    { id: 'rdr2-ps4', name: 'Red Dead Redemption 2', price: 2200 },
    { id: 'spider-mm', name: 'Spider-Man: Miles Morales', price: 1800 },
    { id: 'uncharted4', name: "Uncharted 4: A Thief's End", price: 1500 },
    { id: 'fifa21-ps4', name: 'FIFA 21', price: 1200 },
    { id: 'spiderman-ps4', name: "Marvel's Spider-Man", price: 1500 },
  ],
  'xbox-one-refurb': [
    { id: 'forza-h5', name: 'Forza Horizon 5', price: 2200 },
    { id: 'halo-inf', name: 'Halo Infinite', price: 2500 },
    { id: 'gtav-xb', name: 'Grand Theft Auto V', price: 1500 },
    { id: 'rdr2-xb', name: 'Red Dead Redemption 2', price: 2200 },
    { id: 'bf4-xb', name: 'Battlefield 4', price: 800 },
    { id: 'fc5-xb', name: 'Far Cry 5', price: 1500 },
    { id: 'acods-xb', name: "Assassin's Creed Odyssey", price: 1500 },
    { id: 'witcher3-xb', name: 'The Witcher 3: Wild Hunt', price: 1800 },
  ],
  'xbox-series-s-refurb': [
    { id: 'starfield-xs', name: 'Starfield', price: 3500 },
    { id: 'forza-mt', name: 'Forza Motorsport', price: 2800 },
    { id: 'forza-h5-xs', name: 'Forza Horizon 5', price: 2500 },
    { id: 'halo-inf-xs', name: 'Halo Infinite', price: 2500 },
    { id: 'gears5-xs', name: 'Gears 5', price: 1500 },
    { id: 'msfs-xs', name: 'Microsoft Flight Simulator', price: 2800 },
  ],
  'psp-refurb': [
    { id: 'gta-vcs', name: 'GTA: Vice City Stories', price: 600 },
    { id: 'gta-lcs', name: 'GTA: Liberty City Stories', price: 600 },
    { id: 'gow-cos', name: 'God of War: Chains of Olympus', price: 700 },
    { id: 'gow-gos', name: 'God of War: Ghost of Sparta', price: 700 },
    { id: 'tekken6', name: 'Tekken 6', price: 600 },
    { id: 'crisis-core', name: 'Crisis Core: FF VII', price: 800 },
    { id: 'mhfu-psp', name: 'Monster Hunter Freedom Unite', price: 700 },
  ],
}

export const CONSOLE_ACCESSORIES = [
  { id: 'hdmi-cable', name: 'HDMI 2.1 Cable (2m)', price: 400 },
  { id: 'power-cable', name: 'Power Cable / Adapter', price: 500 },
  { id: 'charging-dock', name: 'Dual Charging Dock', price: 1500 },
  { id: 'headset', name: 'Gaming Headset', price: 2200 },
  { id: 'memory-card', name: 'Memory Card / Storage Expansion', price: 2500 },
  { id: 'cleaning-kit', name: 'Console Cleaning Kit', price: 400 },
  { id: 'protective-cover', name: 'Protective Cover', price: 800 },
  { id: 'warranty-3mo', name: 'Extended Warranty (3 months)', price: 1500 },
]

// ────────────────────────────────────────────────────────────────
// CUSTOM GAMING PC PARTS
// ────────────────────────────────────────────────────────────────

// Each section: required = must pick one, optional = can be skipped (no selection)
export const PC_SECTIONS = [
  {
    key: 'cpu',
    label: 'Processor (CPU)',
    icon: 'memory',
    required: true,
    options: [
      { id: 'i3-12100f', name: 'Intel Core i3-12100F', tagline: '4C / 8T · 3.3GHz', price: 8500 },
      { id: 'i5-12400f', name: 'Intel Core i5-12400F', tagline: '6C / 12T · 4.4GHz', price: 13500 },
      { id: 'i5-13400f', name: 'Intel Core i5-13400F', tagline: '10C · 4.6GHz', price: 18000 },
      { id: 'i7-13700kf', name: 'Intel Core i7-13700KF', tagline: '16C · 5.4GHz', price: 32000 },
      { id: 'r5-5600', name: 'AMD Ryzen 5 5600', tagline: '6C / 12T · 4.4GHz', price: 12000 },
      { id: 'r5-7600', name: 'AMD Ryzen 5 7600', tagline: '6C / 12T · 5.1GHz · AM5', price: 17000 },
      { id: 'r7-7700x', name: 'AMD Ryzen 7 7700X', tagline: '8C / 16T · 5.4GHz', price: 28000 },
    ],
  },
  {
    key: 'motherboard',
    label: 'Motherboard',
    icon: 'developer_board',
    required: true,
    options: [
      { id: 'mb-b660', name: 'B660M Micro-ATX', tagline: 'LGA 1700 · DDR4', price: 9500 },
      { id: 'mb-b760', name: 'B760M Micro-ATX', tagline: 'LGA 1700 · DDR5', price: 14000 },
      { id: 'mb-z790', name: 'Z790 ATX', tagline: 'LGA 1700 · DDR5 · OC', price: 22000 },
      { id: 'mb-b550', name: 'B550 ATX', tagline: 'AM4 · DDR4', price: 9500 },
      { id: 'mb-b650', name: 'B650 ATX', tagline: 'AM5 · DDR5', price: 16500 },
    ],
  },
  {
    key: 'ram',
    label: 'Memory (RAM)',
    icon: 'sd_storage',
    required: true,
    options: [
      { id: 'ram-8-ddr4', name: '8GB DDR4 3200MHz', tagline: 'Single stick', price: 1800 },
      { id: 'ram-16-ddr4', name: '16GB (2x8GB) DDR4 3200MHz', tagline: 'Dual channel', price: 3500 },
      { id: 'ram-32-ddr4', name: '32GB (2x16GB) DDR4 3600MHz', tagline: 'Dual channel', price: 7000 },
      { id: 'ram-16-ddr5', name: '16GB (2x8GB) DDR5 5600MHz', tagline: 'AM5 / 12th-13th gen', price: 5500 },
      { id: 'ram-32-ddr5', name: '32GB (2x16GB) DDR5 6000MHz', tagline: 'AM5 / 12th-13th gen', price: 10500 },
      { id: 'ram-64-ddr5', name: '64GB (2x32GB) DDR5 6000MHz', tagline: 'Workstation tier', price: 22000 },
    ],
  },
  {
    key: 'storage',
    label: 'Primary Storage',
    icon: 'storage',
    required: true,
    options: [
      { id: 'ssd-256-sata', name: '256GB SATA SSD', tagline: 'Budget boot', price: 1800 },
      { id: 'ssd-512-nvme', name: '512GB NVMe Gen3 SSD', tagline: 'Fast loads', price: 3500 },
      { id: 'ssd-1tb-nvme', name: '1TB NVMe Gen4 SSD', tagline: 'Most popular', price: 6500 },
      { id: 'ssd-2tb-nvme', name: '2TB NVMe Gen4 SSD', tagline: 'Big library', price: 13000 },
    ],
  },
  {
    key: 'extraStorage',
    label: 'Secondary Storage (optional)',
    icon: 'save',
    required: false,
    options: [
      { id: 'hdd-1tb', name: '1TB HDD 7200RPM', tagline: 'Bulk storage', price: 3000 },
      { id: 'hdd-2tb', name: '2TB HDD 7200RPM', tagline: 'Bulk storage', price: 4800 },
      { id: 'ssd-1tb-2nd', name: '1TB SATA SSD', tagline: 'Game library', price: 5000 },
    ],
  },
  {
    key: 'gpu',
    label: 'Graphics Card (GPU)',
    icon: 'view_in_ar',
    required: true,
    options: [
      { id: 'gpu-1650', name: 'GTX 1650 4GB', tagline: 'Entry 1080p', price: 13000 },
      { id: 'gpu-1660s', name: 'GTX 1660 Super 6GB', tagline: '1080p High', price: 18000 },
      { id: 'gpu-3060', name: 'RTX 3060 12GB', tagline: '1080p / 1440p RT', price: 27000 },
      { id: 'gpu-4060', name: 'RTX 4060 8GB', tagline: 'DLSS 3 · 1080p Ultra', price: 30000 },
      { id: 'gpu-4060ti', name: 'RTX 4060 Ti 16GB', tagline: '1440p sweet spot', price: 42000 },
      { id: 'gpu-4070', name: 'RTX 4070 12GB', tagline: '1440p Ultra', price: 52000 },
      { id: 'gpu-4070ti', name: 'RTX 4070 Ti Super 16GB', tagline: '4K capable', price: 75000 },
      { id: 'gpu-4080s', name: 'RTX 4080 Super 16GB', tagline: '4K Ultra', price: 95000 },
      { id: 'gpu-4090', name: 'RTX 4090 24GB', tagline: '4K maxed', price: 180000 },
    ],
  },
  {
    key: 'psu',
    label: 'Power Supply (PSU)',
    icon: 'bolt',
    required: true,
    options: [
      { id: 'psu-550b', name: '550W 80+ Bronze', tagline: 'Entry rigs', price: 3500 },
      { id: 'psu-650b', name: '650W 80+ Bronze', tagline: 'Most builds', price: 4800 },
      { id: 'psu-750g', name: '750W 80+ Gold', tagline: 'RTX 4070 ready', price: 7500 },
      { id: 'psu-850g', name: '850W 80+ Gold', tagline: 'RTX 4080 ready', price: 10500 },
      { id: 'psu-1000g', name: '1000W 80+ Gold', tagline: 'RTX 4090 ready', price: 15000 },
    ],
  },
  {
    key: 'cooler',
    label: 'CPU Cooler',
    icon: 'ac_unit',
    required: true,
    options: [
      { id: 'cool-stock', name: 'Stock Air Cooler', tagline: 'Included with CPU', price: 0 },
      { id: 'cool-tower', name: 'Tower Air Cooler', tagline: 'Quiet · effective', price: 2500 },
      { id: 'cool-aio-240', name: '240mm AIO Liquid Cooler', tagline: 'RGB · enthusiast', price: 6500 },
      { id: 'cool-aio-360', name: '360mm AIO Liquid Cooler', tagline: 'Top tier · K-series', price: 11000 },
    ],
  },
  {
    key: 'case',
    label: 'Cabinet / Case',
    icon: 'inventory_2',
    required: true,
    options: [
      { id: 'case-basic', name: 'Basic Mid Tower', tagline: 'Solid build · 3 fans', price: 2800 },
      { id: 'case-rgb', name: 'RGB Mid Tower Tempered Glass', tagline: '4 RGB fans · ARGB', price: 5500 },
      { id: 'case-premium', name: 'Premium Airflow Tower', tagline: 'Mesh front · 6 fans', price: 9000 },
      { id: 'case-itx', name: 'Mini-ITX Compact', tagline: 'SFF build', price: 7500 },
    ],
  },
  {
    key: 'fans',
    label: 'Extra Case Fans (optional)',
    icon: 'mode_fan',
    required: false,
    options: [
      { id: 'fans-3rgb', name: '3-pack ARGB Fans', tagline: 'Add airflow + RGB', price: 1800 },
      { id: 'fans-6rgb', name: '6-pack ARGB Fans + Hub', tagline: 'Full RGB build', price: 3500 },
    ],
  },
  {
    key: 'os',
    label: 'Operating System',
    icon: 'desktop_windows',
    required: true,
    options: [
      { id: 'os-win11-home', name: 'Windows 11 Home', tagline: 'Activated retail key', price: 8500 },
      { id: 'os-win11-pro', name: 'Windows 11 Pro', tagline: 'BitLocker · Remote Desktop', price: 11500 },
      { id: 'os-skip', name: 'No OS (I have my own)', tagline: 'Skip Windows', price: 0 },
    ],
  },
  {
    key: 'wifi',
    label: 'Wi-Fi (optional)',
    icon: 'wifi',
    required: false,
    options: [
      { id: 'wifi-card', name: 'Wi-Fi 6 PCIe Card + Bluetooth', tagline: '2.4Gbps · BT 5.2', price: 2200 },
    ],
  },
  {
    key: 'monitor',
    label: 'Monitor (optional)',
    icon: 'desktop_windows',
    required: false,
    options: [
      { id: 'mon-24-144', name: '24" 144Hz Full HD', tagline: 'Esports favourite', price: 12000 },
      { id: 'mon-27-165', name: '27" 165Hz QHD', tagline: '1440p · HDR400', price: 22000 },
      { id: 'mon-27-4k', name: '27" 4K 144Hz IPS', tagline: 'Content + AAA gaming', price: 38000 },
      { id: 'mon-32-uw', name: '34" Ultrawide 165Hz', tagline: 'Immersive 21:9', price: 45000 },
    ],
  },
  {
    key: 'peripherals',
    label: 'Peripherals (optional, multi-select)',
    icon: 'keyboard',
    required: false,
    multi: true,
    options: [
      { id: 'kbm-combo', name: 'RGB Keyboard + Mouse Combo', tagline: 'Membrane combo', price: 2500 },
      { id: 'kb-mech', name: 'Mechanical Keyboard', tagline: 'Hot-swap · backlit', price: 4500 },
      { id: 'mouse-gaming', name: 'Gaming Mouse', tagline: '16000 DPI', price: 2200 },
      { id: 'headset-wired', name: 'Wired Gaming Headset', tagline: '7.1 surround', price: 2500 },
      { id: 'headset-wireless', name: 'Wireless Gaming Headset', tagline: 'Low latency', price: 6500 },
      { id: 'webcam-hd', name: '1080p Webcam', tagline: 'Streaming ready', price: 2500 },
      { id: 'webcam-4k', name: '4K Webcam', tagline: 'Auto-focus', price: 6000 },
      { id: 'mic-usb', name: 'USB Condenser Mic', tagline: 'Cardioid', price: 3500 },
      { id: 'speakers-21', name: '2.1 Speaker System', tagline: 'Punchy bass', price: 4000 },
    ],
  },
]

export const PC_BUILD_FEE = 1500 // Assembly + cable management + OS install
