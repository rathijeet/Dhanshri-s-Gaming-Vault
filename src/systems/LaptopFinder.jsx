import { useEffect, useMemo, useRef, useState } from 'react'
import { WORKLOAD_BY_ID, workloadsFor } from './profiles'
import {
  CHASSIS_CLASSES, FIXED_FOREVER, PORTABILITY, applyUpgrades, describeLaptop,
  isLaptop, laptopVsDesktop, matchLaptops, ramVsVramNote, streetPrice,
  upgradeOptions, vramCeiling,
} from './laptops'
import { parseBrand, parseIntent } from './intent'
import { formatRupees, formatShort } from './publicSystemHelpers'
import { BUSINESS_NAME, WHATSAPP_NUMBER } from '../config'
import { BudgetPrompt, DesignButton, LaunchCard, NumberField, Panel, Row } from './BuilderUI'
import { useLaunch } from './useLaunch'
import Icon from '../components/Icon'

// The laptop track.
//
// It is NOT the desktop builder with different parts, because a laptop is not a
// thing you assemble. There is no parts list, no compatibility check, no
// spending the remaining budget on an upgrade, and no 3D walk-around of a
// machine whose insides you will never touch. There is one question — which
// finished machine — and a duty to say plainly what it will and will not do.
//
// Everything on the right-hand side is therefore a verdict rather than a bill
// of materials: what it runs, what the chassis does to the GPU, what a laptop
// physically cannot do for this brief, and what you give up by buying one.

const MODES = [
  { id: 'describe', label: 'Describe it', icon: 'auto_awesome', hint: 'Tell us in your own words' },
  { id: 'budget',   label: 'By budget',   icon: 'payments',     hint: 'Pick a use and a number' },
  { id: 'browse',   label: 'See them all', icon: 'list',        hint: 'Every laptop we list' },
]

// Honest about what actually happens. There are no clearances to check on a
// sealed chassis — the check that matters is how many watts it allows the GPU.
const STAGES = [
  { label: 'Reading your brief',              icon: 'auto_awesome' },
  { label: 'Matching against what we stock',  icon: 'inventory_2' },
  { label: 'Checking what each chassis allows', icon: 'bolt' },
  { label: "Pricing at today's rates",        icon: 'payments' },
]

const EXAMPLES = [
  'Laptop for AI coursework, I carry it to college daily, 1.5 lakh',
  'HP laptop around 70k',
  'Video editing laptop, mostly stays on my desk, 2 lakh',
  'Gaming laptop under 1 lakh',
  'Lenovo laptop for office work, 60k',
  '20 laptops for our training centre, 12 lakh',
]

const WORKLOADS = workloadsFor('laptop')

const SPEC_ICON = {
  cpu: 'memory', gpu: 'auto_awesome_mosaic', ram: 'view_module', storage: 'hard_drive',
  screen: 'desktop_windows', weight: 'scale', battery: 'battery_charging_full', warranty: 'verified_user',
}

export default function LaptopFinder({ catalogue, handoff }) {
  const laptops = useMemo(() => catalogue.filter(isLaptop), [catalogue])
  const ceiling = useMemo(() => vramCeiling(catalogue), [catalogue])
  const brands  = useMemo(() => [...new Set(laptops.map((l) => l.brand))].sort(), [laptops])

  const [mode, setMode] = useState('describe')
  const [text, setText] = useState('')
  const [brief, setBrief] = useState(null)

  const [workloadId, setWorkloadId] = useState('ai')
  // GST-inclusive, because that is the number a laptop buyer has in their head.
  const [budget, setBudget] = useState(150000)
  const [units, setUnits] = useState(1)
  const [portability, setPortability] = useState('balanced')
  // Some AI buyers have no choice: the course, the client or the SDK says CUDA,
  // and the best machine on capacity is then the wrong machine.
  const [requireCuda, setRequireCuda] = useState(false)
  const [brand, setBrand] = useState(null)
  // True when nothing in the brief said what the machine is for and we picked
  // everyday use to get them an answer. The result panel says so and offers to
  // re-match, because a silent assumption is how you recommend the wrong laptop.
  const [assumed, setAssumed] = useState(false)
  const [askBudget, setAskBudget] = useState(null)   // the brief waiting on a number
  // { ram: component|null, storage: component|null } for the machine on screen.
  const [upgrades, setUpgrades] = useState({ ram: null, storage: null })

  const [result, setResult] = useState(null)
  const resultRef = useRef(null)
  const { stage, launch } = useLaunch(STAGES, resultRef)

  const workload = WORKLOAD_BY_ID[workloadId]

  const run = (wl, bud, qty, port, minVram = null, cuda = requireCuda, br = brand) => {
    setUpgrades({ ram: null, storage: null })   // a different machine takes different parts
    setResult(matchLaptops({
      catalogue: laptops,
      workloadId: wl,
      scoreKey: WORKLOAD_BY_ID[wl]?.scoreKey,
      budget: bud,
      minVram,
      brand: br,
      portability: port,
      units: qty,
      requireCuda: cuda,
    }))
  }

  const onDescribe = async (override) => {
    const source = typeof override === 'string' ? override : text
    if (!source.trim() || !laptops.length || stage >= 0) return
    setResult(null)
    const parsed = await parseIntent(source)
    const br = parseBrand(source, brands)
    setBrief({ ...parsed, brand: br })
    setBrand(br)

    // "hp laptop budget 40000" says nothing about the work, and refusing to
    // answer it is the wrong call — a budget IS enough to show what the money
    // buys. Everyday use is the assumption, it is stated on the result, and
    // one tap corrects it. (A budget we cannot assume: see the desktop flow.)
    const guessed = !parsed.workloadId
    const wl = parsed.workloadId || 'office'
    const qty = parsed.seats || 1
    const port = parsed.portability || 'balanced'
    // A stated budget in a laptop brief is the sticker price, GST included.
    const bud = parsed.budget || null

    if (guessed && !bud && !br) return    // nothing at all to go on

    setAssumed(guessed)
    setWorkloadId(wl); setUnits(qty); setPortability(port)

    // "Need an HP laptop" names a brand and nothing else. Ranking the five HP
    // machines on merit alone puts a Rs 3.8 lakh mobile workstation first,
    // which is not an answer — it is the most expensive thing they might
    // conceivably afford. On a laptop the budget decides the machine, so we
    // ask for it rather than guess, exactly as the desktop flow does.
    if (!bud) {
      setAskBudget({ ...parsed, workloadId: wl, brand: br, assumed: guessed })
      return
    }

    setBudget(Math.round(bud / qty))
    launch(() => run(wl, bud, qty, port, parsed.vramHint, requireCuda, br))
  }

  const startFromPrompt = (amount) => {
    const b = askBudget
    setAskBudget(null)
    const qty = b.seats || 1
    setBudget(Math.round(amount / qty))
    launch(() => run(b.workloadId, amount, qty, b.portability || 'balanced', b.vramHint, requireCuda, b.brand))
  }

  // Arrived here because the desktop box was told "laptop". Their words come
  // with them and run straight away — being bounced to a new screen and asked
  // to type it again is how you lose someone.
  const handledRef = useRef(null)
  useEffect(() => {
    if (!handoff || handledRef.current === handoff.at || !laptops.length) return
    handledRef.current = handoff.at
    setMode('describe')
    setText(handoff.text)
    onDescribe(handoff.text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handoff, laptops.length])

  const onPick = (laptop) => {
    setUpgrades({ ram: null, storage: null })
    setResult({
      ok: true, workloadId, units, budget: null, portability, picks: [],
      chosen: describeLaptop(laptop, {
        catalogue: laptops, workloadId, portability, scoreKey: workload?.scoreKey,
      }),
      perUnit: streetPrice(laptop),
      total: streetPrice(laptop) * units,
      ceiling,
    })
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  // Prompt copy derived here, not inside the JSX: an IIFE in the tree runs
  // during render and these callbacks reach refs. Presets and the floor come
  // from the catalogue so they stay true as stock changes.
  const askQty   = askBudget?.seats || 1
  const askBulk  = askQty > 1
  const askPool  = askBudget?.brand ? laptops.filter((l) => l.brand === askBudget.brand) : laptops
  const cheapest = askPool.length ? Math.min(...askPool.map(streetPrice)) : 30000
  const dearest  = askPool.length ? Math.max(...askPool.map(streetPrice)) : 500000
  const askMin   = cheapest * askQty

  const best = result?.ok ? (result.chosen || result.best) : null
  const alternates = result?.ok && !result.chosen ? (result.picks || []).slice(1) : []

  const onWhatsApp = () => {
    if (!best) return
    const l = best.laptop
    const opts = upgradeOptions(l, catalogue)
    const priced = applyUpgrades(l, upgrades, { addsDrive: opts.addsDrive })
    const lines = [
      `Hi ${BUSINESS_NAME}! I shortlisted a laptop on your site.`,
      '',
      `*${l.brand} ${l.name}*`,
      `${l.cpu_model || ''}${l.gpu_model ? ` · ${l.gpu_model}` : ''}`,
      l.gpu_tgp_watts ? `GPU power: ${l.gpu_tgp_watts}W` : null,
      `${l.ram_gb || '—'}GB memory · ${l.capacity_gb ? `${l.capacity_gb}GB` : '—'} storage`,
      l.screen_size_in ? `${l.screen_size_in}" ${l.screen_res || ''}${l.screen_refresh_hz ? ` ${l.screen_refresh_hz}Hz` : ''}` : null,
      l.weight_kg ? `${l.weight_kg}kg` : null,
      '',
      `*Use case:* ${workload?.label || '—'}`,
      best.capability ? `*Runs:* ${best.capability.label}` : null,
      '',
      priced.lines.length ? '*Upgrades:*' : null,
      ...priced.lines.map((x) => `• ${x.label}: ${x.from} → ${x.to} (${x.part}) — +${formatRupees(x.price)}`),
      priced.lines.length ? '' : null,
      units > 1 ? `*Quantity:* ${units}` : null,
      units > 1 ? `*Per unit:* ${formatRupees(priced.total)} incl. GST` : null,
      `*${units > 1 ? 'Total' : 'Price'}:* ${formatRupees(priced.total * units)} incl. GST`,
      '',
      'Please confirm availability and current pricing.',
    ]
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.filter((x) => x !== null).join('\n'))}`,
      '_blank', 'noopener,noreferrer'
    )
  }

  if (!laptops.length) {
    return (
      <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-6 text-center">
        <Icon name="laptop_windows" className="!text-3xl text-on-surface-variant mb-2" />
        <p className="font-body-md text-on-surface-variant">
          No laptops listed yet. Talk to us and we&rsquo;ll source the right one — or switch to
          Desktop above to design a tower.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ---------------- LEFT: controls ---------------- */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MODES.map((m) => {
            const active = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-4 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? 'border-primary-fixed bg-primary-fixed/10 text-primary-fixed'
                    : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary-fixed/50'
                }`}
              >
                <Icon name={m.icon} className="!text-lg" />
                <span className="font-headline-sm text-sm font-bold">{m.label}</span>
              </button>
            )
          })}
        </div>

        {mode === 'describe' && (
          <Panel title="What do you need it for?">
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Laptop for machine learning coursework, I carry it to college every day, around 1.5 lakh"
              className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none resize-y"
            />
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setText(ex)}
                  className="border border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary-fixed/50 hover:text-on-surface px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
            {/* Tags and free text do the same job by different routes. Typing
                is better when you know what you need; tapping is better when
                you would not have thought to mention "CAD" at all. */}
            <div>
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">
                Or just tell us the job
              </p>
              <div className="flex flex-wrap gap-2">
                {WORKLOADS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setWorkloadId(w.id)
                      setAssumed(false)
                      setBrief(null)
                      setAskBudget({ workloadId: w.id, brand, seats: 1, assumed: false })
                    }}
                    className="border-2 border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary-fixed/60 hover:text-on-surface px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Icon name={w.icon} className="!text-base" />
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <DesignButton
              onClick={onDescribe}
              disabled={!text.trim()}
              running={stage >= 0}
              label="Find my laptop"
              runningLabel="Matching…"
            />
            {brief && !brief.workloadId && !brief.budget && !brief.brand && (
              <div className="border border-amber-500/40 bg-amber-500/10 rounded-xl p-4">
                <p className="font-body-md text-sm text-amber-300">
                  There&rsquo;s nothing here I can match on. Give me a budget, a brand or what
                  you&rsquo;ll use it for — &ldquo;HP laptop around 70k&rdquo; is plenty — or use{' '}
                  <button type="button" onClick={() => setMode('budget')} className="underline font-bold">By budget</button>.
                </p>
              </div>
            )}
            {brief && (brief.workloadId || brief.budget || brief.brand) && (
              <p className="font-body-md text-xs text-on-surface-variant">
                Read as:{' '}
                {brief.brand ? <span className="text-primary-fixed font-bold">{brief.brand} only · </span> : null}
                <span className={brief.workloadId ? 'text-primary-fixed font-bold' : 'italic'}>
                  {brief.workloadId ? WORKLOAD_BY_ID[brief.workloadId]?.label : 'use not stated — assuming everyday'}
                </span>
                {brief.budget ? ` · ${formatShort(brief.budget)}` : ' · no budget stated'}
                {brief.seats > 1 ? ` · ${brief.seats} units` : ''}
                {brief.portability ? ` · carried ${PORTABILITY.find((p) => p.id === brief.portability)?.label.toLowerCase()}` : ''}
                {brief.vramHint ? ` · needs ${brief.vramHint}GB VRAM` : ''}
              </p>
            )}
          </Panel>
        )}

        {mode === 'budget' && (
          <Panel title="What is it for?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WORKLOADS.map((w) => {
                const active = workloadId === w.id
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWorkloadId(w.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      active ? 'border-primary-fixed bg-primary-fixed/10'
                             : 'border-outline-variant/30 bg-surface-container hover:border-primary-fixed/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name={w.icon} className={`!text-lg ${active ? 'text-primary-fixed' : 'text-on-surface-variant'}`} />
                      <span className={`font-headline-sm text-sm font-bold ${active ? 'text-primary-fixed' : 'text-on-surface'}`}>
                        {w.label}
                      </span>
                    </div>
                    <p className="font-body-md text-xs text-on-surface-variant">{w.blurb}</p>
                  </button>
                )
              })}
            </div>

            {/* How often it moves decides the machine as much as the money
                does, because weight and sustained speed trade against each
                other. A desktop has no equivalent question. */}
            <div>
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">
                How often will you carry it?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PORTABILITY.map((p) => {
                  const active = portability === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPortability(p.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        active ? 'border-primary-fixed bg-primary-fixed/10'
                               : 'border-outline-variant/30 bg-surface-container hover:border-primary-fixed/50'
                      }`}
                    >
                      <Icon name={p.icon} className={`!text-lg mb-1 ${active ? 'text-primary-fixed' : 'text-on-surface-variant'}`} />
                      <span className={`font-headline-sm text-sm font-bold block ${active ? 'text-primary-fixed' : 'text-on-surface'}`}>
                        {p.label}
                      </span>
                      <span className="font-body-md text-xs text-on-surface-variant">{p.detail}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {workloadId === 'ai' && (
              <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-outline-variant/30 bg-surface-container cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireCuda}
                  onChange={(e) => setRequireCuda(e.target.checked)}
                  className="mt-0.5 accent-primary-fixed w-4 h-4 flex-shrink-0"
                />
                <span>
                  <span className="font-headline-sm text-sm font-bold text-on-surface block">
                    My course or toolchain needs CUDA
                  </span>
                  <span className="font-body-md text-xs text-on-surface-variant">
                    Restricts this to NVIDIA. Leave it off and we&rsquo;ll also show Apple and AMD
                    machines, which fit far larger models but cannot run CUDA code.
                  </span>
                </span>
              </label>
            )}

            {/* Brands are read from the catalogue, never hardcoded — whatever the
                admin adds becomes both searchable and tappable here. Showing
                them stops the customer guessing at a brand we do not carry. */}
            <div>
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">
                Any particular brand?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setBrand(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                    !brand ? 'border-primary-fixed bg-primary-fixed/10 text-primary-fixed'
                           : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary-fixed/50'
                  }`}
                >
                  No preference
                </button>
                {brands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBrand(brand === b ? null : b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                      brand === b ? 'border-primary-fixed bg-primary-fixed/10 text-primary-fixed'
                                  : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary-fixed/50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <NumberField
              label={units > 1 ? 'Budget per laptop' : 'Budget'}
              value={budget}
              onCommit={setBudget}
              min={30000}
              max={600000}
              step={5000}
              prefix="₹"
              footLeft="₹30K"
              footRight="₹6L"
              note="The price on the shelf — GST included, the way a laptop is sold."
            />

            <NumberField
              label="How many?"
              value={units}
              onCommit={setUnits}
              min={1}
              max={100}
              step={1}
              note={units > 1 ? 'Identical machines. Ask us about a bulk price.' : null}
            />

            <DesignButton
              onClick={() => { setAssumed(false); launch(() => run(workloadId, budget * units, units, portability, null, requireCuda, brand)) }}
              running={stage >= 0}
              label="Find my laptop"
              runningLabel="Matching…"
            />
          </Panel>
        )}

        {mode === 'browse' && (
          <Panel
            title={`Every laptop we list (${laptops.length})`}
            hint={`${brands.join(', ')}. Tap one for the full verdict, including what it gives up.`}
          >
            <div className="space-y-2">
              {[...laptops].sort((a, b) => streetPrice(a) - streetPrice(b)).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onPick(l)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    best?.laptop?.id === l.id
                      ? 'border-primary-fixed bg-primary-fixed/10'
                      : 'border-outline-variant/30 bg-surface-container hover:border-primary-fixed/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LaptopImage laptop={l} className="rounded-lg w-16 h-10 flex-shrink-0" iconClass="!text-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline gap-3">
                        <span className="font-headline-sm text-sm font-bold text-on-surface truncate">{l.brand} {l.name}</span>
                        <span className="font-body-md text-sm text-primary-fixed tabular-nums flex-shrink-0">
                          {formatRupees(streetPrice(l))}
                        </span>
                      </div>
                      <p className="font-body-md text-xs text-on-surface-variant mt-0.5 truncate">
                        {[l.gpu_model, l.gpu_tgp_watts ? `${l.gpu_tgp_watts}W` : null, l.ram_gb ? `${l.ram_gb}GB` : null, l.weight_kg ? `${l.weight_kg}kg` : null]
                          .filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        )}
      </div>

      {/* ---------------- RIGHT: the verdict ---------------- */}
      <div ref={resultRef} className="lg:col-span-3 space-y-4 scroll-mt-24">
        {stage >= 0 && <LaunchCard stage={stage} stages={STAGES} doneLabel="Match found" runningLabel="Matching" />}

        {/* An assumption the customer can see and undo in one tap. Guessing
            silently is how you recommend an office laptop to someone who
            needed CUDA — but refusing to answer at all was worse. */}
        {stage < 0 && best && assumed && (
          <div className="bg-surface-container-high rounded-2xl border border-primary-fixed/30 p-4">
            <p className="font-body-md text-sm text-on-surface mb-3">
              You didn&rsquo;t say what it&rsquo;s for, so this is the best{' '}
              <strong>everyday</strong> machine at that budget. If it&rsquo;s for something
              specific, tap it and I&rsquo;ll match again:
            </p>
            <div className="flex flex-wrap gap-2">
              {WORKLOADS.filter((w) => w.id !== 'office').map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setWorkloadId(w.id)
                    setAssumed(false)
                    launch(() => run(w.id, brief?.budget || null, units, portability, brief?.vramHint, requireCuda, brand))
                  }}
                  className="border border-outline-variant/40 bg-surface-container text-on-surface-variant hover:border-primary-fixed/60 hover:text-on-surface px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Icon name={w.icon} className="!text-base" />
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage < 0 && best && (
          <>
            <LaptopCard
              pick={best}
              units={units}
              headline={result.chosen ? 'You picked' : 'Best match'}
              workload={workload}
              catalogue={catalogue}
              upgrades={upgrades}
              setUpgrades={setUpgrades}
              onWhatsApp={onWhatsApp}
            />
            {result.headroom && (
              <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5">
                <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-1">
                  Budget left over
                </p>
                <p className="font-body-md text-sm text-on-surface-variant">
                  That leaves {formatRupees(result.headroom.unspent)} of your budget unspent.
                  A laptop cannot absorb it the way a desktop can — there is no part to upgrade.
                  {result.headroom.next
                    ? ` The next machine up is the ${result.headroom.next.brand} ${result.headroom.next.name} at ${formatRupees(result.headroom.nextStreet)}${units > 1 ? ` each, ${formatRupees(result.headroom.nextTotal)} for ${units}` : ''} — over what you set, but worth knowing about.`
                    : ' Either keep it, or put it toward a monitor, a dock and a proper bag, which is what most people should do with it.'}
                </p>
              </div>
            )}

            {alternates.length > 0 && (
              <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5 space-y-3">
                <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">
                  Also worth a look
                </p>
                {alternates.map((p) => (
                  <AlternateRow key={p.laptop.id} pick={p} best={best} onPick={() => onPick(p.laptop)} />
                ))}
              </div>
            )}
          </>
        )}

        {stage < 0 && result && !result.ok && (
          <FailureCard result={result} />
        )}

        {stage < 0 && !result && (
          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-6 text-center">
            <Icon name="laptop_chromebook" className="!text-3xl text-on-surface-variant mb-2" />
            <p className="font-body-md text-on-surface-variant">
              Tell us what the laptop is for and we&rsquo;ll match it against what we
              actually stock — including the number no retail page shows you: how many
              watts the chassis lets the graphics card draw.
            </p>
          </div>
        )}
      </div>

      {askBudget && (
        <BudgetPrompt
          formatShort={formatShort}
          submitLabel="Find it"
          submitIcon="search"
          summary={
            <>
              We read this as{' '}
              {askBudget.brand ? <span className="text-primary-fixed font-bold">{askBudget.brand}</span> : null}
              {askBudget.brand ? ' · ' : ''}
              {askBudget.assumed
                ? <span className="italic">use not stated</span>
                : <span className="text-primary-fixed font-bold">{WORKLOAD_BY_ID[askBudget.workloadId]?.label}</span>}
              {askBulk ? ` · ${askQty} units` : ''}
            </>
          }
          explain={`There ${askPool.length === 1 ? 'is 1 machine' : `are ${askPool.length} machines`} matching that, from ${formatShort(cheapest)} to ${formatShort(dearest)}. Without a number we would just lead with the dearest one you might afford, which helps nobody — and laptop prices swing with festive offers, so the budget is what decides the machine.`}
          label={askBulk ? `Total for all ${askQty} laptops` : 'Budget'}
          min={askMin}
          presets={askBulk
            ? [askQty * 45000, askQty * 70000, askQty * 100000, askQty * 150000]
            : [50000, 80000, 125000, 200000]}
          minHint={askBulk
            ? `${askQty} of the cheapest machine here comes to ${formatShort(askMin)}.`
            : `The cheapest ${askBudget.brand ? `${askBudget.brand} ` : ''}laptop we list is ${formatShort(cheapest)}.`}
          onCancel={() => setAskBudget(null)}
          onSubmit={startFromPrompt}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function LaptopCard({ pick, units, headline, workload, catalogue, upgrades, setUpgrades, onWhatsApp }) {
  const l = pick.laptop
  const opts = upgradeOptions(l, catalogue)
  const priced = applyUpgrades(l, upgrades, { addsDrive: opts.addsDrive })
  const vsDesktop = laptopVsDesktop(priced.total)
  const ramNote = ramVsVramNote(l, workload?.id)
  const set = (key) => (e) => {
    const id = e.target.value
    const pool = key === 'ram' ? opts.ram : opts.storage
    setUpgrades((u) => ({ ...u, [key]: pool.find((c) => c.id === id) || null }))
  }

  const specs = [
    l.cpu_model      && { k: 'cpu',     label: 'Processor', value: l.cpu_model },
    l.gpu_model      && { k: 'gpu',     label: 'Graphics',  value: l.gpu_model + (l.gpu_tgp_watts ? ` @ ${l.gpu_tgp_watts}W` : '') },
    l.ram_gb         && { k: 'ram',     label: 'Memory',    value: `${l.ram_gb}GB ${l.ram_type || ''}${l.ram_upgradable === false ? ' (soldered)' : ''}` },
    l.capacity_gb    && { k: 'storage', label: 'Storage',   value: l.capacity_gb >= 1024 ? `${l.capacity_gb / 1024}TB SSD` : `${l.capacity_gb}GB SSD` },
    l.screen_size_in && { k: 'screen',  label: 'Display',   value: `${l.screen_size_in}" ${l.screen_res || ''}${l.screen_refresh_hz ? ` ${l.screen_refresh_hz}Hz` : ''}` },
    l.weight_kg      && { k: 'weight',  label: 'Weight',    value: `${l.weight_kg}kg` },
    l.battery_wh     && { k: 'battery', label: 'Battery',   value: `${l.battery_wh}Wh` },
    l.warranty_months&& { k: 'warranty',label: 'Warranty',  value: `${l.warranty_months} months` },
  ].filter(Boolean)

  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5 space-y-4">
      <LaptopImage laptop={l} className="rounded-xl aspect-[8/5] w-full" iconClass="!text-5xl" />

      <div>
        <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-1">{headline}</p>
        <div className="flex justify-between items-start gap-3">
          <h3 className="font-display-lg text-headline-sm text-on-surface">{l.brand} {l.name}</h3>
          <div className="text-right flex-shrink-0">
            <p className="font-display-lg text-headline-sm text-primary-fixed tabular-nums">{formatRupees(priced.total)}</p>
            <p className="font-body-md text-xs text-on-surface-variant">
              {priced.delta > 0 ? 'as configured, incl. GST' : 'incl. GST'}
            </p>
          </div>
        </div>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">
          {l.chassis_class ? CHASSIS_CLASSES[l.chassis_class]?.label : ''}
          {l.availability === 'order_on_demand' ? ' · ordered in for you' : ' · in stock'}
        </p>
      </div>

      {pick.over && (
        <div className="border border-amber-500/40 bg-amber-500/10 rounded-xl p-4">
          <p className="font-body-md text-sm text-amber-300">
            A little over the budget you set. It is here because nothing within it does this
            job as well — say the word and we&rsquo;ll show you the closest machine that fits instead.
          </p>
        </div>
      )}

      {/* What it runs — the capability-first line, same philosophy as the
          desktop quote, adjusted for a machine whose ceiling is fixed. */}
      {pick.capability && workload?.id === 'ai' && (
        <div className="border border-primary-fixed/30 bg-primary-fixed/5 rounded-xl p-4">
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-1">What this runs</p>
          <p className="font-body-md text-on-surface">{pick.capability.detail}</p>
        </div>
      )}

      {/* THE differentiator. No Indian retail page prints this number. */}
      {pick.tgp && (
        <div className="border border-outline-variant/30 rounded-xl p-4">
          <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-1 flex items-center gap-1.5">
            <Icon name="bolt" className="!text-base text-primary-fixed" filled />
            GPU power · {pick.tgp.headline}
          </p>
          <TgpBar band={pick.tgp.band} pct={pick.tgp.pct} />
          <p className="font-body-md text-sm text-on-surface-variant mt-2">{pick.tgp.text}</p>
          {pick.peer && (
            <p className="font-body-md text-sm text-on-surface mt-2 pt-2 border-t border-outline-variant/20">
              <span className="text-primary-fixed font-bold">Same GPU, different laptop:</span>{' '}
              the {pick.peer.laptop.brand} {pick.peer.laptop.name} runs the same {l.gpu_model} at{' '}
              {pick.peer.laptop.gpu_tgp_watts}W
              {pick.peer.gapPct ? ` — about ${pick.peer.gapPct}% ${pick.peer.laptop.gpu_tgp_watts > l.gpu_tgp_watts ? 'faster' : 'slower'}` : ''}
              {' '}at {formatRupees(pick.peer.street)}
              {pick.peer.laptop.weight_kg ? ` and ${pick.peer.laptop.weight_kg}kg` : ''}.
            </p>
          )}
        </div>
      )}

      {pick.platform && (
        <div className="border border-amber-500/40 bg-amber-500/10 rounded-xl p-4">
          <p className="font-label-mono text-label-mono text-amber-300 uppercase mb-1">{pick.platform.headline}</p>
          <p className="font-body-md text-sm text-on-surface-variant">{pick.platform.text}</p>
        </div>
      )}

      {pick.sustained && (
        <div className="border border-outline-variant/30 rounded-xl p-4">
          <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-1">{pick.sustained.headline}</p>
          <p className="font-body-md text-sm text-on-surface-variant">{pick.sustained.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        {specs.map((s) => (
          <div key={s.k} className="flex items-start gap-2.5 py-2 border-b border-outline-variant/10">
            <Icon name={SPEC_ICON[s.k]} className="!text-base text-on-surface-variant mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-label-mono text-xs text-on-surface-variant uppercase">{s.label}</p>
              <p className="font-body-md text-sm text-on-surface break-words">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {Array.isArray(l.specs) && l.specs.length > 0 && (
        <div>
          <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">The fine print</p>
          <div className="space-y-2">
            {l.specs.filter((sp) => sp?.label && sp?.value).map((sp) => (
              <div key={sp.label} className="sm:flex sm:gap-3">
                <p className="font-label-mono text-xs text-on-surface-variant uppercase sm:w-28 sm:flex-shrink-0">{sp.label}</p>
                <p className="font-body-md text-sm text-on-surface-variant sm:flex-1">{sp.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {pick.tradeoffs?.length > 0 && (
        <div>
          <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">What you give up</p>
          <div className="space-y-2">
            {pick.tradeoffs.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Icon name={t.icon} className="!text-base text-on-surface-variant mt-0.5 flex-shrink-0" />
                <p className="font-body-md text-sm text-on-surface-variant">{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What can be changed, and — far more often — what cannot. */}
      <div className="border border-outline-variant/30 rounded-xl p-4 space-y-3">
        <p className="font-label-mono text-label-mono text-primary-fixed uppercase flex items-center gap-1.5">
          <Icon name="build" className="!text-base" filled />
          Make it yours
        </p>

        {opts.ram.length > 0 ? (
          <div>
            <label className="font-label-mono text-xs text-on-surface-variant uppercase block mb-1.5">
              Memory — fitted with {l.ram_gb}GB, takes {l.max_ram_gb}GB
            </label>
            <select
              value={upgrades.ram?.id || ''}
              onChange={set('ram')}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2.5 font-body-md text-sm text-on-surface focus:border-primary-fixed focus:outline-none [color-scheme:dark]"
            >
              <option value="">Keep {l.ram_gb}GB — no change</option>
              {opts.ram.map((c) => (
                <option key={c.id} value={c.id}>
                  Upgrade to {c.capacity_gb}GB · +{formatRupees(streetPrice(c))}
                </option>
              ))}
            </select>
          </div>
        ) : opts.ramBlockedBecause ? (
          <p className="font-body-md text-sm text-amber-300">{opts.ramBlockedBecause}</p>
        ) : null}

        {opts.storage.length > 0 ? (
          <div>
            <label className="font-label-mono text-xs text-on-surface-variant uppercase block mb-1.5">
              Storage — {opts.addsDrive ? 'spare M.2 bay, so this adds to it' : 'one M.2 bay, so this replaces it'}
            </label>
            <select
              value={upgrades.storage?.id || ''}
              onChange={set('storage')}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2.5 font-body-md text-sm text-on-surface focus:border-primary-fixed focus:outline-none [color-scheme:dark]"
            >
              <option value="">Keep the drive it ships with — no change</option>
              {opts.storage.map((c) => (
                <option key={c.id} value={c.id}>
                  {opts.addsDrive ? 'Add' : 'Replace with'} {c.brand} {c.name.split(' (')[0]} · +{formatRupees(streetPrice(c))}
                </option>
              ))}
            </select>
          </div>
        ) : opts.storageBlockedBecause ? (
          <p className="font-body-md text-sm text-amber-300">{opts.storageBlockedBecause}</p>
        ) : null}

        {ramNote && <p className="font-body-md text-xs text-on-surface-variant">{ramNote}</p>}

        {priced.lines.map((line) => (
          <div key={line.key} className="border-t border-outline-variant/20 pt-2">
            <div className="flex justify-between items-baseline gap-3">
              <span className="font-body-md text-sm text-on-surface">
                {line.label}: {line.from} → <strong className="text-primary-fixed">{line.to}</strong>
              </span>
              <span className="font-body-md text-sm text-on-surface-variant tabular-nums flex-shrink-0">
                +{formatRupees(line.price)}
              </span>
            </div>
            <p className="font-body-md text-xs text-on-surface-variant mt-0.5">{line.note}</p>
          </div>
        ))}

        {/* The honest half. Printed whether or not anything above was offered,
            because it is the real difference from the desktop they were
            weighing this against. */}
        <div className="border-t border-outline-variant/20 pt-3">
          <p className="font-label-mono text-xs text-on-surface-variant uppercase mb-2">
            And what can never be changed
          </p>
          <div className="space-y-1.5">
            {FIXED_FOREVER.map((f) => (
              <div key={f.label} className="flex items-start gap-2.5">
                <Icon name={f.icon} className="!text-base text-on-surface-variant mt-0.5 flex-shrink-0 opacity-60" />
                <p className="font-body-md text-xs text-on-surface-variant">
                  <strong className="text-on-surface">{f.label}.</strong> {f.why}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {vsDesktop && (
        <div className="border border-outline-variant/30 rounded-xl p-4">
          <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-1">{vsDesktop.headline}</p>
          <p className="font-body-md text-sm text-on-surface-variant">{vsDesktop.text}</p>
        </div>
      )}

      {(units > 1 || priced.delta > 0) && (
        <div className="border-t border-outline-variant/20 pt-3 space-y-1">
          <Row label="Laptop" value={formatRupees(priced.base)} />
          {priced.lines.map((line) => (
            <Row key={line.key} label={line.label} value={`+${formatRupees(line.price)}`} />
          ))}
          {units > 1 && <Row label="Per laptop, as configured" value={formatRupees(priced.total)} />}
          <Row
            label={units > 1 ? `× ${units}` : 'Total'}
            value={formatRupees(priced.total * units)}
            bold
          />
          <p className="font-body-md text-xs text-on-surface-variant pt-1">
            GST included{units > 1 ? '. Ask us about a bulk price at this quantity.' : '.'}
          </p>
        </div>
      )}

      <div className="border border-outline-variant/30 rounded-xl p-3">
        <p className="font-body-md text-xs text-on-surface-variant">
          Laptop pricing swings with festive offers and bank cashback. This is an
          indicative quote — we confirm today&rsquo;s price before you commit.
        </p>
      </div>

      <button
        type="button"
        onClick={onWhatsApp}
        className="w-full bg-primary-fixed text-on-primary-fixed px-6 py-4 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow"
      >
        <Icon name="chat" className="!text-xl" />
        Send this to us on WhatsApp
      </button>
    </div>
  )
}

// A drawn chassis illustration, not a product photo — see the note in
// sql/010_laptops.sql. Falls back to an icon so a machine the owner added
// without an image still renders as a laptop rather than a broken tile.
function LaptopImage({ laptop, className = '', iconClass = '!text-2xl' }) {
  return (
    <div className={`bg-surface-container border border-outline-variant/20 overflow-hidden flex items-center justify-center ${className}`}>
      {laptop.image_url ? (
        <img
          src={laptop.image_url}
          alt={`${laptop.brand} ${laptop.name}`}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : (
        <Icon name="laptop_windows" className={`${iconClass} text-on-surface-variant opacity-40`} />
      )}
    </div>
  )
}

function TgpBar({ band, pct }) {
  const colour = band === 'full' || band === 'strong' ? 'bg-primary-fixed' : 'bg-amber-400'
  return (
    <div className="h-1.5 rounded-full bg-outline-variant/20 overflow-hidden">
      <div className={`h-full ${colour}`} style={{ width: `${Math.round((pct ?? 1) * 100)}%` }} />
    </div>
  )
}

// Why you might take this one instead — stated as the actual difference from
// the recommendation, not as a second sales pitch.
function AlternateRow({ pick, best, onPick }) {
  const l = pick.laptop
  const b = best.laptop
  const diffs = []
  const dw = (Number(l.weight_kg) || 0) - (Number(b.weight_kg) || 0)
  if (Math.abs(dw) >= 0.25) diffs.push(dw < 0 ? `${Math.abs(dw).toFixed(2)}kg lighter` : `${dw.toFixed(2)}kg heavier`)
  const dp = pick.street - best.street
  if (Math.abs(dp) >= 5000) diffs.push(dp < 0 ? `${formatShort(Math.abs(dp))} cheaper` : `${formatShort(dp)} dearer`)
  if ((Number(l.vram_gb) || 0) !== (Number(b.vram_gb) || 0)) diffs.push(`${l.vram_gb || 0}GB VRAM`)
  if (l.gpu_tgp_watts && b.gpu_tgp_watts && l.gpu_tgp_watts !== b.gpu_tgp_watts) diffs.push(`${l.gpu_tgp_watts}W GPU`)

  return (
    <button
      type="button"
      onClick={onPick}
      className="w-full text-left p-3 rounded-xl border border-outline-variant/30 bg-surface-container hover:border-primary-fixed/50 transition-all"
    >
      <div className="flex items-center gap-3">
        <LaptopImage laptop={l} className="rounded-lg w-16 h-10 flex-shrink-0" iconClass="!text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-baseline gap-3">
            <span className="font-headline-sm text-sm font-bold text-on-surface truncate">{l.brand} {l.name}</span>
            <span className="font-body-md text-sm text-primary-fixed tabular-nums flex-shrink-0">{formatRupees(pick.street)}</span>
          </div>
          <p className="font-body-md text-xs text-on-surface-variant mt-0.5 truncate">
            {diffs.length ? diffs.join(' · ') : (l.gpu_model || l.cpu_model)}
          </p>
        </div>
      </div>
    </button>
  )
}

// The honest answers. Each one names the physical limit and offers the real
// alternative rather than shrugging — a laptop that cannot do the job is a fact
// about laptops, and the customer is better served hearing it here than after
// they have paid.
function FailureCard({ result }) {
  if (result.reason === 'vram_ceiling') {
    const b = result.bestLaptop
    return (
      <div className="bg-surface-container-high rounded-2xl border border-amber-500/40 p-5 space-y-3">
        <p className="font-label-mono text-label-mono text-amber-300 uppercase flex items-center gap-1.5">
          <Icon name="block" className="!text-base" filled /> No laptop reaches that
        </p>
        <p className="font-body-md text-on-surface">
          That needs {result.minVram}GB reachable by the GPU. The most any laptop manages is{' '}
          {result.ceiling}GB, and only on a unified-memory machine — a dedicated laptop
          graphics card stops at 24GB whatever you pay. A desktop card goes to 96GB, and a
          tower will take more than one.
        </p>
        <p className="font-body-md text-sm text-on-surface-variant">
          The closest is the <strong className="text-on-surface">{b.brand} {b.name}</strong> at{' '}
          {b.vram_gb}GB ({formatRupees(streetPrice(b))}). If the model size is
          non-negotiable, the honest answer is a desktop — switch to Desktop above, or talk to
          us about a laptop for development plus a shared machine for the heavy runs.
        </p>
      </div>
    )
  }

  if (result.reason === 'over_budget') {
    const c = result.cheapest
    const alt = result.bestWithinBudget
    return (
      <div className="bg-surface-container-high rounded-2xl border border-amber-500/40 p-5 space-y-3">
        <p className="font-label-mono text-label-mono text-amber-300 uppercase">Above the budget you set</p>
        <p className="font-body-md text-on-surface">
          The cheapest {result.brand ? `${result.brand} ` : ''}laptop we list for this is the{' '}
          <strong>{c.brand} {c.name}</strong> at {formatRupees(result.cheapestStreet)} incl. GST —{' '}
          {formatRupees(result.gap)} more than {formatRupees(Math.round(result.perUnitBudget))}
          {result.units > 1 ? ' per unit' : ''}.
        </p>
        {/* Asking for a brand should not cost you an answer. */}
        {result.brand && result.cheapestAnyBrand && (
          <p className="font-body-md text-sm text-on-surface-variant">
            Dropping the {result.brand} requirement, the best machine inside{' '}
            {formatRupees(Math.round(result.perUnitBudget))} is the{' '}
            <strong className="text-on-surface">{result.cheapestAnyBrand.brand} {result.cheapestAnyBrand.name}</strong>{' '}
            at {formatRupees(result.cheapestAnyBrandStreet)}.
          </p>
        )}
        {/* When a VRAM floor is what pushed the price up, the lever is the
            model size, not the graphics card — so that is what we offer. */}
        {result.minVram && alt ? (
          <p className="font-body-md text-sm text-on-surface-variant">
            It is the {result.minVram}GB memory requirement doing this, not the rest of the
            machine. Within your budget the most memory you can get is{' '}
            <strong className="text-on-surface">{alt.brand} {alt.name}</strong> at {alt.vram_gb}GB
            ({formatRupees(result.bestWithinBudgetStreet)}) — a real machine for a smaller model.
            Drop a model size and you are comfortably inside the budget.
          </p>
        ) : (
          <p className="font-body-md text-sm text-on-surface-variant">
            Unlike a desktop there is no cheaper way to assemble it — a laptop costs what it
            costs. Either stretch to that figure, or tell us what you can drop (the discrete
            graphics card is usually the expensive part) and we&rsquo;ll find something honest.
          </p>
        )}
      </div>
    )
  }

  if (result.reason === 'brand_unavailable') {
    return (
      <div className="bg-surface-container-high rounded-2xl border border-amber-500/40 p-5 space-y-3">
        <p className="font-label-mono text-label-mono text-amber-300 uppercase">
          We don&rsquo;t list {result.brand} yet
        </p>
        <p className="font-body-md text-on-surface">
          Nothing from {result.brand} is in our catalogue at the moment. We list{' '}
          {result.brands.join(', ')}.
        </p>
        <p className="font-body-md text-sm text-on-surface-variant">
          That is a gap in our stock, not a verdict on the brand — tell us the model you had in
          mind and we&rsquo;ll source it and quote it properly.
        </p>
      </div>
    )
  }

  if (result.reason === 'no_ai_platform') {
    return (
      <div className="bg-surface-container-high rounded-2xl border border-amber-500/40 p-5 space-y-3">
        <p className="font-label-mono text-label-mono text-amber-300 uppercase">Nothing here runs local AI</p>
        <p className="font-body-md text-on-surface">
          {result.requireCuda
            ? 'Nothing matching this brief is an NVIDIA machine, and you told us CUDA is required. Untick that and there are Apple and AMD laptops that fit far larger models — or talk to us and we will source an NVIDIA one.'
            : 'None of the laptops matching this brief have any GPU-addressable memory, so local models cannot run on them at any speed. Talk to us — we will source a machine that can, rather than sell you one that cannot.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-6 text-center">
      <Icon name="info" className="!text-3xl text-on-surface-variant mb-2" />
      <p className="font-body-md text-on-surface-variant">
        Nothing in stock matches that yet — talk to us and we&rsquo;ll source it.
      </p>
    </div>
  )
}
