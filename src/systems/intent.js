// Turn free text into a structured brief.
//
// Deterministic on purpose: it costs nothing, answers instantly, works offline
// and cannot be rate-limited. An LLM can be layered on top later for genuinely
// open-ended input (see parseIntent's `enrich` hook) but it must only ever
// produce THIS shape — part selection and pricing stay with the engine, so a
// model can never invent a GPU you don't stock or a price that isn't real.

const WORKLOAD_SIGNALS = {
  ai: [
    'ai', 'a.i', 'ml', 'machine learning', 'deep learning', 'llm', 'llama', 'mistral',
    'gpt', 'neural', 'pytorch', 'tensorflow', 'cuda', 'inference', 'fine-tune', 'finetune',
    'fine tune', 'training', 'train model', 'stable diffusion', 'computer vision',
    'data science', 'ollama', 'rag', 'transformer',
    // "lab" alone is ambiguous — a school computer lab is not an AI lab — so it
    // only counts as a signal when qualified.
    'ai lab', 'ml lab', 'research lab', 'ai/ml',
  ],
  creator: [
    'video editing', 'video edit', 'editing', 'premiere', 'davinci', 'after effects',
    'render', 'rendering', 'blender', '3d', 'animation', 'photoshop', 'lightroom',
    'colour grading', 'color grading', 'content creation', 'youtube', 'vfx', 'motion graphics',
  ],
  gaming: [
    'gaming', 'game', 'games', 'fps', 'valorant', 'cyberpunk', 'gta', 'cod', 'warzone',
    'esports', 'bgmi', 'fortnite', 'streaming', '144hz', '165hz', '240hz', 'ray tracing',
  ],
  dev: [
    'software development', 'software developer', 'development', 'developer', 'coding',
    'programming', 'programmer', 'docker', 'kubernetes', 'containers', 'virtual machine',
    'vm', 'android studio', 'xcode', 'visual studio', 'intellij', 'compile', 'compiling',
    'full stack', 'full-stack', 'backend', 'frontend', 'web development', 'devops',
    'ide', 'repositories', 'git',
  ],
  cad: [
    'cad', 'solidworks', 'autocad', 'revit', 'fusion 360', 'inventor', 'catia', 'creo',
    'siemens nx', 'ansys', 'simulation', 'assemblies', 'engineering drawing', 'architect',
    'architecture', 'bim', 'staad', 'etabs', 'mechanical design', 'product design',
  ],
  office: [
    'office', 'study', 'student', 'school', 'browsing', 'excel', 'word', 'basic',
    'typing', 'billing', 'accounting', 'clerical', 'everyday',
    'computer lab', 'computer laboratory',
    // A training centre trains people, not models. Without these the word
    // "training" alone reads as an AI brief and quotes a school a rack of
    // GPUs when it wanted twenty office laptops.
    'training centre', 'training center', 'training institute', 'coaching',
    'tuition', 'staff', 'employees', 'back office',
    'business', 'business laptop', 'professional', 'consultant', 'meetings',
    'presentations', 'reports', 'client work', 'admin work',
  ],
}

// Model size -> VRAM needed to run it at Q4, used when someone says "70B".
const MODEL_VRAM = [
  { params: 70, vram: 48 },
  { params: 32, vram: 24 },
  { params: 30, vram: 24 },
  { params: 14, vram: 16 },
  { params: 13, vram: 12 },
  { params: 8,  vram: 8 },
  { params: 7,  vram: 8 },
]

// Laptop or desktop. This is not a nuance of the brief — it is a different
// product with different physics, so it is parsed as a top-level fact rather
// than inferred from the workload. "Portable" is the tell; so is naming a
// laptop brand line.
const FORM_SIGNALS = {
  laptop: [
    'laptop', 'notebook', 'macbook', 'thinkpad', 'ideapad', 'ultrabook', 'chromebook',
    'portable', 'portability', 'carry', 'carry it', 'travel', 'travelling', 'commute',
    'on the go', 'take it with me', 'take it to college', 'take to college', 'hostel',
    'campus', 'in my bag', 'lightweight', 'light weight', 'battery life',
  ],
  desktop: [
    'desktop', 'tower', 'cabinet', 'rig', 'workstation', 'build a pc', 'assemble',
    'assembled pc', 'custom pc', 'full tower', 'mid tower', 'my desk setup',
  ],
}

// How often it actually moves. On a laptop this decides the machine as much as
// the budget does, because weight and sustained performance trade directly.
const PORTABILITY_SIGNALS = {
  carry_daily: [
    'every day', 'everyday', 'daily', 'college', 'campus', 'class', 'classes',
    'commute', 'travel', 'lightweight', 'light weight', 'thin', 'in my bag',
    'carry it everywhere', 'on the go',
  ],
  stays_home: [
    'stays on my desk', 'stays at home', 'mostly at home', 'rarely move',
    'rarely carry', 'desk', 'wont move', "won't move", 'desktop replacement',
    'space', 'no space', 'small room',
  ],
}

// Signal matching, shared by every parser below.
//
// The obvious `text.includes(signal)` is wrong in a way that is easy to miss
// and hard to spot in testing: "coding" contains "cod" (Call of Duty), "aim"
// and "air" contain "ai", "gamer" contains "game". The first cost us a real
// misread — "coding laptop" came back as a GAMING brief — so matching is by
// whole word, with a trailing "s" allowed so "games" still finds "game".
function normalise(text) {
  return ` ${String(text || '')
    .toLowerCase()
    // Punctuation becomes a gap. The marks kept inside words are the ones the
    // signal lists actually use: a.i, ai/ml, fine-tune, full-stack, won't.
    .replace(/[^a-z0-9.+/'-]+/g, ' ')
    .split(' ')
    .map((w) => w.replace(/^[.'-]+/, '').replace(/[.'-]+$/, ''))
    .filter(Boolean)
    .join(' ')} `
}

// Multi-word phrases are stronger evidence than a single word, so they score
// higher — "machine learning" means it, "ml" might be a typo.
function countHits(padded, signals) {
  let score = 0
  for (const sig of signals) {
    if (padded.includes(` ${sig} `) || padded.includes(` ${sig}s `)) {
      score += sig.includes(' ') ? 3 : 1
    }
  }
  return score
}

export function parseFormFactor(text) {
  const t = ` ${String(text || '').toLowerCase()} `
  const hit = (sigs) => sigs.reduce((n, s) => (t.includes(` ${s} `) || t.includes(`${s} `) || t.includes(` ${s}`) ? n + (s.includes(' ') ? 3 : 1) : n), 0)
  const laptop = hit(FORM_SIGNALS.laptop)
  const desktop = hit(FORM_SIGNALS.desktop)
  if (laptop > desktop) return 'laptop'
  if (desktop > laptop) return 'desktop'
  return null
}

export function parsePortability(text) {
  const t = normalise(text)
  const daily = countHits(t, PORTABILITY_SIGNALS.carry_daily)
  const home  = countHits(t, PORTABILITY_SIGNALS.stays_home)
  if (daily > home && daily > 0) return 'carry_daily'
  if (home > daily && home > 0) return 'stays_home'
  return null
}

// Nobody shops by manufacturer name alone. They say "thinkpad", "macbook",
// "omen", "rog" — a product line, not a company — so the line resolves to the
// company that makes it.
const BRAND_ALIASES = {
  Apple:     ['macbook', 'mac book'],
  Lenovo:    ['thinkpad', 'ideapad', 'legion', 'loq', 'yoga', 'thinkbook'],
  ASUS:      ['rog', 'tuf', 'zenbook', 'vivobook', 'zephyrus', 'proart', 'strix'],
  HP:        ['omen', 'victus', 'pavilion', 'zbook', 'envy', 'elitebook', 'probook', 'spectre'],
  Dell:      ['inspiron', 'xps', 'latitude', 'precision', 'alienware'],
  Acer:      ['predator', 'nitro', 'swift', 'aspire', 'helios', 'travelmate'],
  MSI:       ['katana', 'stealth', 'raider', 'cyborg', 'prestige', 'titan'],
  Gigabyte:  ['aorus'],
  Samsung:   ['galaxy book', 'galaxybook'],
  Infinix:   ['inbook', 'zerobook'],
  Microsoft: ['surface'],
}

// Brands people ask for that we may not carry. Recognising them is the whole
// point: without this list "razer laptop 2 lakh" parses as no brand at all and
// the customer is quietly handed a Lenovo. With it they are told we do not list
// Razer, shown what we do list, and offered a sourcing conversation.
const OTHER_LAPTOP_BRANDS = [
  'Razer', 'Microsoft', 'LG', 'Honor', 'Xiaomi', 'Redmi', 'Realme', 'VAIO',
  'Huawei', 'Toshiba', 'Fujitsu', 'Chuwi', 'Ultimus', 'Primebook', 'Zebronics',
  'Tecno', 'AVITA', 'Wings', 'Colorful', 'Thomson', 'Walker',
]

/**
 * Brand from free text.
 *
 * `brands` is whatever is actually in the catalogue, so a brand the owner adds
 * through the admin screen becomes searchable immediately with no code change.
 * A recognised brand we do NOT stock still comes back — that is an answerable
 * situation, not a miss, and the matcher turns it into a straight answer.
 * Longest match wins, so "galaxy book" beats a stray "book".
 */
export function parseBrand(text, brands = []) {
  const t = ` ${String(text || '').toLowerCase().replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ')} `
  const hit = (needle) => t.includes(` ${needle} `)

  let best = null
  const consider = (brand, matched) => {
    if (!best || matched.length > best.len) best = { brand, len: matched.length }
  }

  // 1. the brand's own name, as the catalogue spells it
  for (const brand of brands) {
    const n = String(brand || '').toLowerCase().trim()
    if (n && hit(n)) consider(brand, n)
  }
  // 2. a product line standing in for its maker
  for (const [brand, aliases] of Object.entries(BRAND_ALIASES)) {
    for (const a of aliases) if (hit(a)) consider(brand, a)
  }
  // 3. a brand we recognise but may not stock
  for (const brand of OTHER_LAPTOP_BRANDS) {
    const n = brand.toLowerCase()
    if (hit(n)) consider(brand, n)
  }

  return best ? best.brand : null
}

export function parseBudget(text) {
  const t = String(text || '').toLowerCase().replace(/,/g, '')

  const crore = t.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr)\b/)
  if (crore) return Math.round(parseFloat(crore[1]) * 10000000)

  const lakh = t.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|l)\b/)
  if (lakh) return Math.round(parseFloat(lakh[1]) * 100000)

  // "80k" — but not "80kg" and not a model size like "70b"
  const k = t.match(/(\d+(?:\.\d+)?)\s*k\b(?!g)/)
  if (k) return Math.round(parseFloat(k[1]) * 1000)

  // A bare number, but only if it is big enough to plausibly be rupees and is
  // not immediately a model size, resolution or capacity.
  const plain = t.match(/(?:₹|rs\.?|budget|under|around|about|upto|up to|within)\s*(\d{4,8})\b(?!\s*(?:b|gb|tb|hz|p)\b)/)
  if (plain) return parseInt(plain[1], 10)

  const loose = t.match(/\b(\d{5,8})\b(?!\s*(?:b|gb|tb|hz|p)\b)/)
  if (loose) return parseInt(loose[1], 10)

  return null
}

export function parseSeats(text) {
  const t = String(text || '').toLowerCase()
  const m =
    t.match(/(\d{1,3})\s*(?:seats?|systems?|computers?|pcs?|machines?|workstations?|laptops?|notebooks?|units?|devices?|students?|users?|kids|children)/) ||
    t.match(/(?:lab|classroom|setup)\s*(?:of|for|with)\s*(\d{1,3})/) ||
    t.match(/(?:for)\s+(\d{1,3})\s+(?:students?|people|users?)/)
  if (!m) return 1
  const n = parseInt(m[1], 10)
  return n > 0 && n <= 500 ? n : 1
}

export function parseVramHint(text) {
  const t = String(text || '').toLowerCase()
  // explicit VRAM
  const vram = t.match(/(\d{1,3})\s*gb\s*(?:of\s*)?vram/) || t.match(/vram\s*(?:of\s*)?(\d{1,3})\s*gb/)
  if (vram) return parseInt(vram[1], 10)
  // model size, e.g. "llama 70b", "run a 13b model"
  const model = t.match(/\b(\d{1,3})\s*b\b/)
  if (model) {
    const p = parseInt(model[1], 10)
    const tier = MODEL_VRAM.find((m) => p >= m.params)
    if (tier) return tier.vram
  }
  return null
}

export function parseWorkload(text) {
  const t = normalise(text)
  const scores = {}
  for (const [id, signals] of Object.entries(WORKLOAD_SIGNALS)) {
    const s = countHits(t, signals)
    if (s) scores[id] = s
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1])
  if (!ranked.length) return { workloadId: null, confidence: 0, scores }
  const [id, top] = ranked[0]
  const second = ranked[1]?.[1] || 0
  // confident when the winner clearly beats the runner-up
  const confidence = Math.min(1, (top - second + 1) / 4)
  return { workloadId: id, confidence, scores }
}

/**
 * Parse a free-text brief.
 * `enrich` is an optional async (text) => partial brief — the seam where an LLM
 * plugs in. It may only fill gaps; anything the deterministic pass found with
 * confidence wins, so a model can never override an explicit budget or seat count.
 */
export async function parseIntent(text, { enrich } = {}) {
  const budget = parseBudget(text)
  const seats = parseSeats(text)
  const vramHint = parseVramHint(text)
  const formFactor = parseFormFactor(text)
  const portability = parsePortability(text)
  const { workloadId, confidence, scores } = parseWorkload(text)

  // "AI lab for 30 students, 10 lakh" means ten lakh for the lab, not per desk.
  // Reading it per-seat multiplies the quote by the seat count.
  const budgetIsTotal = seats > 1 && budget !== null

  // Nobody quotes a model size or a VRAM figure for office work. "Run 30B
  // models locally" contains none of the AI keywords and would otherwise come
  // back as not understood, which is a worse answer than the obvious one.
  const inferred = workloadId || (vramHint ? 'ai' : null)

  let brief = {
    text, workloadId: inferred, budget, seats, vramHint, formFactor, portability,
    confidence: inferred && !workloadId ? 0.6 : confidence,
    budgetIsTotal, source: 'rules',
  }

  const needsHelp = !workloadId || confidence < 0.5 || !budget
  if (needsHelp && typeof enrich === 'function') {
    try {
      const extra = await enrich(text)
      if (extra && typeof extra === 'object') {
        brief = {
          ...brief,
          workloadId: inferred || extra.workloadId || null,
          budget: budget ?? (Number.isFinite(extra.budget) ? extra.budget : null),
          seats: seats > 1 ? seats : (Number.isFinite(extra.seats) ? extra.seats : seats),
          vramHint: vramHint ?? (Number.isFinite(extra.vramHint) ? extra.vramHint : null),
          formFactor: formFactor || (extra.formFactor === 'laptop' || extra.formFactor === 'desktop' ? extra.formFactor : null),
          source: 'rules+ai',
        }
      }
    } catch {
      // An enrichment failure must never break the builder — the rules result stands.
    }
  }

  return { ...brief, scores, understood: !!brief.workloadId }
}
