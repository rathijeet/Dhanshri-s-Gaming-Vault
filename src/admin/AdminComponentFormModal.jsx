import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ALL_COMPAT_KEYS,
  AVAILABILITIES,
  COMPONENT_TYPES,
  PRICE_SOURCES,
  SELLERS,
  SELLER_LABEL,
  STATUSES,
  addComponentPrice,
  deleteComponentPrice,
  fieldsForType,
  formatDate,
  formatRupees,
  getComponent,
  listComponentPrices,
  sellerSearchUrl,
  slugify,
  uniqueComponentSlug,
  uploadComponentImage,
  upsertComponent,
} from './componentHelpers'
import Icon from '../components/Icon'

function cryptoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2)
}

const COMPAT_DEFAULTS = Object.fromEntries(
  ALL_COMPAT_KEYS.map((k) => [k, k === 'supported_form_factors' ? [] : ''])
)

const EMPTY = {
  type: 'cpu',
  brand: '',
  name: '',
  slug: '',
  hsn_code: '',
  gst_rate: '18',
  stock_qty: '0',
  availability: 'in_stock',
  status: 'active',
  ai_score: '0',
  creator_score: '0',
  gaming_score: '0',
  office_score: '0',
  image_url: '',
  notes: '',
  ...COMPAT_DEFAULTS,
}

const EMPTY_PRICE = { seller: 'mdcomputers', price: '', url: '', source: 'manual' }

export default function AdminComponentFormModal({ open, editing, onClose, onSaved }) {
  const [form, setForm]             = useState(EMPTY)
  const [specs, setSpecs]           = useState([])
  const [prices, setPrices]         = useState([])
  const [newPrice, setNewPrice]     = useState(EMPTY_PRICE)
  const [addingPrice, setAddingPrice] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [error, setError]           = useState('')
  const [loadedId, setLoadedId]     = useState('')

  const compatFields = useMemo(() => fieldsForType(form.type), [form.type])

  const loadPrices = useCallback(async (componentId) => {
    try {
      setPrices(await listComponentPrices(componentId))
    } catch (err) {
      console.error('[components] price history load failed', err)
      setPrices([])
    }
  }, [])

  // Load on open
  useEffect(() => {
    if (!open) return
    if (!editing) {
      setForm(EMPTY)
      setSpecs([])
      setPrices([])
      setNewPrice(EMPTY_PRICE)
      setLoadedId('')
      setError('')
      return
    }
    if (editing.id === loadedId) return

    let cancelled = false
    ;(async () => {
      try {
        const c = await getComponent(editing.id)
        if (cancelled) return
        setForm({
          ...EMPTY,
          ...Object.fromEntries(
            Object.keys(EMPTY).map((k) => {
              const v = c[k]
              if (k === 'supported_form_factors') return [k, Array.isArray(v) ? v : []]
              return [k, v === null || v === undefined ? '' : String(v)]
            })
          ),
        })
        setSpecs(
          (Array.isArray(c.specs) ? c.specs : []).map((s) => ({
            id: cryptoId(),
            label: s.label || '',
            value: s.value || '',
          }))
        )
        setLoadedId(editing.id)
        setError('')
        loadPrices(editing.id)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load component')
      }
    })()
    return () => { cancelled = true }
  }, [open, editing, loadedId, loadPrices])

  // Escape + scroll lock
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && !submitting && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, submitting])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Brand and name drive the slug, but only for new components — editing one
  // must never silently change a slug that is already in use.
  const setIdentity = (k) => (e) =>
    setForm((f) => {
      const next = { ...f, [k]: e.target.value }
      if (!editing) next.slug = slugify(`${next.brand} ${next.name}`)
      return next
    })

  // Switching type clears compatibility values that no longer apply, so a CPU
  // edited into a GPU doesn't silently keep a stale socket.
  const onTypeChange = (nextType) => {
    const keep = new Set(fieldsForType(nextType).map((f) => f.key))
    setForm((f) => ({
      ...f,
      type: nextType,
      ...Object.fromEntries(
        ALL_COMPAT_KEYS.filter((k) => !keep.has(k))
          .map((k) => [k, k === 'supported_form_factors' ? [] : ''])
      ),
    }))
  }

  const toggleFormFactor = (value) => {
    setForm((f) => {
      const cur = Array.isArray(f.supported_form_factors) ? f.supported_form_factors : []
      return {
        ...f,
        supported_form_factors: cur.includes(value)
          ? cur.filter((v) => v !== value)
          : [...cur, value],
      }
    })
  }

  // ---------- specs ----------
  const addSpecRow  = () => setSpecs((p) => [...p, { id: cryptoId(), label: '', value: '' }])
  const removeSpec  = (id) => setSpecs((p) => p.filter((s) => s.id !== id))
  const updateSpec  = (id, key, val) => setSpecs((p) => p.map((s) => (s.id === id ? { ...s, [key]: val } : s)))
  const moveSpec = (idx, dir) => {
    setSpecs((arr) => {
      const next = arr.slice()
      const j = idx + dir
      if (j < 0 || j >= next.length) return arr
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  }

  // ---------- image ----------
  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const { url } = await uploadComponentImage(file, form.slug || slugify(form.name))
      setForm((f) => ({ ...f, image_url: url }))
    } catch (err) {
      setError(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  // ---------- prices ----------
  const onAddPrice = async () => {
    if (!editing?.id || !newPrice.price) return
    setAddingPrice(true)
    setError('')
    try {
      await addComponentPrice({ componentId: editing.id, ...newPrice })
      setNewPrice(EMPTY_PRICE)
      await loadPrices(editing.id)
    } catch (err) {
      setError(err.message || 'Failed to add price')
    } finally {
      setAddingPrice(false)
    }
  }

  const onDeletePrice = async (id) => {
    if (!confirm('Remove this price record?')) return
    try {
      await deleteComponentPrice(id)
      await loadPrices(editing.id)
    } catch (err) {
      alert(`Failed: ${err.message || err}`)
    }
  }

  const isValid =
    form.type &&
    form.brand.trim().length >= 1 &&
    form.name.trim().length >= 2 &&
    form.slug.trim().length >= 2

  const num = (v) => {
    const n = Number(v)
    return v === '' || Number.isNaN(n) ? null : n
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const slug = await uniqueComponentSlug(form.slug || `${form.brand} ${form.name}`, {
        excludeId: editing?.id,
      })

      const activeKeys = new Set(compatFields.map((f) => f.key))
      const compat = Object.fromEntries(
        ALL_COMPAT_KEYS.map((k) => {
          if (!activeKeys.has(k)) return [k, null]
          if (k === 'supported_form_factors') {
            const arr = form.supported_form_factors
            return [k, Array.isArray(arr) && arr.length ? arr : null]
          }
          if (k === 'socket' || k === 'ram_type' || k === 'form_factor') {
            return [k, String(form[k] || '').trim() || null]
          }
          return [k, num(form[k])]
        })
      )

      const payload = {
        type: form.type,
        brand: form.brand.trim(),
        name: form.name.trim(),
        slug,
        hsn_code: form.hsn_code.trim() || null,
        gst_rate: num(form.gst_rate) ?? 18,
        stock_qty: num(form.stock_qty) ?? 0,
        availability: form.availability,
        status: form.status,
        ai_score: num(form.ai_score) ?? 0,
        creator_score: num(form.creator_score) ?? 0,
        gaming_score: num(form.gaming_score) ?? 0,
        office_score: num(form.office_score) ?? 0,
        image_url: form.image_url || null,
        notes: form.notes.trim() || null,
        specs: specs.filter((s) => s.label.trim() && s.value.trim())
                    .map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
        ...compat,
      }

      const saved = await upsertComponent(payload, editing?.id)

      // A brand-new component can't have price history before it exists, so the
      // first price is captured inline and written straight after the insert.
      if (!editing && newPrice.price) {
        await addComponentPrice({ componentId: saved.id, ...newPrice })
      }

      onSaved?.()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const searchQuery = `${form.brand} ${form.name}`.trim()

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-background/80 backdrop-blur-md"
      onClick={() => !submitting && onClose()}
    >
      <div className="flex min-h-full items-start md:items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl my-8 bg-surface-container-high rounded-3xl border border-primary-fixed/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-start justify-between p-6 border-b border-outline-variant/20 bg-surface-container-high rounded-t-3xl">
            <div>
              <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-1">
                {editing ? 'Edit' : 'New'} component
              </p>
              <h2 className="font-display-lg text-headline-sm text-on-surface">
                {editing ? 'Edit Component' : 'Add Component'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-primary-fixed/60 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <Icon name="close" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-6" noValidate>
            {error && (
              <div className="bg-error-container/20 border border-error/40 rounded-xl p-4 flex gap-3 items-start">
                <Icon name="error" className="text-error flex-shrink-0 !text-2xl" filled />
                <p className="font-body-md text-sm text-error">{error}</p>
              </div>
            )}

            {/* TYPE */}
            <Section title="Component type">
              <div className="flex flex-wrap gap-2">
                {COMPONENT_TYPES.map((t) => {
                  const active = form.type === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onTypeChange(t.id)}
                      className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-1.5 ${
                        active
                          ? 'border-primary-fixed bg-primary-fixed/10 text-primary-fixed'
                          : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary-fixed/50'
                      }`}
                    >
                      <Icon name={t.icon} className="!text-base" />
                      <span className="font-body-md text-xs font-bold whitespace-nowrap">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </Section>

            {/* BASICS */}
            <Section title="Basics">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Brand">
                  <input type="text" value={form.brand} onChange={setIdentity('brand')} placeholder="AMD, NVIDIA, Corsair…" className={INPUT} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Model name">
                    <input type="text" value={form.name} onChange={setIdentity('name')} placeholder="Ryzen 7 9800X3D" className={INPUT} />
                  </Field>
                </div>
              </div>

              <Field label="Slug (URL)">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="amd-ryzen-7-9800x3d"
                  className={INPUT}
                />
              </Field>

              <Field label="Image">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-surface-container border border-outline-variant/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {form.image_url ? (
                      <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name={COMPONENT_TYPES.find((t) => t.id === form.type)?.icon || 'memory'} className="!text-3xl text-on-surface-variant opacity-40" />
                    )}
                  </div>
                  <label className="bg-surface-container border border-outline-variant/40 hover:border-primary-fixed/50 text-on-surface px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 cursor-pointer">
                    <Icon name={uploading ? 'progress_activity' : 'upload'} className={`!text-base ${uploading ? 'animate-spin' : ''}`} />
                    {uploading ? 'Uploading…' : 'Upload image'}
                    <input type="file" accept="image/*" onChange={onFile} disabled={uploading} className="hidden" />
                  </label>
                  {form.image_url && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                      className="text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 text-sm font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </Field>
            </Section>

            {/* PRICING */}
            <Section
              title="Pricing"
              hint="Prices are recorded per seller with a date. The newest record becomes this component's current price."
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="HSN code">
                  <input type="text" value={form.hsn_code} onChange={set('hsn_code')} placeholder="8473" className={INPUT} />
                </Field>
                <Field label="GST rate (%)">
                  <input type="number" min="0" max="100" step="0.5" value={form.gst_rate} onChange={set('gst_rate')} className={INPUT} />
                </Field>
              </div>

              {/* quick links to go check the price */}
              {searchQuery && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">Check price at</span>
                  {SELLERS.filter((s) => s.search).map((s) => (
                    <a
                      key={s.id}
                      href={sellerSearchUrl(s.id, searchQuery)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-outline-variant/40 text-on-surface-variant hover:border-primary-fixed/50 hover:text-on-surface px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      {s.label}
                      <Icon name="open_in_new" className="!text-sm" />
                    </a>
                  ))}
                </div>
              )}

              {/* add a price */}
              <div className="bg-surface-container border border-outline-variant/20 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-3">
                  <label className="font-label-mono text-xs text-on-surface-variant uppercase block mb-1">Seller</label>
                  <select
                    value={newPrice.seller}
                    onChange={(e) => setNewPrice((p) => ({ ...p, seller: e.target.value }))}
                    className={SMALL_INPUT + ' [color-scheme:dark]'}
                  >
                    {SELLERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-label-mono text-xs text-on-surface-variant uppercase block mb-1">Price ₹</label>
                  <input
                    type="number" min="0" step="1"
                    value={newPrice.price}
                    onChange={(e) => setNewPrice((p) => ({ ...p, price: e.target.value }))}
                    className={SMALL_INPUT}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="font-label-mono text-xs text-on-surface-variant uppercase block mb-1">Source</label>
                  <select
                    value={newPrice.source}
                    onChange={(e) => setNewPrice((p) => ({ ...p, source: e.target.value }))}
                    className={SMALL_INPUT + ' [color-scheme:dark]'}
                  >
                    {PRICE_SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="font-label-mono text-xs text-on-surface-variant uppercase block mb-1">Link</label>
                  <input
                    type="url"
                    value={newPrice.url}
                    onChange={(e) => setNewPrice((p) => ({ ...p, url: e.target.value }))}
                    placeholder="optional"
                    className={SMALL_INPUT}
                  />
                </div>
                <div className="sm:col-span-2">
                  {editing ? (
                    <button
                      type="button"
                      onClick={onAddPrice}
                      disabled={!newPrice.price || addingPrice}
                      className="w-full bg-primary-fixed text-on-primary-fixed px-3 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <Icon name={addingPrice ? 'progress_activity' : 'add'} className={`!text-base ${addingPrice ? 'animate-spin' : ''}`} />
                      Add
                    </button>
                  ) : (
                    <p className="font-body-md text-xs text-on-surface-variant">Saved with the component.</p>
                  )}
                </div>
              </div>

              {editing && (
                prices.length === 0 ? (
                  <div className="border border-dashed border-outline-variant/40 rounded-xl p-6 text-center">
                    <p className="font-body-md text-sm text-on-surface-variant">
                      No price recorded yet — this component can't be quoted until it has one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {prices.map((p, idx) => (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                          idx === 0
                            ? 'border-primary-fixed/40 bg-primary-fixed/5'
                            : 'border-outline-variant/20 bg-surface-container'
                        }`}
                      >
                        {idx === 0 && (
                          <span className="font-label-mono text-xs uppercase text-primary-fixed border border-primary-fixed/30 rounded px-1.5 py-0.5">
                            Current
                          </span>
                        )}
                        <span className="font-body-md text-sm text-on-surface font-bold">
                          {formatRupees(Number(p.price))}
                        </span>
                        <span className="font-body-md text-sm text-on-surface-variant">
                          {SELLER_LABEL[p.seller] || p.seller}
                        </span>
                        <span className="font-body-md text-xs text-on-surface-variant ml-auto">
                          {formatDate(p.fetched_at)}
                        </span>
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant hover:text-primary-fixed">
                            <Icon name="open_in_new" className="!text-base" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeletePrice(p.id)}
                          className="text-red-400 hover:bg-red-500/10 rounded p-1"
                          aria-label="Remove price"
                        >
                          <Icon name="delete" className="!text-base" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </Section>

            {/* STOCK */}
            <Section title="Stock &amp; status">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Stock quantity">
                  <input type="number" min="0" step="1" value={form.stock_qty} onChange={set('stock_qty')} className={INPUT} />
                </Field>
                <Field label="Availability">
                  <select value={form.availability} onChange={set('availability')} className={`${INPUT} [color-scheme:dark]`}>
                    {AVAILABILITIES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={set('status')} className={`${INPUT} [color-scheme:dark]`}>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            {/* SCORES */}
            <Section
              title="Workload scores"
              hint="0-100, your call. The recommender ranks parts within a category by the score matching the customer's workload — this is the knob that makes suggestions genuine."
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <ScoreField label="AI / ML"       value={form.ai_score}      onChange={set('ai_score')} />
                <ScoreField label="Creator"       value={form.creator_score} onChange={set('creator_score')} />
                <ScoreField label="Gaming"        value={form.gaming_score}  onChange={set('gaming_score')} />
                <ScoreField label="Office"        value={form.office_score}  onChange={set('office_score')} />
              </div>
            </Section>

            {/* COMPATIBILITY */}
            {compatFields.length > 0 && (
              <Section
                title="Compatibility"
                hint="Used by the build engine to reject incompatible combinations. Leave blank if unknown — the part will simply be skipped by rules that need it."
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {compatFields.map((f) => (
                    <div key={f.key} className={f.input === 'multi' ? 'sm:col-span-2' : ''}>
                      <Field label={f.label}>
                        {f.input === 'select' ? (
                          <select
                            value={form[f.key]}
                            onChange={set(f.key)}
                            className={`${INPUT} [color-scheme:dark]`}
                          >
                            <option value="">— select —</option>
                            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : f.input === 'multi' ? (
                          <div className="flex flex-wrap gap-2">
                            {f.options.map((o) => {
                              const on = (form.supported_form_factors || []).includes(o)
                              return (
                                <button
                                  key={o}
                                  type="button"
                                  onClick={() => toggleFormFactor(o)}
                                  className={`px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all ${
                                    on
                                      ? 'border-primary-fixed bg-primary-fixed text-on-primary-fixed'
                                      : 'border-outline-variant/30 bg-surface-container text-on-surface hover:border-primary-fixed/50'
                                  }`}
                                >
                                  {o}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <input
                            type={f.input === 'number' ? 'number' : 'text'}
                            min={f.input === 'number' ? '0' : undefined}
                            value={form[f.key]}
                            onChange={set(f.key)}
                            placeholder={f.placeholder}
                            className={INPUT}
                          />
                        )}
                        {f.hint && (
                          <p className="font-body-md text-xs text-on-surface-variant mt-1">{f.hint}</p>
                        )}
                      </Field>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* SPECS */}
            <Section
              title={`Specifications (${specs.filter((s) => s.label && s.value).length})`}
              hint="Anything else worth printing on a quotation. Empty rows are skipped on save."
            >
              {specs.length === 0 ? (
                <div className="border border-dashed border-outline-variant/40 rounded-xl p-6 text-center">
                  <p className="font-body-md text-sm text-on-surface-variant mb-3">No specifications yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {specs.map((s, idx) => (
                    <div key={s.id} className="grid grid-cols-12 gap-2 items-start bg-surface-container border border-outline-variant/20 rounded-lg p-2">
                      <input
                        type="text"
                        value={s.label}
                        onChange={(e) => updateSpec(s.id, 'label', e.target.value)}
                        placeholder="Label (e.g. Cores)"
                        className="col-span-12 sm:col-span-4 bg-surface-container-low border border-outline-variant/30 rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary-fixed focus:outline-none"
                      />
                      <input
                        type="text"
                        value={s.value}
                        onChange={(e) => updateSpec(s.id, 'value', e.target.value)}
                        placeholder="Value (e.g. 8)"
                        className="col-span-10 sm:col-span-6 bg-surface-container-low border border-outline-variant/30 rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary-fixed focus:outline-none"
                      />
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <button type="button" onClick={() => moveSpec(idx, -1)} className="text-on-surface-variant hover:text-on-surface p-1" aria-label="Move up">
                          <Icon name="keyboard_arrow_up" className="!text-base" />
                        </button>
                        <button type="button" onClick={() => moveSpec(idx, 1)} className="text-on-surface-variant hover:text-on-surface p-1" aria-label="Move down">
                          <Icon name="keyboard_arrow_down" className="!text-base" />
                        </button>
                        <button type="button" onClick={() => removeSpec(s.id)} className="text-red-400 hover:bg-red-500/10 rounded p-1" aria-label="Remove">
                          <Icon name="delete" className="!text-base" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={addSpecRow}
                className="border border-outline-variant/40 text-on-surface-variant hover:border-primary-fixed/50 hover:text-on-surface px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
              >
                <Icon name="add" className="!text-base" />
                Add specification
              </button>
            </Section>

            {/* NOTES */}
            <Section title="Internal notes">
              <textarea
                rows={2}
                value={form.notes}
                onChange={set('notes')}
                placeholder="Not shown to customers — supplier, lead time, caveats…"
                className={`${INPUT} resize-y`}
              />
            </Section>

            {/* ACTIONS */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 border-2 border-outline-variant/40 text-on-surface-variant px-6 py-3 rounded-xl font-bold hover:border-primary-fixed/50 hover:text-on-surface transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || submitting || uploading}
                className="flex-1 bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Icon name={submitting ? 'progress_activity' : 'save'} className={`!text-xl ${submitting ? 'animate-spin' : ''}`} />
                {submitting ? 'Saving…' : editing ? 'Update Component' : 'Save Component'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const INPUT =
  'w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none'

const SMALL_INPUT =
  'w-full bg-surface-container-low border border-outline-variant/30 rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary-fixed focus:outline-none'

function Section({ title, hint, children }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-headline-sm text-body-lg font-bold text-on-surface">{title}</h3>
        {hint && <p className="font-body-md text-xs text-on-surface-variant mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}

function ScoreField({ label, value, onChange }) {
  return (
    <div>
      <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input type="range" min="0" max="100" step="1" value={value} onChange={onChange} className="flex-1 accent-primary-fixed" />
        <span className="font-display-lg text-body-lg text-primary-fixed w-9 text-right">{value || 0}</span>
      </div>
    </div>
  )
}
