import { WORKLOAD_BY_ID, capabilityFor, systemNote } from './profiles'
import { canAdd, meetsWorkloadConstraints, requiredPsuWatts, totalDraw, validateBuild } from './compatibility'

// Budget allocation is DERIVED, never hardcoded.
//
// The approach: assemble the cheapest complete build that actually works, then
// spend what is left on whichever single upgrade buys the most score per rupee,
// repeatedly, until nothing further fits. Two reasons this beats a percentage
// table: it cannot produce an incoherent build (the floor is always valid), and
// it adapts automatically when a category's prices move — which in 2026 they
// did, violently. RAM at 30% of a build is absurd historically and correct today.

const MAX_UPGRADE_PASSES = 60

const price = (c) => Number(c?.current_price) || 0
const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`
const score = (c, key) => Number(c?.[key]) || 0

export function isUsable(c) {
  return (
    c &&
    c.status === 'active' &&
    c.availability !== 'discontinued' &&
    c.current_price !== null &&
    c.current_price !== undefined
  )
}

function poolsByType(catalogue, workload) {
  const pools = {}
  for (const c of catalogue) {
    if (!isUsable(c)) continue
    if (!meetsWorkloadConstraints(c, workload)) continue
    ;(pools[c.type] ||= []).push(c)
  }
  for (const list of Object.values(pools)) list.sort((a, b) => price(a) - price(b))
  return pools
}

// Swap in the cheapest PSU that covers the build's draw. Returns false when the
// catalogue has nothing big enough, which is a real answer, not a failure.
function ensurePsu(build, pools) {
  const needed = requiredPsuWatts(build)
  const current = build.psu
  if (current && (current.psu_watts || 0) >= needed) return true
  const fit = (pools.psu || []).find((p) => (p.psu_watts || 0) >= needed)
  if (!fit) return false
  build.psu = fit
  return true
}

// The defining part gets first call on the budget, before anything else is
// upgraded. Without this, greedy score-per-rupee buys whatever is cheapest per
// point — which on an AI build means 128GB of system RAM instead of VRAM, since
// RAM's score climbs cheaply while a bigger GPU is expensive per point. VRAM is
// a hard capability gate, not something tradeable against system memory.
// Fitting a part sometimes requires moving another one. A 360mm card will not
// go in a cabinet rated to 300mm, and the floor build always picks the cheapest
// cabinet — so without this an Rs 1,800 case silently caps an Rs 3.5 lakh GPU
// and the budget goes unspent.
function placePart(build, type, part, pools) {
  const trial = { ...build, [type]: part }
  if (ensurePsu(trial, pools) && validateBuild(trial).ok) return trial

  // A graphics card or cooler that does not fit may only need a bigger cabinet.
  if (type === 'gpu' || type === 'cooler') {
    for (const cabinet of pools.case || []) {
      const t2 = { ...trial, case: cabinet }
      if (!ensurePsu(t2, pools)) continue
      if (validateBuild(t2).ok) return t2
    }
  }
  return null
}

function allocateAnchor(build, pools, workload, budget) {
  const type = workload.anchor
  if (!type || !build[type]) return build

  const key = workload.scoreKey
  let chosen = build
  let bestScore = score(build[type], key)

  for (const candidate of pools[type] || []) {
    if (score(candidate, key) <= bestScore) continue

    const trial = type === 'cpu'
      ? withCpu(build, candidate, pools)
      : placePart(build, type, candidate, pools)
    if (!trial) continue
    if (buildCost(trial) > budget) continue   // enabling swaps cost money too

    chosen = trial
    bestScore = score(candidate, key)
  }
  return chosen
}

// Anchor-first spending alone produces bottlenecked machines: it maxes the GPU
// and leaves the CPU on the cheapest part in the catalogue. A 2-core Athlon
// behind an RTX 5060 Ti is not a bargain, it is a card that spends its life
// waiting. The CPU must keep within reach of the GPU on the workload that
// matters.
const BALANCE_RATIO = 0.5

function isBalanced(build, workload) {
  const key = workload.scoreKey
  if (!build.gpu || !build.cpu) return true
  const g = score(build.gpu, key)
  if (g <= 20) return true            // nothing meaningful to bottleneck down here
  return score(build.cpu, key) >= g * BALANCE_RATIO
}

// Swapping the CPU can invalidate the board (socket) and the memory (DDR4 vs
// DDR5), so the whole platform moves together or not at all.
function withCpu(build, cpu, pools) {
  const boards = (pools.motherboard || []).filter(
    (m) => !cpu.socket || !m.socket || m.socket === cpu.socket
  )
  for (const mb of boards) {
    const trial = { ...build, cpu, motherboard: mb }
    if (mb.ram_type && trial.ram?.ram_type && trial.ram.ram_type !== mb.ram_type) {
      const ram = (pools.ram || []).find((r) => r.ram_type === mb.ram_type)
      if (!ram) continue
      trial.ram = ram
    }
    if (!ensurePsu(trial, pools)) continue
    if (validateBuild(trial).ok) return trial
  }
  return null
}

function rebalance(build, pools, workload, budget) {
  const key = workload.scoreKey

  for (let i = 0; i < 12 && !isBalanced(build, workload); i++) {
    const target = score(build.gpu, key) * BALANCE_RATIO

    // First choice: lift the CPU to match, cheapest option that clears the bar.
    const candidates = (pools.cpu || [])
      .filter((c) => score(c, key) >= target)
      .map((c) => withCpu(build, c, pools))
      .filter((t) => t && buildCost(t) <= budget)
      .sort((a, b) => buildCost(a) - buildCost(b))

    if (candidates.length) { build = candidates[0]; continue }

    // Otherwise the GPU is simply beyond what this budget can support in a
    // balanced machine — step it down and try again.
    const lesser = (pools.gpu || [])
      .filter((g) => score(g, key) < score(build.gpu, key))
      .sort((a, b) => score(b, key) - score(a, key))[0]
    if (!lesser) break

    const stepped = placePart(build, 'gpu', lesser, pools)
    if (!stepped) break
    build = stepped
  }
  return build
}

// Cheapest complete build that passes every rule.
function floorBuild(pools, workload) {
  const build = {}

  // CPU and motherboard are chosen as a pair — picking the cheapest of each
  // independently usually lands on mismatched sockets.
  let bestPair = null
  for (const cpu of pools.cpu || []) {
    for (const mb of pools.motherboard || []) {
      if (cpu.socket && mb.socket && cpu.socket !== mb.socket) continue
      const cost = price(cpu) + price(mb)
      if (!bestPair || cost < bestPair.cost) bestPair = { cpu, mb, cost }
    }
  }
  if (!bestPair) return null
  build.cpu = bestPair.cpu
  build.motherboard = bestPair.mb

  // Cabinet must accept the board.
  build.case = (pools.case || []).find((k) => canAdd(k, build))
  if (!build.case) return null

  for (const type of ['ram', 'storage', 'gpu', 'cooler']) {
    if (!workload.requires.includes(type)) continue
    const pick = (pools[type] || []).find((c) => canAdd(c, build))
    if (!pick) return null
    build[type] = pick
  }

  if (!ensurePsu(build, pools)) return null
  return build
}

function buildCost(build) {
  return Object.values(build).reduce((sum, c) => sum + price(c), 0)
}

// One upgrade step: the swap with the best score gain per rupee that still
// fits the budget. GPU and CPU upgrades may drag the PSU up with them, so the
// PSU's extra cost is charged to the swap that caused it.
function bestUpgrade(build, pools, workload, budget) {
  const key = workload.scoreKey
  const currentCost = buildCost(build)
  let best = null

  for (const type of Object.keys(build)) {
    if (type === 'psu') continue          // handled as a consequence, not a goal
    for (const candidate of pools[type] || []) {
      if (candidate.id === build[type].id) continue

      const gain = score(candidate, key) - score(build[type], key)
      if (gain <= 0) continue

      const trial = type === 'cpu'
        ? withCpu(build, candidate, pools)
        : placePart(build, type, candidate, pools)
      if (!trial) continue
      if (!isBalanced(trial, workload)) continue

      const cost = buildCost(trial)
      const delta = cost - currentCost
      if (delta <= 0) { best = { trial, ratio: Infinity }; break }
      if (cost > budget) continue

      const ratio = gain / delta
      if (!best || ratio > best.ratio) best = { trial, ratio }
    }
  }
  return best
}

/**
 * Design a system.
 *
 * @param catalogue  rows from pc_components
 * @param workloadId one of WORKLOADS
 * @param budget     total rupees for ONE machine (excl. GST), or null for "best effort"
 * @param seats      how many identical machines (a lab)
 */
export function designSystem({ catalogue, workloadId, budget, seats = 1, minVram = null, floorOnly = false }) {
  const workload = WORKLOAD_BY_ID[workloadId]
  if (!workload) throw new Error(`Unknown workload: ${workloadId}`)

  const pools = poolsByType(catalogue, workload)

  // A stated VRAM need is a hard floor, not a preference. Someone who says
  // "run Llama 70B" must not be handed a 32GB card with a cheerful note about
  // 30B models — if nothing in the catalogue can do it, say so.
  if (minVram && pools.gpu?.length) {
    const capable = pools.gpu.filter((g) => (g.vram_gb || 0) >= minVram)
    if (!capable.length) {
      const best = pools.gpu.reduce((a, b) => ((b.vram_gb || 0) > (a.vram_gb || 0) ? b : a))
      return {
        ok: false, reason: 'vram_unavailable', workload,
        minVram, bestVram: best.vram_gb || 0,
      }
    }
    pools.gpu = capable
  }

  const missing = workload.requires.filter((t) => !(pools[t] || []).length)
  if (missing.length) {
    return { ok: false, reason: 'catalogue_incomplete', missingTypes: missing, workload }
  }

  let build = floorBuild(pools, workload)
  if (!build) {
    return { ok: false, reason: 'no_compatible_combination', workload }
  }

  const floorCost = buildCost(build)
  const cap = budget && budget > 0 ? budget : Infinity
  const overBudget = floorCost > cap

  // Only spend up when there is room. Below the floor we still return the build
  // so the customer sees what the entry point actually costs, flagged honestly.
  // floorOnly asks for the cheapest working machine outright — a null budget
  // means "no ceiling", which is the opposite.
  if (!overBudget && !floorOnly) {
    // Anchor first — the defining part gets first call on the budget.
    build = allocateAnchor(build, pools, workload, cap)

    // Then fix any bottleneck it created, while everything else is still at
    // floor and there is therefore the most money available to fix it. Doing
    // this after the upgrade pass leaves nothing to pay for a better CPU.
    build = rebalance(build, pools, workload, cap)

    // Finally spend what remains on best value, never re-breaking the balance.
    for (let i = 0; i < MAX_UPGRADE_PASSES; i++) {
      const step = bestUpgrade(build, pools, workload, cap)
      if (!step) break
      build = step.trial
    }
  }

  return finaliseBuild({ build, workload, seats, budget, overBudget, floorCost })
}

// The cheapest machine worth selling. Below this the parts stop being a saving
// and start being a support problem.
export const MIN_SYSTEM_BUDGET = 20000

// A share of a lab budget goes on the shared training node rather than being
// spread thinly across every desk.
const MAX_NODE_SHARE = 0.35
const MIN_USEFUL_NODE = 60000

// A buyer who says "10 lakhs" means the cheque they will write, not the pre-tax
// subtotal. Everything in the catalogue is 18% GST, so design against the
// ex-tax figure and the final invoice lands where they expected.
const GST_MULTIPLIER = 1.18

/**
 * Design a multi-seat lab.
 *
 * `totalBudget` is the WHOLE project budget, not per machine — when someone
 * says "AI lab for 30 students, 10 lakh" they mean ten lakh for the lab. Reading
 * it as per-seat multiplies the quote by the seat count, which is how you send a
 * college a bill for 57 lakh when they asked for 10.
 *
 * For an AI lab the seats are deliberately NOT given a GPU each. Thirty GPUs is
 * both unaffordable and not how these labs work: students develop on ordinary
 * machines and training runs on one shared node. That is what makes the budget
 * land, and it is a more honest answer than thirty crippled boxes.
 */
export function designLab({ catalogue, workloadId, totalBudget, seats, minVram = null }) {
  const workload = WORKLOAD_BY_ID[workloadId]
  if (!workload) throw new Error(`Unknown workload: ${workloadId}`)

  const stated = totalBudget && totalBudget > 0 ? totalBudget : null
  const budget = stated ? stated / GST_MULTIPLIER : null
  const wantsNode = workloadId === 'ai' && seats >= 5

  const uniform = (perSeat, note = null) => {
    const seat = designSystem({ catalogue, workloadId, budget: perSeat, seats: 1, minVram })
    if (!seat.ok) return { ok: false, ...seat }
    return assembleLab({ seat, node: null, seats, totalBudget: stated, note })
  }

  if (!budget) return uniform(null)

  // Can the budget carry a worthwhile shared node and still clear the floor
  // at every desk? If not, spread it evenly and say so.
  if (wantsNode) {
    const headroom = budget - seats * MIN_SYSTEM_BUDGET
    if (headroom >= MIN_USEFUL_NODE) {
      const nodeBudget = Math.min(headroom, budget * MAX_NODE_SHARE)
      const perSeat = (budget - nodeBudget) / seats
      const seat = designSystem({ catalogue, workloadId: 'office', budget: perSeat, seats: 1 })
      const node = designSystem({ catalogue, workloadId: 'ai', budget: nodeBudget, seats: 1, minVram })
      if (seat.ok && node.ok) {
        return assembleLab({
          seat, node, seats, totalBudget: stated,
          note: {
            headline: 'Shared training node',
            text: `${seats} student workstations plus one shared GPU node. Students write and test code at their desks; training runs on the node. Giving every desk its own GPU would cost several times this and is not how these labs are run.`,
          },
        })
      }
    }
  }

  const perSeat = budget / seats

  // An AI lab whose per-seat budget cannot carry a graphics card is not a
  // failure — it is a prompting lab. Students using cloud models and coding
  // tools need a sound everyday machine, not local compute, and saying so is
  // both truthful and what makes thirty seats fit six lakh.
  if (workloadId === 'ai' && perSeat >= MIN_SYSTEM_BUDGET) {
    const aiSeat = designSystem({ catalogue, workloadId: 'ai', budget: perSeat, seats: 1, minVram })
    if (!aiSeat.ok || aiSeat.overBudget) {
      const seat = designSystem({ catalogue, workloadId: 'office', budget: perSeat, seats: 1 })
      if (seat.ok) {
        return assembleLab({
          seat, node: null, seats, totalBudget: stated,
          note: {
            headline: 'A prompting lab',
            text: `Built for using AI rather than training it — students work with cloud models, coding tools and APIs. No local graphics card, which is exactly what lets ${seats} seats fit this budget. A shared GPU node can be added later when you want local training.`,
          },
        })
      }
    }
  }

  // Too little per seat is not a reason to refuse. Design the cheapest machine
  // that actually works, then state plainly what it costs, how far over that
  // puts the project, and how many seats the stated budget really covers.
  // Telling a college "no" helps nobody; telling them "26 seats, or 30 at
  // 6.9 lakh" is a conversation.
  if (perSeat < MIN_SYSTEM_BUDGET) {
    const floor = designSystem({ catalogue, workloadId: 'office', budget: null, seats: 1, floorOnly: true })
    if (!floor.ok) return { ok: false, ...floor }

    const perSeatIncl = floor.perSystem + floor.gstTotal
    const fits = Math.max(1, Math.floor(stated / perSeatIncl))

    return assembleLab({
      seat: floor, node: null, seats, totalBudget: stated,
      note: {
        headline: 'Tighter than the budget allows',
        text: `The cheapest machine we can build today is ${rupees(perSeatIncl)} including GST — component prices, memory especially, have risen sharply this year. ${seats} of them comes to ${rupees(perSeatIncl * seats)}. Within ${rupees(stated)} you could equip ${fits} seats now and add the rest later.`,
      },
    })
  }
  return uniform(perSeat)
}

function assembleLab({ seat, node, seats, totalBudget, note }) {
  const seatsSubtotal = seat.perSystem * seats
  const seatsGst = seat.gstTotal * seats
  const nodeCost = node ? node.perSystem : 0
  const nodeGst = node ? node.gstTotal : 0
  const subtotal = seatsSubtotal + nodeCost
  const gstTotal = seatsGst + nodeGst

  return {
    ok: true,
    mode: node ? 'shared_node' : 'uniform',
    workload: seat.workload,
    seats,
    seat,
    node,
    perSeat: seat.perSystem,
    seatsSubtotal,
    nodeCost,
    subtotal,
    gstTotal,
    total: subtotal + gstTotal,
    totalBudget,
    overBudget: totalBudget ? subtotal + gstTotal > totalBudget : false,
    note,
  }
}

// Used by the manual builder too, where the user picked the parts themselves.
export function finaliseBuild({ build, workload, seats = 1, budget = null, overBudget = false, floorCost = null }) {
  const items = Object.values(build).filter(Boolean).map((c) => ({
    component_id: c.id,
    type: c.type,
    brand: c.brand,
    name: c.name,
    hsn: c.hsn_code,
    qty: 1,
    unit_price: price(c),
    // Number() yields NaN, never null, so `?? 18` would never fire and a bad
    // rate would silently poison the GST total.
    gst_rate: Number.isFinite(Number(c.gst_rate)) ? Number(c.gst_rate) : 18,
    line_total: price(c),
    image_url: c.image_url,
  }))

  const perSystem = items.reduce((s, i) => s + i.line_total, 0)
  const subtotal = perSystem * seats
  const gstTotal = items.reduce((s, i) => s + (i.line_total * (i.gst_rate / 100)), 0) * seats
  const validation = validateBuild(build)
  // "Runs 30B models at Q4" is the selling line for an AI box and pure noise on
  // a gaming or office one, so it is scoped to the workload that cares.
  const capability =
    workload?.id === 'ai' && build.gpu ? capabilityFor(build.gpu.vram_gb) : null
  const note = systemNote(build, workload)

  return {
    ok: true,
    workload,
    build,
    items,
    seats,
    perSystem,
    subtotal,
    gstTotal,
    total: subtotal + gstTotal,
    budget,
    overBudget,
    floorCost,
    draw: totalDraw(build),
    recommendedPsu: requiredPsuWatts(build),
    capability,
    note,
    validation,
  }
}
