// Laptops are MATCHED, never built.
//
// This file is deliberately not a port of engine.js, because a laptop is not a
// desktop with a lid. You cannot choose its cooler, resize its power supply or
// upgrade its graphics card in three years. Every assumption the desktop engine
// is built on — that the build is assembled part by part, that a bottleneck can
// be fixed by swapping a component, that spare budget buys an upgrade — is
// false here. There is exactly one decision: which finished machine do you buy.
//
// So the job of this module is not to assemble. It is to RANK finished machines
// against a brief, and then to tell the customer the truths that the spec sheet
// on a retail page hides:
//
//   1. TGP. The chassis decides how many watts the GPU may draw. Two laptops
//      both printing "RTX 5070" on the box can be ~40% apart. Nobody in Indian
//      retail shows this number. It is the single most useful thing we can say.
//   2. The VRAM ceiling is hard and low. The largest laptop GPU tops out at
//      24GB, against 96GB on a desktop card. "Run Llama 70B locally" is not a
//      laptop question, and pretending otherwise sells someone the wrong
//      machine.
//   3. Sustained load is not peak load. A laptop throttles over a long run; a
//      tower does not. Training for six hours is a desktop job.
//   4. Soldered memory is permanent. The RAM you buy is the RAM you have in
//      2030.
//   5. Unplugged is not plugged in. Nothing here performs on battery.
//
// None of this exists in engine.js because none of it is true of a desktop.

export const LAPTOP_TYPE = 'laptop'

// Laptop street prices are quoted GST-inclusive — that is the number the
// customer has in their head. The catalogue stores ex-GST like every other row
// so quotation lines add up, so the conversion lives here and only here.
export const LAPTOP_GST_MULTIPLIER = 1.18

// A little over budget is a conversation, not a rejection: nobody walks away
// from the right machine over 6%. Anything past this is a different machine.
const STRETCH = 1.10

// ---------------------------------------------------------------------------
// Chassis
// ---------------------------------------------------------------------------
// Weight is the honest axis on a laptop, and it trades directly against
// sustained performance. These classes exist so the trade is stated rather
// than discovered after purchase.
export const CHASSIS_CLASSES = {
  thin:                { label: 'Thin & light',       carry: 'Goes in a bag every day without thinking about it.' },
  balanced:            { label: 'Balanced',           carry: 'Comfortable to carry a few times a week.' },
  performance:         { label: 'Performance',        carry: 'Heavy, with a large charger. You will feel it in a bag.' },
  desktop_replacement: { label: 'Desktop replacement', carry: 'A machine you move between rooms, not one you commute with.' },
}

export const PORTABILITY = [
  {
    id: 'carry_daily',
    label: 'Every day',
    icon: 'backpack',
    detail: 'College, office, travel — it lives in a bag.',
    // Above this the machine stops being something you actually carry.
    idealKg: 1.7,
    perKg: 20,
    wantsBattery: 65,
  },
  {
    id: 'balanced',
    label: 'A few times a week',
    icon: 'directions_walk',
    detail: 'Home to work and back, not every day.',
    idealKg: 2.3,
    perKg: 12,
    wantsBattery: 0,
  },
  {
    id: 'stays_home',
    label: 'Rarely',
    icon: 'table_restaurant',
    detail: 'It lives on a desk; you just need it to not be a tower.',
    idealKg: 99,
    perKg: 0,
    wantsBattery: 0,
  },
]
export const PORTABILITY_BY_ID = Object.fromEntries(PORTABILITY.map((p) => [p.id, p]))

// ---------------------------------------------------------------------------
// TGP — the decisive field
// ---------------------------------------------------------------------------
// NVIDIA publishes a WATTAGE RANGE per laptop GPU, and every manufacturer picks
// a point on it. The card's name tells you nothing about which point. These are
// the published ranges (base minimum to maximum including Dynamic Boost), used
// to say "this is the 65W version of a card that goes to 115W".
const GPU_TGP_RANGE = [
  { match: /5090/, min: 95, max: 175 },
  { match: /5080/, min: 80, max: 175 },
  { match: /5070\s*ti/, min: 60, max: 140 },
  { match: /5070/, min: 50, max: 115 },
  { match: /5060/, min: 45, max: 115 },
  { match: /5050/, min: 35, max: 115 },
  { match: /4090/, min: 80, max: 175 },
  { match: /4080/, min: 60, max: 175 },
  { match: /4070/, min: 35, max: 115 },
  { match: /4060/, min: 35, max: 115 },
  { match: /4050/, min: 35, max: 115 },
]

function tgpRange(gpuModel) {
  const m = String(gpuModel || '').toLowerCase()
  if (!m) return null
  // Ordered longest-first above so "5070 Ti" is tested before "5070".
  return GPU_TGP_RANGE.find((r) => r.match.test(m)) || null
}

/**
 * What the chassis does to the card.
 *
 * Returns null when the machine has no discrete GPU with a published range —
 * integrated graphics and Apple Silicon have no TGP dial to report, and
 * inventing a verdict for them would be noise.
 */
export function tgpVerdict(laptop) {
  const tgp = Number(laptop?.gpu_tgp_watts) || 0
  if (!tgp) return null
  const range = tgpRange(laptop.gpu_model)
  if (!range) {
    return { tgp, band: 'unknown', headline: `${tgp}W`, text: `The chassis runs this card at ${tgp}W.` }
  }

  const span = Math.max(1, range.max - range.min)
  const pct = Math.min(1, Math.max(0, (tgp - range.min) / span))

  // Real-world spread between the bottom and top of a card's wattage range is
  // roughly 30-40%. Expressing the gap in those terms is more useful to a buyer
  // than a percentage of a number they have never seen.
  const behind = Math.round((1 - (0.72 + 0.28 * pct)) * 100)

  if (pct >= 0.92) {
    return {
      tgp, pct, band: 'full',
      headline: `${tgp}W — full power`,
      text: `This chassis runs the card at its full ${range.max}W rating. The same GPU in a thinner laptop runs at ${range.min}W and is around 30% slower.`,
    }
  }
  if (pct >= 0.6) {
    return {
      tgp, pct, band: 'strong',
      headline: `${tgp}W of ${range.max}W`,
      text: `Close to the top of this card's ${range.min}–${range.max}W range — roughly ${behind}% behind an identically named laptop running it flat out, in exchange for a thinner body.`,
    }
  }
  if (pct >= 0.3) {
    return {
      tgp, pct, band: 'reduced',
      headline: `${tgp}W of ${range.max}W`,
      text: `The card is capped well below its ${range.max}W rating — about ${behind}% behind the same GPU in a thicker laptop. That is what buys the smaller chassis and the quieter fans.`,
    }
  }
  return {
    tgp, pct, band: 'limited',
    headline: `${tgp}W of ${range.max}W`,
    text: `This is near the bottom of the card's ${range.min}–${range.max}W range — roughly ${behind}% behind the same GPU at full power. Buy it for the size and the battery, not for the sticker on the box.`,
  }
}

/**
 * Laptops in the catalogue carrying the SAME GPU name at a different wattage.
 *
 * This is the comparison a retail page will never show you, and it is the one
 * that decides the purchase. Shown next to any candidate that has a peer.
 */
export function tgpPeers(laptop, catalogue) {
  const model = String(laptop?.gpu_model || '').toLowerCase()
  const tgp = Number(laptop?.gpu_tgp_watts) || 0
  if (!model || !tgp) return []
  return catalogue
    .filter((c) =>
      isLaptop(c) &&
      c.id !== laptop.id &&
      String(c.gpu_model || '').toLowerCase() === model &&
      Number(c.gpu_tgp_watts) &&
      Number(c.gpu_tgp_watts) !== tgp
    )
    .sort((a, b) => Number(b.gpu_tgp_watts) - Number(a.gpu_tgp_watts))
}

// Rough performance gap between two wattages of the same card, for the peer
// comparison. Deliberately stated as "about X%" everywhere it surfaces.
export function tgpGapPct(a, b) {
  const ra = tgpRange(a.gpu_model)
  if (!ra) return null
  const span = Math.max(1, ra.max - ra.min)
  const f = (l) => 0.72 + 0.28 * Math.min(1, Math.max(0, (Number(l.gpu_tgp_watts) - ra.min) / span))
  const fa = f(a), fb = f(b)
  if (!fa || !fb) return null
  return Math.round(Math.abs(fa - fb) / Math.max(fa, fb) * 100)
}

// ---------------------------------------------------------------------------
// Compute platform — whether the AI toolchain runs at all
// ---------------------------------------------------------------------------
// On a desktop this is a one-line rule (profiles.js refuses AMD for AI). On a
// laptop it needs a real answer, because Apple Silicon is a genuinely good
// local-AI machine for some people and a completely wrong one for others, and
// which it is depends on facts about the buyer we can simply ask.
export function platformNote(laptop, workloadId) {
  const platform = laptop?.compute_platform

  // Creative work is not one thing. Apple Silicon is excellent at video and
  // photo and genuinely poor at GPU 3D rendering, because Cycles, Octane,
  // Redshift and the rest were built for CUDA. Four workload buckets cannot
  // express that, so it is said in words instead of buried in a score.
  if (workloadId === 'creator' && platform === 'metal') {
    return {
      tone: 'caution',
      headline: 'Excellent for editing, wrong for 3D',
      text: 'Final Cut, Premiere, DaVinci Resolve, Photoshop and Lightroom are all first class on Apple Silicon, and the battery life while doing it is unmatched. GPU 3D rendering is the exception: Blender Cycles, Octane and Redshift are built around CUDA and OptiX, and run substantially slower on Metal. If Blender or 3D rendering is the main job rather than a sideline, take an NVIDIA machine.',
    }
  }
  // The decisive fact for a CAD buyer, and one no score can carry: the
  // industry-standard packages are Windows-only. Ranking a MacBook highly and
  // staying quiet about it would sell someone a machine that cannot open their
  // files.
  if (workloadId === 'cad' && platform === 'metal') {
    return {
      tone: 'caution',
      headline: 'SolidWorks and Revit do not run on macOS',
      text: 'Fusion 360 and AutoCAD have Mac versions. SolidWorks, Revit, Inventor, Creo, CATIA and Siemens NX do not, and no translation layer changes that — they need Windows. If your work is in any of those, this is the wrong machine however fast it is.',
    }
  }
  if (workloadId === 'cad' && platform === 'integrated') {
    return {
      tone: 'caution',
      headline: 'No dedicated graphics',
      text: 'Fine for 2D drafting and small parts. Large assemblies and rendered views will crawl, and no CAD vendor certifies integrated graphics.',
    }
  }

  if (workloadId === 'gaming' && platform === 'metal') {
    return {
      tone: 'caution',
      headline: 'Most PC games do not run on macOS',
      text: 'A handful of titles are native and the rest need translation layers that do not always work. If gaming is the reason for the purchase, this is the wrong machine.',
    }
  }

  if (workloadId !== 'ai') return null

  if (platform === 'cuda') return null   // the assumed default; no note needed

  // A large unified pool is a different machine from a small integrated one,
  // and calling both "no CUDA" would bury the only reason to buy the former.
  if (isUnifiedMemory(laptop) && (Number(laptop.vram_gb) || 0) >= 40) {
    const apple = platform === 'metal'
    return {
      tone: 'caution',
      headline: 'Huge models, no CUDA',
      text: `${laptop.vram_gb}GB is reachable by the GPU here — against 24GB on the largest NVIDIA laptop card that exists. Models nothing else portable can load will simply run. The costs are real and worth stating: ${apple
        ? 'Apple Silicon has the fastest memory of any laptop, so tokens arrive quickly, but'
        : 'memory bandwidth is roughly half a top-end NVIDIA laptop, so tokens arrive slower and long prompts take longer to process, and'} the CUDA ecosystem is closed to it — much of the PyTorch training stack, most college lab material and most vendor SDKs will not run. Buy this to RUN large models. Buy CUDA to TRAIN with the ecosystem.`,
    }
  }

  if (platform === 'metal') {
    return {
      tone: 'caution',
      headline: 'Apple Silicon — no CUDA',
      text: `Unified memory means ${laptop.vram_gb}GB is reachable by the GPU, so larger models fit than the number suggests. Ollama, LM Studio and llama.cpp run well. But anything written for CUDA — much of the PyTorch training ecosystem, most college lab material, most vendor SDKs — does not run at all. If your course, client or toolchain names CUDA, this is the wrong machine.`,
    }
  }
  if (platform === 'rocm') {
    return {
      tone: 'caution',
      headline: 'AMD graphics — limited AI tooling',
      text: 'ROCm support on a discrete AMD laptop GPU is patchy. Fine for using AI tools; a poor base for building with them.',
    }
  }
  return {
    tone: 'caution',
    headline: 'Integrated graphics only',
    text: 'No dedicated video memory, so local models cannot run at any useful speed. This machine is for using cloud AI — ChatGPT, Claude, Copilot, APIs — not for running models on it.',
  }
}

// ---------------------------------------------------------------------------
// What the machine actually runs
// ---------------------------------------------------------------------------
// The desktop VRAM tiers do not transfer unchanged: a laptop 5080 with 16GB is
// not a desktop 5080 with 16GB, because it is throttled to a chassis. The model
// SIZE that fits is the same (VRAM is VRAM), the SPEED is not, and the tiers
// below say both.
export function laptopCapability(laptop) {
  const vram = Number(laptop?.vram_gb) || 0
  const unified = isUnifiedMemory(laptop)
  const mem = unified ? `${vram}GB of unified memory` : `${vram}GB of video memory`

  if (!vram) {
    return {
      label: 'Cloud AI only',
      detail: 'No dedicated video memory — local models are not realistic on this machine. It runs cloud AI tools perfectly well.',
    }
  }
  if (vram < 8) {
    return {
      label: 'Below the useful floor',
      detail: `${mem} is under the 8GB floor where local models start being usable. Good for learning the tooling, not for running it.`,
    }
  }
  if (vram < 12) {
    return { label: '7B models', detail: `${mem} runs 7B models at Q4 — enough to learn on, demo with and build against. Fine-tuning is out of reach.` }
  }
  if (vram < 16) {
    return { label: '13B models', detail: `${mem} is comfortable with 13–14B models at Q4.` }
  }
  if (vram < 24) {
    return {
      label: '14B models, light fine-tuning',
      detail: `${mem} runs 14B comfortably and will take a small LoRA fine-tune — slowly, and with the fans at full tilt.`,
    }
  }
  if (vram < 40) {
    return {
      label: '30B models',
      detail: unified
        ? `${mem} runs 30B models at Q4, and holds a long context while doing it.`
        : `${mem} runs 30B models at Q4. This is the most a dedicated laptop graphics card offers — 24GB is the ceiling on NVIDIA's largest laptop part.`,
    }
  }
  // Only unified-memory machines reach this far: no laptop graphics card has
  // more than 24GB, so 40GB+ is always shared system memory.
  if (vram < 80) {
    return {
      label: '70B models',
      detail: `${mem} fits 70B models at Q4 — something no laptop graphics card can do at any price, because dedicated VRAM stops at 24GB.`,
    }
  }
  return {
    label: '70B comfortably, 120B-class at Q4',
    detail: `${mem} is more than most desktop graphics cards, and fits a 70B model with room for a long context — or a 120B-class model quantised. Capacity is not this machine's limit; speed per token is.`,
  }
}

// Apple Silicon and AMD's Strix Halo share one pool between CPU and GPU. It is
// the reason a 1.2kg tablet can load a model a ₹4.6 lakh gaming laptop cannot,
// and the reason it will not be as quick at it — so the two are never compared
// on VRAM alone.
export function isUnifiedMemory(laptop) {
  const p = laptop?.compute_platform
  return (p === 'metal' || p === 'rocm') && !Number(laptop?.gpu_tgp_watts)
}

// The single most important thing to say to someone buying a laptop for AI:
// it is a development machine, not a training machine.
export function sustainedNote(laptop, workloadId) {
  if (workloadId !== 'ai' && workloadId !== 'creator') return null
  const chassis = laptop?.chassis_class
  const thin = chassis === 'thin' || chassis === 'balanced'
  const job = workloadId === 'ai' ? 'a training run' : 'a long render'

  return {
    headline: 'Long jobs are a desktop job',
    text: thin
      ? `Every laptop throttles once the chassis is saturated, and a ${CHASSIS_CLASSES[chassis]?.label.toLowerCase() || 'thin'} one saturates fast. Expect ${job} to start quick and settle noticeably slower, with the machine hot, loud and hard to use while it works. Write and test here; run the long jobs on a desktop or rented GPU time.`
      : `Even at full power a laptop sheds heat through a chassis you can hold. ${job.charAt(0).toUpperCase() + job.slice(1)} lasting hours will throttle, run loud, and leave the machine unusable for anything else. That is not a fault of this model — it is what laptops are.`,
  }
}

// ---------------------------------------------------------------------------
// The things a laptop cannot give you, said out loud
// ---------------------------------------------------------------------------
export function tradeoffs(laptop, portabilityId) {
  const out = []
  const weight = Number(laptop?.weight_kg) || 0
  const pref = PORTABILITY_BY_ID[portabilityId]

  if (weight && pref && weight > pref.idealKg + 0.3) {
    out.push({
      icon: 'scale',
      text: `${weight}kg${laptop.chassis_class ? ` — ${CHASSIS_CLASSES[laptop.chassis_class]?.carry.toLowerCase()}` : ''} That is heavier than what you said you wanted to carry.`,
    })
  } else if (weight) {
    out.push({
      icon: 'scale',
      text: `${weight}kg${laptop.chassis_class ? ` — ${CHASSIS_CLASSES[laptop.chassis_class]?.carry.toLowerCase()}` : '.'}`,
    })
  }

  if (laptop?.ram_upgradable === false) {
    out.push({
      icon: 'lock',
      text: `Memory is soldered at ${laptop.ram_gb}GB and can never be increased. On a laptop this is permanent — decide now whether ${laptop.ram_gb}GB is still enough in four years.`,
    })
  } else if (laptop?.ram_upgradable && laptop?.max_ram_gb > (laptop?.ram_gb || 0)) {
    out.push({
      icon: 'add_circle',
      text: `Memory can be taken to ${laptop.max_ram_gb}GB later — one of the few things on a laptop you can still change after you buy it.`,
    })
  }

  // True of every laptop and worth saying once, because it is the difference
  // that matters most against the desktop the customer is choosing between.
  out.push({
    icon: 'build',
    text: 'The graphics card, screen and battery are fixed for the life of the machine. A laptop is replaced, not upgraded — buy for four years from now, not for today.',
  })

  if (Number(laptop?.gpu_tgp_watts)) {
    out.push({
      icon: 'battery_alert',
      text: 'On battery the GPU is cut back hard. Gaming, rendering and local models all need the charger plugged in.',
    })
  }

  const battery = Number(laptop?.battery_wh) || 0
  if (battery && battery < 60) {
    out.push({ icon: 'battery_3_bar', text: `${battery}Wh battery — short unplugged runtime for its class.` })
  }

  return out
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------
export function isLaptop(c) {
  return (
    c &&
    c.type === LAPTOP_TYPE &&
    c.status === 'active' &&
    c.availability !== 'discontinued' &&
    c.current_price !== null &&
    c.current_price !== undefined
  )
}

// The number the customer sees on a shelf.
export function streetPrice(laptop) {
  return Math.round((Number(laptop?.current_price) || 0) * LAPTOP_GST_MULTIPLIER)
}

// Highest VRAM any laptop in the catalogue can offer. Used to answer a request
// no laptop can meet with a fact rather than a shrug.
export function vramCeiling(catalogue) {
  return catalogue.filter(isLaptop).reduce((max, l) => Math.max(max, Number(l.vram_gb) || 0), 0)
}

function portabilityPenalty(laptop, pref) {
  if (!pref || !pref.perKg) return 0
  const weight = Number(laptop.weight_kg) || 0
  let p = Math.min(30, Math.max(0, (weight - pref.idealKg) * pref.perKg))
  const battery = Number(laptop.battery_wh) || 0
  if (pref.wantsBattery && battery && battery < pref.wantsBattery) p += 6
  return p
}

/**
 * Rank finished laptops against a brief.
 *
 * Unlike designSystem there is no budget to "spend up" — the machine costs what
 * it costs. Budget is a ceiling, the workload score is the ranking, portability
 * is a penalty against it, and value breaks ties.
 *
 * @param budget  total the customer will pay, GST INCLUSIVE (what a laptop
 *                buyer means by their number), or null for no ceiling
 * @param units   how many identical machines
 * @param requireCuda  set when the buyer's course, client or toolchain names
 *                     CUDA — it excludes Apple and AMD outright rather than
 *                     recommending them with a caveat
 */
export function matchLaptops({
  catalogue,
  workloadId,
  scoreKey,
  budget = null,
  minVram = null,
  brand = null,
  portability = 'balanced',
  units = 1,
  requireCuda = false,
}) {
  const all = catalogue.filter(isLaptop)
  if (!all.length) return { ok: false, reason: 'no_laptops' }

  const pref = PORTABILITY_BY_ID[portability] || PORTABILITY_BY_ID.balanced
  const perUnitBudget = budget && budget > 0 ? budget / Math.max(1, units) : null

  // ---- hard gate 0: a named brand.
  // Asking for "an HP" is a real constraint, not a preference to be scored
  // away — so it filters, and if it leaves nothing we say which brands would
  // have answered instead of silently showing a Lenovo.
  if (brand) {
    const branded = all.filter((l) => String(l.brand).toLowerCase() === String(brand).toLowerCase())
    if (!branded.length) {
      return {
        ok: false,
        reason: 'brand_unavailable',
        brand,
        brands: [...new Set(all.map((l) => l.brand))].sort(),
      }
    }
  }

  // ---- hard gate 1: the VRAM ceiling, which on a laptop is low and physical.
  let pool = brand
    ? all.filter((l) => String(l.brand).toLowerCase() === String(brand).toLowerCase())
    : all
  if (minVram) {
    const capable = pool.filter((l) => (Number(l.vram_gb) || 0) >= minVram)
    if (!capable.length) {
      const best = pool.reduce((a, b) => ((Number(b.vram_gb) || 0) > (Number(a.vram_gb) || 0) ? b : a))
      return {
        ok: false,
        reason: 'vram_ceiling',
        minVram,
        bestVram: Number(best.vram_gb) || 0,
        bestLaptop: best,
        ceiling: vramCeiling(all),
      }
    }
    pool = capable
  }

  // ---- hard gate 2: can it run a model at all.
  //
  // This deliberately tests CAPABILITY, not vendor. An earlier version filtered
  // to NVIDIA-or-Apple, which quietly threw away the Ryzen AI Max+ machines —
  // the cheapest laptops in existence that fit a 70B model, by a margin of a
  // lakh and a half. What disqualifies a laptop here is having no pool of
  // GPU-addressable memory, not whose logo is on it; the CUDA trade is then
  // stated in words on every non-NVIDIA pick rather than hidden as a filter.
  if (workloadId === 'ai') {
    const usable = pool.filter((l) =>
      requireCuda
        ? l.compute_platform === 'cuda'
        : (Number(l.vram_gb) || 0) > 0 && ['cuda', 'metal', 'rocm'].includes(l.compute_platform)
    )
    if (!usable.length) {
      return { ok: false, reason: 'no_ai_platform', requireCuda, pool }
    }
    pool = usable
  }

  // ---- budget.
  const priced = pool.map((l) => ({ laptop: l, street: streetPrice(l) }))
  const cheapest = priced.reduce((a, b) => (b.street < a.street ? b : a))

  let inBudget = priced
  let stretched = []
  if (perUnitBudget) {
    inBudget  = priced.filter((p) => p.street <= perUnitBudget)
    stretched = priced.filter((p) => p.street > perUnitBudget && p.street <= perUnitBudget * STRETCH)
    if (!inBudget.length && !stretched.length) {
      // Not a refusal. The cheapest machine that does the job is a real answer,
      // and so is the size of the gap.
      // When a VRAM floor is what pushed the price up, the useful thing to
      // offer is the next model size down — not a cheaper graphics card.
      const withoutVram = minVram
        ? all
            .filter((l) => (workloadId !== 'ai' || (Number(l.vram_gb) || 0) > 0))
            .map((l) => ({ laptop: l, street: streetPrice(l) }))
            .filter((p) => p.street <= perUnitBudget)
            .sort((a, b) => (Number(b.laptop.vram_gb) || 0) - (Number(a.laptop.vram_gb) || 0))[0]
        : null

      // If a brand was asked for, the useful extra fact is what the same money
      // buys from anyone — refusing on brand alone helps nobody.
      const anyBrand = brand
        ? all.map((l) => ({ laptop: l, street: streetPrice(l) }))
             .filter((p) => p.street <= perUnitBudget)
             .sort((a, b) => b.street - a.street)[0]
        : null

      return {
        ok: false,
        reason: 'over_budget',
        budget,
        units,
        perUnitBudget,
        minVram,
        brand,
        cheapestAnyBrand: anyBrand ? anyBrand.laptop : null,
        cheapestAnyBrandStreet: anyBrand ? anyBrand.street : null,
        cheapest: cheapest.laptop,
        cheapestStreet: cheapest.street,
        gap: cheapest.street - perUnitBudget,
        // The best machine the stated budget DOES buy, when a VRAM floor is
        // the thing blocking it.
        bestWithinBudget: withoutVram ? withoutVram.laptop : null,
        bestWithinBudgetStreet: withoutVram ? withoutVram.street : null,
      }
    }
  }

  const field = [...inBudget, ...stretched]
  const key = scoreKey || 'office_score'

  // Value term: score per rupee, normalised against the best in the field, so a
  // machine that does 90% of the job for 60% of the money can still win.
  const bestValue = field.reduce(
    (m, p) => Math.max(m, (Number(p.laptop[key]) || 0) / Math.max(1, p.street)),
    0
  )

  const ranked = field
    .map((p) => {
      const base = Number(p.laptop[key]) || 0
      const penalty = portabilityPenalty(p.laptop, pref)
      const value = bestValue ? (base / Math.max(1, p.street)) / bestValue : 0
      const over = perUnitBudget ? p.street > perUnitBudget : false
      // If we would have to attach a warning to this machine for this job —
      // no CUDA, wrong for 3D, games do not run — then all else being close it
      // is not the one to lead with. The warning still gets shown; it just
      // stops outranking a machine that needs no warning at all.
      const caveat = platformNote(p.laptop, workloadId) ? 6 : 0
      return {
        ...p,
        base,
        penalty,
        over,
        fit: base - penalty - caveat + value * 8 - (over ? 4 : 0),
      }
    })
    .sort((a, b) => b.fit - a.fit)

  // Alternatives have to be real alternatives. Ranking alone will happily put a
  // thin office laptop third under a gaming brief, because the value term likes
  // how cheap it is — and offering someone a machine that cannot do the job is
  // worse than offering nothing. Anything well behind the leader on the work
  // itself is dropped.
  const leadScore = ranked[0]?.base || 0
  const shortlist = ranked.filter((p, i) => i === 0 || p.base >= leadScore * 0.6)

  const picks = shortlist.slice(0, 3).map((p, i) => decorate(p, { i, catalogue: all, workloadId, portability, pref, key }))

  // Money left on the table. A desktop spends its remaining budget on an
  // upgrade; a laptop cannot, so unspent budget just sits there — and the
  // customer deserves to know the next machine up exists and what it costs,
  // especially on a bulk order where the per-unit ceiling hides a big number.
  let headroom = null
  if (perUnitBudget && picks[0] && picks[0].street < perUnitBudget * 0.85) {
    const better = priced
      .filter((p) => p.street > perUnitBudget && (Number(p.laptop[key]) || 0) > (picks[0].score || 0))
      .sort((a, b) => a.street - b.street)[0]
    headroom = {
      unspent: Math.round(perUnitBudget * units - picks[0].street * units),
      next: better ? better.laptop : null,
      nextStreet: better ? better.street : null,
      nextTotal: better ? better.street * units : null,
    }
  }

  return {
    ok: true,
    workloadId,
    units,
    budget,
    perUnitBudget,
    portability,
    headroom,
    picks,
    best: picks[0],
    considered: ranked.length,
    ceiling: vramCeiling(all),
    // Priced per machine and for the order, GST inclusive both ways, because a
    // laptop quote is a multiplication and nothing else.
    perUnit: picks[0]?.street || 0,
    total: (picks[0]?.street || 0) * units,
  }
}

/**
 * The full verdict on ONE laptop, in the same shape a match produces.
 * Used by the browse list, where the customer has picked the machine
 * themselves and is owed exactly the same honesty as a recommendation.
 */
export function describeLaptop(laptop, { catalogue, workloadId, portability = 'balanced', scoreKey = 'office_score' }) {
  return decorate(
    { laptop, street: streetPrice(laptop), base: Number(laptop[scoreKey]) || 0, over: false },
    { i: 0, catalogue: catalogue.filter(isLaptop), workloadId, portability, key: scoreKey }
  )
}

function decorate({ laptop, street, base, over }, { i, catalogue, workloadId, portability, key }) {
  const peers = tgpPeers(laptop, catalogue)
  const peer = peers[0]
  return {
    laptop,
    street,
    rank: i,
    over,
    score: base,
    scoreKey: key,
    capability: laptopCapability(laptop),
    tgp: tgpVerdict(laptop),
    platform: platformNote(laptop, workloadId),
    sustained: sustainedNote(laptop, workloadId),
    tradeoffs: tradeoffs(laptop, portability),
    peer: peer
      ? { laptop: peer, street: streetPrice(peer), gapPct: tgpGapPct(laptop, peer) }
      : null,
  }
}

// ---------------------------------------------------------------------------
// Laptop vs desktop, stated once
// ---------------------------------------------------------------------------
// The audience for this flow needs a laptop, so this is not a sales pitch for a
// tower. It is the one piece of information they are owed before spending the
// money: what portability costs, as a number, and where the hard walls are.
export function laptopVsDesktop(street) {
  if (!street) return null
  return {
    headline: 'What portability costs',
    text: `Roughly 30–40% of this budget buys the ability to carry it. The same ${formatShortRupees(street)} spent on a desktop buys a noticeably faster machine that never throttles, takes 32GB+ of video memory, and can be upgraded a part at a time for years. If you genuinely need it to move, that is a fair price. If it is going to sit on one desk, it is money burnt.`,
  }
}

function formatShortRupees(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

// ---------------------------------------------------------------------------
// What can actually be changed
// ---------------------------------------------------------------------------
// On a desktop this question has a long answer. On a laptop it has a short one
// and most of it is "no", which is exactly why it is worth answering out loud.
// The graphics card and processor are soldered to the mainboard on every laptop
// currently sold; the screen and the chassis power limit are structural. Memory
// and storage are the only real levers, and only on some machines.
//
// Overstating this is the most expensive mistake this module could make. Someone
// who buys 8GB believing they can "add more later", on a machine where it is
// soldered, has bought the wrong laptop and cannot undo it.

export const LAPTOP_RAM_TYPE     = 'laptop_ram'
export const LAPTOP_STORAGE_TYPE = 'laptop_storage'

const isPart = (c, type) =>
  c && c.type === type && c.status === 'active' &&
  c.availability !== 'discontinued' && c.current_price != null

// Stated on every machine, whatever it costs, because it is true of every
// machine and it is the real difference from the desktop they were weighing up.
export const FIXED_FOREVER = [
  {
    icon: 'auto_awesome_mosaic',
    label: 'Graphics card',
    why: 'Soldered to the mainboard. There is no laptop on sale where this can be changed later, at any price — which is why the GPU is the one thing to get right on the day you buy.',
  },
  {
    icon: 'memory',
    label: 'Processor',
    why: 'Soldered, same as the graphics card.',
  },
  {
    icon: 'bolt',
    label: 'GPU power limit',
    why: 'The wattage the chassis allows is fixed by its cooling design. No setting, driver or part raises it.',
  },
  {
    icon: 'desktop_windows',
    label: 'Screen',
    why: 'Replaceable only as a repair, with the same panel. The resolution and refresh rate are what you bought.',
  },
  {
    icon: 'battery_charging_full',
    label: 'Battery',
    why: 'Replaceable when it wears out, never with a larger one — the capacity is the space available.',
  },
]

/**
 * The upgrades this specific machine can genuinely take.
 *
 * Returns empty lists rather than a token offer when the answer is no: a
 * soldered machine gets no memory options at all, and says why.
 */
export function upgradeOptions(laptop, catalogue) {
  const fittedRam = Number(laptop?.ram_gb) || 0
  const maxRam    = Number(laptop?.max_ram_gb) || 0
  const fittedSsd = Number(laptop?.capacity_gb) || 0
  const slots     = Number(laptop?.m2_slots) || 0
  const addsDrive = slots >= 2

  const ram = laptop?.ram_upgradable
    ? catalogue
        .filter((c) => isPart(c, LAPTOP_RAM_TYPE))
        .filter((c) => {
          const gb = Number(c.capacity_gb) || 0
          return gb > fittedRam && (!maxRam || gb <= maxRam)
        })
        .sort((a, b) => (a.capacity_gb || 0) - (b.capacity_gb || 0))
    : []

  const storage = laptop?.storage_upgradable
    ? catalogue
        .filter((c) => isPart(c, LAPTOP_STORAGE_TYPE))
        // With a spare bay anything is worth adding. With one bay an upgrade
        // means throwing the fitted drive away, so only bigger makes sense.
        .filter((c) => addsDrive || (Number(c.capacity_gb) || 0) > fittedSsd)
        .sort((a, b) => (a.capacity_gb || 0) - (b.capacity_gb || 0))
    : []

  return {
    ram,
    storage,
    addsDrive,
    // Why an option is missing matters more than the fact it is missing.
    ramBlockedBecause: laptop?.ram_upgradable === false
      ? (isUnifiedMemory(laptop)
        ? `Memory is soldered at ${fittedRam}GB — and on this machine memory IS video memory. The configuration you buy is the one you have for its whole life, including how large a model it can ever load.`
        : `Memory is soldered at ${fittedRam}GB and cannot be increased, ever. If ${fittedRam}GB might not be enough in four years, that is an argument against this machine rather than something to fix later.`)
      : null,
    storageBlockedBecause: laptop?.storage_upgradable === false
      ? 'Storage is soldered. The capacity you buy is the capacity forever — an external drive is the only way to add to it.'
      : null,
  }
}

/**
 * Price a set of chosen upgrades on top of the machine.
 * Every figure GST-inclusive, because that is how the laptop itself is shown.
 */
export function applyUpgrades(laptop, { ram, storage } = {}, { addsDrive = false } = {}) {
  const base = streetPrice(laptop)
  const lines = []

  if (ram) {
    lines.push({
      key: 'ram',
      label: 'Memory',
      from: `${laptop.ram_gb}GB`,
      to: `${ram.capacity_gb}GB`,
      part: `${ram.brand} ${ram.name}`,
      price: streetPrice(ram),
      // Said plainly because it decides whether the quote is right: on a full
      // machine the fitted modules come out, and that is not a hidden cost.
      note: 'Fitted before delivery. If both slots are already occupied the original modules come out and go home with you.',
    })
  }
  if (storage) {
    lines.push({
      key: 'storage',
      label: 'Storage',
      from: `${fmtGb(laptop.capacity_gb)}`,
      to: addsDrive
        ? `${fmtGb(laptop.capacity_gb)} + ${fmtGb(storage.capacity_gb)}`
        : `${fmtGb(storage.capacity_gb)}`,
      part: `${storage.brand} ${storage.name}`,
      price: streetPrice(storage),
      note: addsDrive
        ? 'Goes in the spare M.2 bay, so the drive it came with stays where it is.'
        : 'This machine has one M.2 bay, so the new drive replaces the original. We clone your setup across first.',
    })
  }

  const delta = lines.reduce((s, l) => s + l.price, 0)
  return { base, delta, total: base + delta, lines }
}

function fmtGb(gb) {
  const n = Number(gb) || 0
  return n >= 1024 ? `${+(n / 1024).toFixed(n % 1024 ? 1 : 0)}TB` : `${n}GB`
}

// Memory is not video memory — except where it is. Both cases mislead someone
// who has just been offered a memory upgrade, so both get said.
export function ramVsVramNote(laptop, workloadId) {
  if (workloadId !== 'ai') return null
  if (isUnifiedMemory(laptop)) {
    return 'On this machine system memory and video memory are the same pool, so the configuration decides how large a model it can load — and it is soldered.'
  }
  return 'More system memory will not let this run larger models. Model size is set by the graphics card’s video memory, which is fixed.'
}
