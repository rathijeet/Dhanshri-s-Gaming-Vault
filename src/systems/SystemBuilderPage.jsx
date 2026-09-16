import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { WORKLOADS, CORE_TYPES } from './profiles'
import { designLab, designSystem, finaliseBuild, isUsable } from './engine'
import { parseIntent } from './intent'
import { fetchCatalogue, formatRupees, formatShort } from './publicSystemHelpers'
import { BUSINESS_NAME, WHATSAPP_NUMBER } from '../config'
import Icon from '../components/Icon'
import Logo from '../components/Logo'
import ViewerBoundary from './ViewerBoundary'
import SystemTestDrive from './SystemTestDrive'

// three.js is ~600KB — it must never land in the main bundle, so the viewer is
// split out and only fetched when someone actually opens the builder.
const SystemViewer3D = lazy(() => import('./SystemViewer3D'))

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
  const [thinking, setThinking] = useState(false)
  const [brief, setBrief]     = useState(null)

  const [workloadId, setWorkloadId] = useState('ai')
  const [budget, setBudget]   = useState(400000)
  const [seats, setSeats]     = useState(1)

  const [manual, setManual]   = useState({})
  const [result, setResult]   = useState(null)
  const [rgb, setRgb]         = useState('#56ffa8')
  const [testOpen, setTestOpen] = useState(false)

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
  const onDescribe = async () => {
    if (!text.trim() || !usable.length) return
    setThinking(true)
    const parsed = await parseIntent(text)
    setBrief(parsed)
    if (parsed.workloadId) {
      const wl = parsed.workloadId
      // No stated budget is not a failure — design the best sensible machine and
      // tell them what it costs, rather than demanding a number up front.
      const bud = parsed.budget || null
      setWorkloadId(wl)
      if (parsed.budget) setBudget(parsed.budget)
      setSeats(parsed.seats)
      runDesign(wl, bud, parsed.seats, parsed.vramHint)
    } else {
      setResult(null)
    }
    setThinking(false)
  }

  // ---- manual mode ----
  const setPart = (type, id) => {
    const part = (byType[type] || []).find((c) => c.id === id)
    const next = { ...manual }
    if (part) next[type] = part
    else delete next[type]
    setManual(next)
    const wl = WORKLOADS.find((w) => w.id === workloadId)
    setResult(finaliseBuild({ build: next, workload: wl, seats }))
  }

  useEffect(() => {
    if (mode === 'budget' && usable.length) runDesign(workloadId, budget, seats)
  }, [mode, workloadId, budget, seats, usable.length, runDesign])

  const isLab = !!result?.ok && !!result.seat
  const build = result?.ok ? (result.seat ? result.seat.build : result.build) : manual
  const issues = (result?.seat?.validation || result?.validation)?.issues || []

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
            We design it, check that everything fits, and price it from real components — and
            you watch it come together in 3D as you go.
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
                  <button
                    type="button"
                    onClick={onDescribe}
                    disabled={!text.trim() || thinking}
                    className="w-full bg-primary-fixed text-on-primary-fixed px-6 py-3.5 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Icon name={thinking ? 'progress_activity' : 'auto_awesome'} className={`!text-xl ${thinking ? 'animate-spin' : ''}`} />
                    {thinking ? 'Designing…' : 'Design my system'}
                  </button>

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

                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">{seats > 1 ? 'Total project budget' : 'Budget'}</label>
                      <span className="font-display-lg text-headline-sm text-primary-fixed">{formatShort(budget)}</span>
                    </div>
                    <input
                      type="range" min="20000" max={seats > 1 ? 5000000 : 2000000} step={seats > 1 ? 25000 : 5000}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full accent-primary-fixed"
                    />
                    <div className="flex justify-between font-body-md text-xs text-on-surface-variant">
                      <span>₹20K</span><span>{seats > 1 ? '₹50L' : '₹20L'}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="font-label-mono text-label-mono text-on-surface-variant uppercase">How many identical systems?</label>
                      <span className="font-display-lg text-headline-sm text-primary-fixed">{seats}</span>
                    </div>
                    <input
                      type="range" min="1" max="60" step="1"
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                      className="w-full accent-primary-fixed"
                    />
                    <p className="font-body-md text-xs text-on-surface-variant">
                      {seats > 1
                        ? 'The budget above is for the whole lab, including GST.'
                        : 'More than one turns this into a lab quote.'}
                    </p>
                  </div>
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

            {/* ---------------- RIGHT: viewer + summary ---------------- */}
            <div className="lg:col-span-3 space-y-4">
              <div className="relative bg-surface-container-high rounded-2xl border border-outline-variant/20 overflow-hidden h-[380px] sm:h-[460px]">
                <ViewerBoundary>
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="progress_activity" className="!text-3xl text-primary-fixed animate-spin" />
                    </div>
                  }>
                    <SystemViewer3D build={build} rgbColor={rgb} seats={seats} screenScene={workloadId} />
                  </Suspense>
                </ViewerBoundary>
                <div className="absolute top-3 left-3 pointer-events-none">
                  <span className="font-label-mono text-xs uppercase text-on-surface-variant bg-background/70 border border-outline-variant/30 rounded px-2 py-1">
                    {seats > 1 ? `${seats}-seat lab` : 'Drag to rotate · scroll to zoom'}
                  </span>
                </div>
              </div>

              {issues.length > 0 && (
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

              {result?.ok && (isLab ? (
                <LabSummaryPanel result={result} build={build} onWhatsApp={onWhatsApp} onTest={() => setTestOpen(true)} />
              ) : (
                <SummaryPanel result={result} build={build} seats={seats} onWhatsApp={onWhatsApp} onTest={() => setTestOpen(true)} />
              ))}

              {result && !result.ok && (
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

      <SystemTestDrive
        open={testOpen}
        onClose={() => setTestOpen(false)}
        build={build}
        rgbColor={rgb}
        result={result?.ok ? result : null}
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
          <div key={t} className="flex items-center gap-3 py-1.5 border-b border-outline-variant/10 last:border-0">
            <span className="font-label-mono text-xs text-on-surface-variant uppercase w-20 flex-shrink-0">
              {t === 'case' ? 'cabinet' : t}
            </span>
            <span className="font-body-md text-sm text-on-surface flex-1 min-w-0 truncate">
              {build[t].brand} {build[t].name}
            </span>
            <span className="font-body-md text-sm text-on-surface-variant flex-shrink-0">
              {formatRupees(Number(build[t].current_price))}
            </span>
          </div>
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
            <div key={t} className="flex items-center gap-3 py-1 border-b border-outline-variant/10 last:border-0">
              <span className="font-label-mono text-xs text-on-surface-variant uppercase w-20 flex-shrink-0">
                {t === 'case' ? 'cabinet' : t}
              </span>
              <span className="font-body-md text-sm text-on-surface flex-1 min-w-0 truncate">
                {build[t].brand} {build[t].name}
              </span>
              <span className="font-body-md text-sm text-on-surface-variant flex-shrink-0">
                {formatRupees(Number(build[t].current_price))}
              </span>
            </div>
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
              <div key={t} className="flex items-center gap-3 py-1 border-b border-outline-variant/10 last:border-0">
                <span className="font-label-mono text-xs text-on-surface-variant uppercase w-20 flex-shrink-0">
                  {t === 'case' ? 'cabinet' : t}
                </span>
                <span className="font-body-md text-sm text-on-surface flex-1 min-w-0 truncate">
                  {result.node.build[t].brand} {result.node.build[t].name}
                </span>
                <span className="font-body-md text-sm text-on-surface-variant flex-shrink-0">
                  {formatRupees(Number(result.node.build[t].current_price))}
                </span>
              </div>
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

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className={`font-body-md text-sm ${bold ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>{label}</span>
      <span className={bold ? 'font-display-lg text-headline-sm text-primary-fixed' : 'font-body-md text-sm text-on-surface'}>{value}</span>
    </div>
  )
}
