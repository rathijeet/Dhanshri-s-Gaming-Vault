import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'

// Presentational pieces shared by the desktop builder and the laptop finder.
// Lifted out of SystemBuilderPage unchanged when the laptop track arrived —
// the two flows are genuinely different products and share no logic, but they
// are one page to the customer and have to look like it.

export function Panel({ title, hint, children }) {
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

// One button, one meaning, in every mode: this is where a machine gets chosen.
export function DesignButton({ onClick, disabled, running, label = 'Design my system', runningLabel = 'Designing…' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || running}
      className="w-full bg-primary-fixed text-on-primary-fixed px-6 py-3.5 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow disabled:opacity-50 disabled:hover:scale-100"
    >
      <Icon name={running ? 'rocket_launch' : 'auto_awesome'} className="!text-xl" filled={running} />
      {running ? runningLabel : label}
    </button>
  )
}

export function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className={`font-body-md text-sm ${bold ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>{label}</span>
      <span className={bold ? 'font-display-lg text-headline-sm text-primary-fixed' : 'font-body-md text-sm text-on-surface'}>{value}</span>
    </div>
  )
}

// Slider and typed entry over one value. The box only commits on blur or
// Enter, so half-typed numbers never re-run anything, and whatever is
// committed is clamped into range rather than rejected — a customer who types
// 80 lakh gets the top of the range, not an error.
export function NumberField({ label, value, onCommit, min, max, step, prefix, footLeft, footRight, note }) {
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

// The work is instant — it is local arithmetic over the catalogue. Firing the
// result onto the page with no beat in between reads as "nothing happened", so
// the launch plays out the checks that actually ran. `stages` differs per flow
// because a laptop is matched, not assembled, and claiming to check clearances
// on a sealed machine would be a lie told for the animation's sake.
export function LaunchCard({ stage, stages, doneLabel = 'Build ready', runningLabel = 'Designing' }) {
  const lifting = stage >= stages.length
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
          {lifting ? doneLabel : runningLabel}
        </p>
      </div>

      <div className="p-5 space-y-2">
        {stages.map((s, i) => {
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
            style={{ width: `${Math.min(100, ((stage + 1) / (stages.length + 1)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// Asked when the brief did not name a number, in either flow.
//
// The principle is the same whether the machine is assembled or bought whole:
// without a budget the answer is a guess wearing a quote's clothing. A desktop
// gets priced against a ceiling nobody set; a laptop is worse, because ranking
// 28 finished machines on merit alone leads with the most expensive one the
// customer might conceivably afford. "Need an HP laptop" is not a request for a
// mobile workstation.
//
// Only the copy differs between the two, so only the copy is a prop.
export function BudgetPrompt({
  eyebrow = 'One thing first',
  title = "What's your budget?",
  summary,
  explain,
  label = 'Budget',
  min,
  presets = [],
  minHint,
  submitLabel = 'Design it',
  submitIcon = 'rocket_launch',
  formatShort = (n) => `₹${n}`,
  onCancel,
  onSubmit,
}) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

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
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-2">{eyebrow}</p>
          <h2 id="budget-prompt-title" className="font-display-lg text-headline-sm text-on-surface mb-2">
            {title}
          </h2>
          <p className="font-body-md text-sm text-on-surface-variant">
            {summary}{summary ? '. ' : ''}{explain}
          </p>
        </div>

        <div>
          <label htmlFor="budget-prompt-input" className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
            {label}
          </label>
          <div className="flex items-center rounded-xl border-2 border-outline-variant/40 focus-within:border-primary-fixed bg-surface-container">
            <span className="font-display-lg text-headline-sm text-on-surface-variant pl-4">₹</span>
            <input
              id="budget-prompt-input"
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={value}
              placeholder={String(presets[1] ?? min)}
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
            <p className="font-body-md text-xs text-amber-300 mt-2">{minHint}</p>
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
            <Icon name={submitIcon} className="!text-lg" filled />
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
