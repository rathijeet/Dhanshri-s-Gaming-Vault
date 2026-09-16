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
  office: [
    'office', 'study', 'student', 'school', 'browsing', 'excel', 'word', 'basic',
    'typing', 'billing', 'accounting', 'clerical', 'everyday',
    'computer lab', 'computer laboratory',
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
    t.match(/(\d{1,3})\s*(?:seats?|systems?|computers?|pcs?|machines?|workstations?|students?|users?|kids|children)/) ||
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
  const t = ` ${String(text || '').toLowerCase()} `
  const scores = {}
  for (const [id, signals] of Object.entries(WORKLOAD_SIGNALS)) {
    let s = 0
    for (const sig of signals) {
      if (t.includes(` ${sig} `) || t.includes(`${sig} `) || t.includes(` ${sig}`)) {
        // longer phrases are stronger evidence than single words
        s += sig.includes(' ') ? 3 : 1
      }
    }
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
  const { workloadId, confidence, scores } = parseWorkload(text)

  // "AI lab for 30 students, 10 lakh" means ten lakh for the lab, not per desk.
  // Reading it per-seat multiplies the quote by the seat count.
  const budgetIsTotal = seats > 1 && budget !== null

  let brief = { text, workloadId, budget, seats, vramHint, confidence, budgetIsTotal, source: 'rules' }

  const needsHelp = !workloadId || confidence < 0.5 || !budget
  if (needsHelp && typeof enrich === 'function') {
    try {
      const extra = await enrich(text)
      if (extra && typeof extra === 'object') {
        brief = {
          ...brief,
          workloadId: workloadId || extra.workloadId || null,
          budget: budget ?? (Number.isFinite(extra.budget) ? extra.budget : null),
          seats: seats > 1 ? seats : (Number.isFinite(extra.seats) ? extra.seats : seats),
          vramHint: vramHint ?? (Number.isFinite(extra.vramHint) ? extra.vramHint : null),
          source: 'rules+ai',
        }
      }
    } catch {
      // An enrichment failure must never break the builder — the rules result stands.
    }
  }

  return { ...brief, scores, understood: !!brief.workloadId }
}
