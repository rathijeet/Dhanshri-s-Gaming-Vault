import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { WORKLOADS, CORE_TYPES } from './profiles'
import { designLab, designSystem, finaliseBuild, isUsable } from './engine'
import { validateBuild } from './compatibility'
import { parseIntent } from './intent'
import { fetchCatalogue, formatRupees, formatShort } from './publicSystemHelpers'
import { BUSINESS_NAME, WHATSAPP_NUMBER } from '../config'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import SystemTestDrive from './SystemTestDrive'

const MODES = [
  { id: 'describe', label: 'Describe it',   icon: 'auto_awesome', hint: 'Tell us in your own words' },
  { id: 'budget',   label: 'By budget',     icon: 'payments',     hint: 'Pick a use and a number' },
  { id: 'manual',   label: 'Build it myself', icon: 'tune',       hint: 'Choose every part' },
]

const RGB_PRESETS = [
  { id: 'mint',   color: '#56ffa8', label: 'Mint' },
  { id: 'cyan',   color: '#3ad2ff', label: 'Cyan' },
  { id: 'violet', color: '#a97bff', label: 'Violet' },
  { id: 'amber',  color: '#ffb44d', label: 'Amber' },
  { id: 'red',    color: '#ff5d6c', label: 'Crimson' },
  { id: 'white',  color: '#eaf4ff', label: 'White' },
]

const PART_ORDER = ['gpu', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'cooler', 'case', 'os', 'monitor', 'peripheral', 'network']

// The design itself is instant — it is local arithmetic over the catalogue.
// Firing the result onto the page with no beat in between reads as "nothing
// happened", so the launch plays out the four checks the engine actually runs
// and lands the customer on the finished build.
const LAUNCH_STAGES = [
  { label: 'Reading your brief',        icon: 'auto_awesome' },
  { label: 'Matching parts to the job', icon: 'memory' },
  { label: 'Checking every clearance',  icon: 'rule' },
  { label: "Pricing at today's rates",  icon: 'payments' },
]
const STAGE_MS = 430
const LIFTOFF_MS = 620

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const EXAMPLES = [
  'I want to run Llama 70B locally',
  'AI lab for 30 students in our college',
  'Gaming PC for Cyberpunk at 1440p, 1.5 lakh',
  '4K video editing system, around 2 lakh',
  'School computer lab, 25 machines, 12 lakh',
]

export default function SystemBuilderPage() {
  const [catalogue, setCatalogue] = useState([])
  const [loading, setLoading]     = useState(true)
  const [loadError, setLoadError] = useState('')

  const [mode, setMode]       = useState('describe')
  const [text, setText]       = useState('')
  // -1 idle, 0..n-1 running a stage, n lifting off
  const [stage, setStage] = useState(-1)
  const [brief, setBrief]     = useState(null)

  const [workloadId, setWorkloadId] = useState('ai')
  const [budget, setBudget]   = useState(400000)
  const [seats, setSeats]     = useState(1)

  const [manual, setManual]   = useState({})
  const [result, setResult]   = useState(null)
  const [rgb, setRgb]         = useState('#56ffa8')
  const [testOpen, setTestOpen] = useState(false)
  const [askBudget, setAskBudget] = useState(null)   // the brief waiting on a number
  const resultRef = useRef(null)
  const aliveRef  = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => { aliveRef.current = false }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await fetchCatalogue()
        if (!cancelled) setCatalogue(rows)
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Could not load the parts catalogue')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const usable = useMemo(() => catalogue.filter(isUsable), [catalogue])

  const byType = useMemo(() => {
    const map = {}
    for (const c of usable) (map[c.type] ||= []).push(c)
    for (const list of Object.values(map)) {
      list.sort((a, b) => Number(a.current_price) - Number(b.current_price))
    }
    return map
  }, [usable])

  const runDesign = useCallback((wl, bud, st, minVram = null) => {
    if (!usable.length) return
    // More than one seat is a lab, and a lab budget is the whole project, not
    // each desk — designLab carries that distinction.
    const res = st > 1
      ? designLab({ catalogue: usable, workloadId: wl, totalBudget: bud, seats: st, minVram })
      : designSystem({ catalogue: usable, workloadId: wl, budget: bud, seats: st, minVram })
    setResult(res)
    if (res.ok) setManual(res.seat ? res.seat.build : res.build)
  }, [usable])

  // ---- describe mode ----
  // Parsing is local and instant, so the brief is read BEFORE the launch plays.
  // That matters: if there is no budget in it we have to stop and ask, and
  // interrupting a launch that has already started reads as a failure.
  const onDescribe = async () => {
    if (!text.trim() || !usable.length || stage >= 0) return
    setBrief(null)
    setResult(null)
    setAskBudget(null)

    const parsed = await parseIntent(text)
    if (!aliveRef.current) return
    setBrief(parsed)
    // Nothing to price if we could not tell what the machine is for — the
    // panel under the box explains that case on its own.
    if (!parsed.workloadId) return

    if (parsed.budget) {
      startFromBrief(parsed, parsed.budget)
    } else {
      // No number, no design. A build priced against a budget nobody set is a
      // guess dressed up as a quote, and it wastes the customer's time.
      setAskBudget(parsed)
    }
  }

  // Every mode designs the same way: press the button, watch the checks run,
  // land on the build. `run` is whatever that mode means by "design".
  const startFromBrief = (parsed, bud) => {
    setWorkloadId(parsed.workloadId)
    setBudget(bud)
    setSeats(parsed.seats)
    launch(() => runDesign(parsed.workloadId, bud, parsed.seats, parsed.vramHint))
  }

  const launch = async (run) => {
    setAskBudget(null)
    setStage(0)

    for (let i = 1; i < LAUNCH_STAGES.length; i++) {
      await wait(STAGE_MS)
      if (!aliveRef.current) return
      setStage(i)
    }

    try {
      run()
    } finally {
      if (aliveRef.current) {
        setStage(LAUNCH_STAGES.length)
        await wait(LIFTOFF_MS)
        if (aliveRef.current) setStage(-1)
      }
    }
    // On a phone the whole build is below the fold, so the payoff has to be
    // brought to the customer rather than left for them to find.
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    )
  }

  // ---- manual mode ----
  const setPart = (type, id) => {
    const part = (byType[type] || []).find((c) => c.id === id)
    const next = { ...manual }
    if (part) next[type] = part
    else delete next[type]
    setManual(next)
    // The quote was priced against the old parts, so it is no longer true.
    // Compatibility still updates live below; only the price waits for the
    // button.
    setResult(null)
  }

  const isLab = !!result?.ok && !!result.seat
  const build = result?.ok ? (result.seat ? result.seat.build : result.build) : manual
  // While picking parts by hand the warnings have to keep up with the dropdowns
  // rather than wait for a design that has not been asked for yet.
  const manualIssues = useMemo(() => validateBuild(manual).issues, [manual])
  const issues = mode === 'manual'
    ? manualIssues
    : (result?.seat?.validation || result?.validation)?.issues || []
  const manualReady = CORE_TYPES.every((t) => manual[t])

  const onWhatsApp = () => {
    if (!result?.ok) return
    const partLines = (b, label) => [
      label ? `*${label}*` : null,
      ...PART_ORDER.filter((t) => b[t]).map(
        (t) => `• ${b[t].brand} ${b[t].name} — ${formatRupees(Number(b[t].current_price))}`
      ),
    ]
    const lines = result.seat
      ? [
          `Hi ${BUSINESS_NAME}! I designed a lab on your site.`,
          '',
          `*Use case:* ${result.workload.label}`,
          `*Seats:* ${result.seats}`,
          result.note ? `*Approach:* ${result.note.headline}` : null,
          '',
          ...partLines(result.seat.build, `Each workstation — ${formatRupees(result.perSeat)}`),
          ...(result.node ? ['', ...partLines(result.node.build, `Shared GPU node — ${formatRupees(result.nodeCost)}`)] : []),
          '',
          `*${result.seats} workstations:* ${formatRupees(result.seatsSubtotal)}`,
          result.node ? `*Shared node:* ${formatRupees(result.nodeCost)}` : null,
          `*GST:* ${formatRupees(result.gstTotal)}`,
          `*Total:* ${formatRupees(result.total)}`,
          '',
          'Please confirm availability and current pricing.',
        ]
      : [
          `Hi ${BUSINESS_NAME}! I designed a system on your site.`,
          '',
          `*Use case:* ${result.workload.label}`,
          result.capability ? `*Capability:* ${result.capability.detail}` : null,
          '',
          ...partLines(build, null),
          '',
          `*Subtotal:* ${formatRupees(result.perSystem)}`,
          `*GST:* ${formatRupees(result.gstTotal)}`,
          `*Total:* ${formatRupees(result.total)}`,
          '',
          'Please confirm availability and current pricing.',
        ]
    const body = lines.filter((l) => l !== null)
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(body.join('\n'))}`,
      '_blank', 'noopener,noreferrer'
    )
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <header className="border-b border-outline-variant/20 bg-surface-container-high sticky top-0 z-30">
        <div className="max-w-container-max mx-auto flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
          </Link>
          <Link
            to="/"
            className="border border-outline-variant/40 text-on-surface-variant hover:border-primary-fixed/50 hover:text-on-surface px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
          >
            <Icon name="arrow_back" className="!text-base" />
            <span className="hidden sm:inline">Back to site</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-container-max w-full mx-auto px-margin-mobile md:px-margin-desktop py-8">
        {/* HERO */}
        <div className="mb-8">
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-2">
            Design your own system
          </p>
          <h1 className="font-display-lg text-display-lg-mobile md:text-headline-md text-on-surface mb-3">
            Build a PC, workstation or AI lab
          </h1>
          <p className="font-body-md text-body-lg text-on-surface-variant max-w-2xl">
            Describe what you need in plain words, set a budget, or pick every part yourself.
            We design it, check that everything fits, and price it from real components — then
            you can walk around the finished machine in 3D and watch it run.
          </p>
        </div>

        {/* MODE TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {MODES.map((m) => {
            const active = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                  active
                    ? 'border-primary-fixed bg-primary-fixed/10 text-primary-fixed'
                    : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary-fixed/50'
                }`}
              >
                <Icon name={m.icon} className="!text-xl" />
                <span className="text-left">
                  <span className="font-headline-sm text-sm font-bold block">{m.label}</span>
                  <span className="font-body-md text-xs opacity-70 hidden sm:block">{m.hint}</span>
                </span>
              </button>
            )
          })}
        </div>

        {loadError ? (
          <div className="bg-error-container/20 border border-error/40 rounded-2xl p-6 flex gap-3">
            <Icon name="error" className="text-error !text-2xl" filled />
            <p className="font-body-md text-sm text-error">{loadError}</p>
          </div>
        ) : loading ? (
          <p className="font-body-md text-on-surface-variant">Loading the parts catalogue…</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ---------------- LEFT: controls ---------------- */}
            <div className="lg:col-span-2 space-y-6">
              {mode === 'describe' && (
                <Panel title="What do you need?">
                  <textarea
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="e.g. I want to run Llama 70B locally, budget around 5 lakh"
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
                  <DesignButton onClick={onDescribe} disabled={!text.trim()} running={stage >= 0} />

                  {brief && !brief.understood && (
                    <div className="border border-amber-500/40 bg-amber-500/10 rounded-xl p-4">
                      <p className="font-body-md text-sm text-amber-300">
                        I couldn&rsquo;t tell what this machine is for. Try mentioning what
                        you&rsquo;ll do with it — gaming, AI, video editing or office work —
                        or use <button type="button" onClick={() => setMode('budget')} className="underline font-bold">By budget</button>.
                      </p>
                    </div>
                  )}
                  {brief?.understood && (
                    <p className="font-body-md text-xs text-on-surface-variant">
                      Read as: <span className="text-primary-fixed font-bold">
                        {WORKLOADS.find((w) => w.id === brief.workloadId)?.label}
                      </span>
                      {brief.budget ? ` · ${formatShort(brief.budget)}` : ' · no budget stated'}
                      {brief.seats > 1 ? ` · ${brief.seats} seats` : ''}
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
                            active
                              ? 'border-primary-fixed bg-primary-fixed/10'
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

                  {/* Slider to explore, box to state a figure. Anyone who
                      arrives knowing their number should not have to drag for
                      it — and a lab budget rarely lands on a slider step. */}
                  <NumberField
                    label={seats > 1 ? 'Total project budget' : 'Budget'}
                    value={budget}
                    onCommit={setBudget}
                    min={20000}
                    max={seats > 1 ? 5000000 : 2000000}
                    step={seats > 1 ? 25000 : 5000}
                    prefix="₹"
                    footLeft="₹20K"
                    footRight={seats > 1 ? '₹50L' : '₹20L'}
                  />

                  <NumberField
                    label="How many identical systems?"
                    value={seats}
                    onCommit={setSeats}
                    min={1}
                    max={60}
                    step={1}
                    note={seats > 1
                      ? 'The budget above is for the whole lab, including GST.'
                      : 'More than one turns this into a lab quote.'}
                  />

                  <DesignButton
                    onClick={() => launch(() => runDesign(workloadId, budget, seats))}
                    running={stage >= 0}
                    label={seats > 1 ? 'Design my lab' : 'Design my system'}
                  />
                </Panel>
              )}

              {mode === 'manual' && (
                <Panel title="Pick your parts" hint="Anything incompatible is called out live on the right.">
                  {PART_ORDER.filter((t) => byType[t]?.length).map((type) => (
                    <div key={type}>
                      <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-1.5">
                        {type === 'case' ? 'Cabinet' : type === 'os' ? 'Operating system' : type}
                        {CORE_TYPES.includes(type) && <span className="text-primary-fixed"> *</span>}
                      </label>
                      <select
                        value={manual[type]?.id || ''}
                        onChange={(e) => setPart(type, e.target.value)}
                        className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2.5 font-body-md text-sm text-on-surface focus:border-primary-fixed focus:outline-none [color-scheme:dark]"
                      >
                        <option value="">— none —</option>
                        {byType[type].map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.brand} {c.name} · {formatRupees(Number(c.current_price))}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  <DesignButton
                    onClick={() => launch(() => setResult(finaliseBuild({
                      build: manual,
                      workload: WORKLOADS.find((w) => w.id === workloadId),
                      seats,
                    })))}
                    disabled={!manualReady}
                    running={stage >= 0}
                    label="Price this build"
                  />
                  {!manualReady && (
                    <p className="font-body-md text-xs text-on-surface-variant -mt-2">
                      Still needed: {CORE_TYPES.filter((t) => !manual[t])
                        .map((t) => (t === 'case' ? 'cabinet' : t)).join(', ')}.
                    </p>
                  )}
                </Panel>
              )}

              {/* lighting */}
              <Panel title="Lighting">
                <div className="flex flex-wrap gap-2">
                  {RGB_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setRgb(p.color)}
                      aria-label={p.label}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        rgb === p.color ? 'border-primary-fixed scale-110' : 'border-outline-variant/30 hover:scale-105'
                      }`}
                      style={{ background: p.color }}
                    />
                  ))}
                </div>
              </Panel>
            </div>

            {/* ---------------- RIGHT: the build ---------------- */}
            {/* The 3D machine is not here: a thumbnail of a room is worth
                nothing next to the full-screen test drive, and it pushed the
                parts list — the thing customers came to read — off the fold. */}
            <div ref={resultRef} className="lg:col-span-3 space-y-4 scroll-mt-24">
              {stage >= 0 && <LaunchCard stage={stage} />}

              {stage < 0 && issues.length > 0 && (
                <div className="bg-error-container/20 border border-error/40 rounded-2xl p-4 space-y-2">
                  <p className="font-headline-sm text-sm font-bold text-error flex items-center gap-2">
                    <Icon name="error" className="!text-lg" filled />
                    {issues.length} thing{issues.length > 1 ? 's' : ''} won&rsquo;t work
                  </p>
                  {issues.map((i) => (
                    <p key={i.rule} className="font-body-md text-sm text-error">• {i.message}</p>
                  ))}
                </div>
              )}

              {stage < 0 && result?.ok && (isLab ? (
                <LabSummaryPanel result={result} build={build} onWhatsApp={onWhatsApp} onTest={() => setTestOpen(true)} />
              ) : (
                <SummaryPanel result={result} build={build} seats={seats} onWhatsApp={onWhatsApp} onTest={() => setTestOpen(true)} />
              ))}

              {stage < 0 && result && !result.ok && (
                <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-6 text-center">
                  <Icon name="info" className="!text-3xl text-on-surface-variant mb-2" />
                  <p className="font-body-md text-on-surface-variant">
                    {result.reason === 'vram_unavailable'
                      ? `That needs a GPU with at least ${result.minVram}GB of VRAM to run properly. The largest we currently list is ${result.bestVram}GB — talk to us and we'll source the right card rather than sell you one that can't do the job.`
                      : result.reason === 'catalogue_incomplete'
                      ? `We don't currently stock every part needed for this (missing: ${result.missingTypes.join(', ')}). Talk to us and we'll source it.`
                      : 'No compatible combination in the catalogue for that brief yet — talk to us and we\'ll source it.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {askBudget && (
        <BudgetPrompt
          brief={askBudget}
          onCancel={() => setAskBudget(null)}
          onSubmit={(amount) => startFromBrief(askBudget, amount)}
        />
      )}

      <SystemTestDrive
        open={testOpen}
        onClose={() => setTestOpen(false)}
        build={build}
        rgbColor={rgb}
        result={result?.ok ? result : null}
        seats={result?.seats || seats}
        initialScene={workloadId}
      />
    </div>
  )
}

function Panel({ title, hint, children }) {
  return (
    <section className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5 space-y-4">
      <div>
        <h2 className="font-headline-sm text-body-lg font-bold text-on-surface">{title}</h2>
        {hint && <p className="font-body-md text-xs text-on-surface-variant mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function SummaryPanel({ result, build, seats, onWhatsApp, onTest }) {
  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5 space-y-4">
      {result.note && (
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4">
          <p className="font-label-mono text-label-mono text-amber-300 uppercase mb-1">
            {result.note.headline}
          </p>
          <p className="font-body-md text-sm text-on-surface-variant">{result.note.text}</p>
        </div>
      )}

      {result.capability && (
        <div className="border border-primary-fixed/30 bg-primary-fixed/5 rounded-xl p-4">
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-1">What this runs</p>
          <p className="font-body-md text-on-surface">{result.capability.detail}</p>
        </div>
      )}

      {result.overBudget && (
        <div className="border border-amber-500/40 bg-amber-500/10 rounded-xl p-4">
          <p className="font-body-md text-sm text-amber-300">
            At today&rsquo;s component prices the cheapest working build for this comes to{' '}
            <strong>{formatRupees(result.floorCost)}</strong> before GST — above the budget you set.
            This is that entry build.
          </p>
        </div>
      )}

      <div className="space-y-1">
        {PART_ORDER.filter((t) => build[t]).map((t) => (
          <PartRow key={t} type={t} part={build[t]} />
        ))}
      </div>

      <div className="border-t border-outline-variant/20 pt-3 space-y-1">
        <Row label={seats > 1 ? 'Per system' : 'Subtotal'} value={formatRupees(result.perSystem)} />
        {seats > 1 && <Row label={`× ${seats} systems`} value={formatRupees(result.subtotal)} />}
        <Row label="GST" value={formatRupees(result.gstTotal)} />
        <Row label="Total" value={formatRupees(result.total)} bold />
        <p className="font-body-md text-xs text-on-surface-variant pt-1">
          Power draw {result.draw}W · recommended supply {result.recommendedPsu}W
        </p>
      </div>

      <div className="border border-outline-variant/30 rounded-xl p-3">
        <p className="font-body-md text-xs text-on-surface-variant">
          Component prices move weekly in the Indian market. This is an indicative
          quote — we confirm current pricing before you commit.
        </p>
      </div>

      <button
        type="button"
        onClick={onTest}
        className="w-full border-2 border-primary-fixed/50 text-primary-fixed px-6 py-3.5 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:bg-primary-fixed/10 transition-colors"
      >
        <Icon name="play_circle" className="!text-xl" />
        Test this system
      </button>

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

function LabSummaryPanel({ result, build, onWhatsApp, onTest }) {
  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5 space-y-4">
      {result.note && (
        <div className={`rounded-xl p-4 border ${
          result.overBudget ? 'border-amber-500/40 bg-amber-500/10' : 'border-primary-fixed/30 bg-primary-fixed/5'
        }`}>
          <p className={`font-label-mono text-label-mono uppercase mb-1 ${
            result.overBudget ? 'text-amber-300' : 'text-primary-fixed'
          }`}>
            {result.note.headline}
          </p>
          <p className="font-body-md text-sm text-on-surface-variant">{result.note.text}</p>
        </div>
      )}

      <div>
        <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">
          Each workstation · {formatRupees(result.perSeat)}
        </p>
        <div className="space-y-1">
          {PART_ORDER.filter((t) => build[t]).map((t) => (
            <PartRow key={t} type={t} part={build[t]} />
          ))}
        </div>
      </div>

      {result.node && (
        <div>
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-2">
            Shared GPU node · {formatRupees(result.nodeCost)}
          </p>
          {result.node.capability && (
            <p className="font-body-md text-sm text-on-surface mb-2">{result.node.capability.detail}</p>
          )}
          <div className="space-y-1">
            {PART_ORDER.filter((t) => result.node.build[t]).map((t) => (
              <PartRow key={t} type={t} part={result.node.build[t]} />
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-outline-variant/20 pt-3 space-y-1">
        <Row label={`${result.seats} workstations`} value={formatRupees(result.seatsSubtotal)} />
        {result.node && <Row label="Shared node" value={formatRupees(result.nodeCost)} />}
        <Row label="GST" value={formatRupees(result.gstTotal)} />
        <Row label="Total" value={formatRupees(result.total)} bold />
        {result.totalBudget && (
          <p className={`font-body-md text-xs pt-1 ${result.overBudget ? 'text-amber-300' : 'text-on-surface-variant'}`}>
            {result.overBudget
              ? `${formatRupees(result.total - result.totalBudget)} above the ${formatRupees(result.totalBudget)} you set.`
              : `Within the ${formatRupees(result.totalBudget)} you set.`}
          </p>
        )}
      </div>

      <div className="border border-outline-variant/30 rounded-xl p-3">
        <p className="font-body-md text-xs text-on-surface-variant">
          Component prices move weekly in the Indian market. This is an indicative
          quote — we confirm current pricing before you commit.
        </p>
      </div>

      <button
        type="button"
        onClick={onTest}
        className="w-full border-2 border-primary-fixed/50 text-primary-fixed px-6 py-3.5 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:bg-primary-fixed/10 transition-colors"
      >
        <Icon name="play_circle" className="!text-xl" />
        Test a workstation
      </button>

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

// One button, one meaning, in all three modes: this is where a build gets
// designed. Leaving budget mode to re-design itself on every slider tick meant
// there was nothing to press and no moment where anything happened.
function DesignButton({ onClick, disabled, running, label = 'Design my system' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || running}
      className="w-full bg-primary-fixed text-on-primary-fixed px-6 py-3.5 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow disabled:opacity-50 disabled:hover:scale-100"
    >
      <Icon name={running ? 'rocket_launch' : 'auto_awesome'} className="!text-xl" filled={running} />
      {running ? 'Designing…' : label}
    </button>
  )
}

// Asked when the brief did not name a number. The build is not designed until
// this is answered: pricing a machine against a budget nobody set produces a
// quote that looks authoritative and means nothing.
function BudgetPrompt({ brief, onCancel, onSubmit }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  const seats = brief.seats || 1
  const isLab = seats > 1
  const min = isLab ? 20000 * seats : 20000

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onCancel])

  const amount = Number(String(value).replace(/[^0-9.]/g, ''))
  const valid = Number.isFinite(amount) && amount >= min
  const workload = WORKLOADS.find((w) => w.id === brief.workloadId)
  const presets = isLab
    ? [seats * 35000, seats * 55000, seats * 90000, seats * 150000]
    : [60000, 100000, 175000, 300000]

  const submit = () => { if (valid) onSubmit(Math.round(amount)) }

  return (
    <div
      className="fixed inset-0 z-[140] bg-background/80 backdrop-blur-sm flex items-center justify-center p-margin-mobile"
      onClick={onCancel}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-prompt-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface-container-high border border-outline-variant/30 rounded-2xl p-6 space-y-5"
      >
        <div>
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-2">One thing first</p>
          <h2 id="budget-prompt-title" className="font-display-lg text-headline-sm text-on-surface mb-2">
            What&rsquo;s your budget?
          </h2>
          <p className="font-body-md text-sm text-on-surface-variant">
            We read this as <span className="text-primary-fixed font-bold">{workload?.label}</span>
            {isLab ? ` for ${seats} systems` : ''}
            {brief.vramHint ? ` · needs ${brief.vramHint}GB VRAM` : ''}. Parts change price
            every week, so the budget is what decides the build — we&rsquo;d rather ask than
            guess at it.
          </p>
        </div>

        <div>
          <label htmlFor="budget-prompt-input" className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
            {isLab ? `Total for all ${seats} systems` : 'Budget'}
          </label>
          <div className="flex items-center rounded-xl border-2 border-outline-variant/40 focus-within:border-primary-fixed bg-surface-container">
            <span className="font-display-lg text-headline-sm text-on-surface-variant pl-4">₹</span>
            <input
              id="budget-prompt-input"
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={value}
              placeholder={String(presets[1])}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              className="flex-1 min-w-0 bg-transparent px-3 py-3.5 font-display-lg text-headline-sm text-primary-fixed focus:outline-none placeholder:text-on-surface-variant/40"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValue(String(p))}
                className="border border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary-fixed/50 hover:text-on-surface px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                {formatShort(p)}
              </button>
            ))}
          </div>
          {value && !valid && (
            <p className="font-body-md text-xs text-amber-300 mt-2">
              {isLab
                ? `A ${seats}-seat lab needs at least ${formatShort(min)} in total to build anything that works.`
                : `The cheapest machine we’d stand behind starts around ${formatShort(min)}.`}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:border-primary-fixed/50 px-4 py-3 rounded-xl font-bold font-headline-sm text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className="flex-[2] bg-primary-fixed text-on-primary-fixed px-4 py-3 rounded-xl font-bold font-headline-sm text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow disabled:opacity-40 disabled:hover:scale-100"
          >
            <Icon name="rocket_launch" className="!text-lg" filled />
            Design it
          </button>
        </div>
      </div>
    </div>
  )
}

// Slider and typed entry over one value. The box only commits on blur or
// Enter, so half-typed numbers never re-run the design, and whatever is
// committed is clamped into range rather than rejected — a customer who types
// 80 lakh gets the top of the range, not an error.
function NumberField({ label, value, onCommit, min, max, step, prefix, footLeft, footRight, note }) {
  // null means "not being edited" — the field shows the real value.
  const [draft, setDraft] = useState(null)

  // Committed from the element's own value rather than from state: focus, type
  // and blur can land in one React batch, and state read inside that batch is
  // a render behind. The DOM never is.
  const commit = (raw) => {
    setDraft(null)
    const text = String(raw ?? '').replace(/[^0-9.]/g, '')
    if (!text) return
    const n = Number(text)
    if (!Number.isFinite(n)) return
    onCommit(Math.min(max, Math.max(min, Math.round(n))))
  }

  return (
    <div>
      <div className="flex justify-between items-center gap-3 mb-2">
        <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">{label}</label>
        <div className="flex items-center rounded-lg border border-outline-variant/40 focus-within:border-primary-fixed bg-surface-container">
          {prefix && <span className="font-body-md text-sm text-on-surface-variant pl-2.5">{prefix}</span>}
          <input
            type="text"
            inputMode="numeric"
            aria-label={label}
            value={draft ?? String(value)}
            onFocus={(e) => { setDraft(String(value)); e.target.select() }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') { setDraft(null); e.currentTarget.blur() }
            }}
            className="w-28 bg-transparent px-2 py-1.5 font-display-lg text-headline-sm text-primary-fixed text-right focus:outline-none"
          />
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={(e) => onCommit(Number(e.target.value))}
        className="w-full accent-primary-fixed"
      />
      {(footLeft || footRight) && (
        <div className="flex justify-between font-body-md text-xs text-on-surface-variant">
          <span>{footLeft}</span><span>{footRight}</span>
        </div>
      )}
      {note && <p className="font-body-md text-xs text-on-surface-variant">{note}</p>}
    </div>
  )
}

// A part's name IS the spec the customer is checking — DDR4 against DDR5,
// 512GB against 1TB, which exact RTX card. Truncating it to keep the row on one
// line hides the only thing on the row worth reading, so the name wraps instead
// and the label sits above it on a phone.
function PartRow({ type, part }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-outline-variant/10 last:border-0">
      <div className="flex-1 min-w-0 sm:flex sm:items-baseline sm:gap-3">
        <p className="font-label-mono text-xs text-on-surface-variant uppercase sm:w-20 sm:flex-shrink-0">
          {type === 'case' ? 'cabinet' : type}
        </p>
        <p className="font-body-md text-sm text-on-surface break-words sm:flex-1 sm:min-w-0">
          {part.brand} {part.name}
        </p>
      </div>
      <span className="font-body-md text-sm text-on-surface-variant flex-shrink-0 tabular-nums">
        {formatRupees(Number(part.current_price))}
      </span>
    </div>
  )
}

function LaunchCard({ stage }) {
  const lifting = stage >= LAUNCH_STAGES.length
  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 overflow-hidden">
      <div className="relative h-52 bg-surface-container-lowest overflow-hidden">
        <div className="absolute inset-0 launch-stars" />
        <div className="absolute inset-x-0 bottom-0 h-20 hardware-card-gradient" />
        <div className={`launch-rocket ${lifting ? 'is-off' : ''}`}>
          <Icon name="rocket_launch" className="!text-5xl text-primary-fixed" filled />
          <span className="launch-flame" />
        </div>
        <p className="absolute top-3 left-4 font-label-mono text-label-mono uppercase text-primary-fixed">
          {lifting ? 'Build ready' : 'Designing'}
        </p>
      </div>

      <div className="p-5 space-y-2">
        {LAUNCH_STAGES.map((s, i) => {
          const done = stage > i
          const live = stage === i
          return (
            <div
              key={s.label}
              className={`flex items-center gap-3 transition-opacity ${done || live ? 'opacity-100' : 'opacity-35'}`}
            >
              <Icon
                name={done ? 'check_circle' : s.icon}
                filled={done}
                className={`!text-lg ${done ? 'text-primary-fixed' : live ? 'text-on-surface' : 'text-on-surface-variant'}`}
              />
              <span className={`font-body-md text-sm ${live ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                {s.label}
              </span>
            </div>
          )
        })}
        <div className="h-1 rounded-full bg-outline-variant/20 overflow-hidden mt-3">
          <div
            className="h-full bg-primary-fixed transition-[width] duration-300 ease-out"
            style={{ width: `${Math.min(100, ((stage + 1) / (LAUNCH_STAGES.length + 1)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className={`font-body-md text-sm ${bold ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>{label}</span>
      <span className={bold ? 'font-display-lg text-headline-sm text-primary-fixed' : 'font-body-md text-sm text-on-surface'}>{value}</span>
    </div>
  )
}
