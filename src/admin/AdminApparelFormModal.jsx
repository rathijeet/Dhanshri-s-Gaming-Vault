import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CATEGORIES,
  GENDERS,
  OPTION_LABEL_PRESETS,
  STATUSES,
  getProductWithRelations,
  getSpecTemplate,
  presetsForOptionLabel,
  replaceProductImages,
  replaceProductVariants,
  slugify,
  upsertProduct,
  uploadProductImage,
} from './apparelHelpers'
import Icon from '../components/Icon'

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  category: '',
  gender: 'na',
  price: '',
  mrp: '',
  status: 'draft',
  option1_label: 'Size',
  option2_label: '',
}

const EMPTY_VARIANT_ROW = (size = '', color = 'Default') => ({
  id: cryptoId(),
  size,
  color,
  quantity: 0,
  sku: '',
})

function cryptoId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

// Loaded specs come from DB as [{label, value}]. Enrich with template metadata
// (type, options, placeholder) so the right input renders.
function loadSpecsForCategory(saved, category) {
  const template = getSpecTemplate(category) || []
  const byLabel = new Map(template.map((t) => [t.label.toLowerCase(), t]))
  return (Array.isArray(saved) ? saved : []).map((s) => {
    const t = byLabel.get((s.label || '').toLowerCase())
    return {
      id: cryptoId(),
      label: s.label || '',
      value: s.value || '',
      type: t?.type || 'text',
      options: t?.options,
      placeholder: t?.placeholder,
    }
  })
}

export default function AdminApparelFormModal({ open, editing, onClose, onSaved }) {
  const [form, setForm]               = useState(EMPTY)
  const [images, setImages]           = useState([]) // [{ id, image_url }]
  const [variants, setVariants]       = useState([]) // [{ id, size, color, quantity, sku }]
  const [specs, setSpecs]             = useState([]) // [{ id, label, value, type?, options? }]
  const [submitting, setSubmitting]   = useState(false)
  const [uploading, setUploading]     = useState(false)
  const [error, setError]             = useState('')
  const [loadedId, setLoadedId]       = useState(null)
  const fileInputRef                  = useRef(null)

  // load on open
  useEffect(() => {
    if (!open) return
    setError('')
    if (!editing) {
      setForm({ ...EMPTY })
      setImages([])
      setVariants([])
      setSpecs([])
      setLoadedId(null)
      return
    }
    if (editing.id === loadedId) return
    ;(async () => {
      try {
        const { product, images: imgs, variants: vars } = await getProductWithRelations(editing.id)
        setForm({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          category: product.category || '',
          gender: product.gender || 'na',
          price: product.price ?? '',
          mrp: product.mrp ?? '',
          status: product.status || 'draft',
          option1_label: product.option1_label || 'Size',
          option2_label: product.option2_label || '',
        })
        setImages(imgs.map((i) => ({ id: i.id, image_url: i.image_url })))
        setVariants(vars.map((v) => ({
          id: v.id, size: v.size, color: v.color, quantity: v.quantity, sku: v.sku || '',
        })))
        setSpecs(loadSpecsForCategory(product.specifications || [], product.category))
        setLoadedId(editing.id)
      } catch (err) {
        setError(err.message || 'Failed to load product')
      }
    })()
  }, [open, editing, loadedId])

  // escape + body scroll lock
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

  // auto-slug from name when adding
  useEffect(() => {
    if (editing) return
    setForm((f) => ({ ...f, slug: slugify(f.name) }))
  }, [form.name, editing])

  // auto-apply spec template when category changes (new products only)
  useEffect(() => {
    if (editing) return
    const template = getSpecTemplate(form.category)
    setSpecs((prev) => {
      const existing = new Map(prev.map((s) => [s.label.toLowerCase(), s.value]))
      if (!template) return prev  // custom category — preserve current rows
      return template.map((t) => ({
        id: cryptoId(),
        label: t.label,
        value: existing.get(t.label.toLowerCase()) || '',
        type: t.type,
        options: t.options,
        placeholder: t.placeholder,
      }))
    })
  }, [form.category, editing])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const priceNum = Number(form.price) || 0
  const mrpNum   = form.mrp === '' ? null : Number(form.mrp)

  const isValid = useMemo(() => (
    form.name.trim().length >= 2 &&
    form.slug.trim().length >= 2 &&
    !!form.category &&
    !!form.gender &&
    priceNum > 0 &&
    (mrpNum === null || mrpNum >= priceNum) &&
    !!form.status
  ), [form, priceNum, mrpNum])

  // ---------- IMAGES ----------
  const onPickImages = () => fileInputRef.current?.click()

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const slug = form.slug || slugify(form.name) || 'misc'
      const uploaded = []
      for (const f of files) {
        const { url } = await uploadProductImage(f, slug)
        uploaded.push({ id: cryptoId(), image_url: url })
      }
      setImages((arr) => [...arr, ...uploaded])
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (id) => setImages((arr) => arr.filter((i) => i.id !== id))

  const moveImage = (idx, dir) => {
    setImages((arr) => {
      const next = arr.slice()
      const j = idx + dir
      if (j < 0 || j >= next.length) return arr
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  }

  // ---------- VARIANTS ----------
  const optionPresets = useMemo(
    () => presetsForOptionLabel(form.option1_label, form.category, form.gender),
    [form.option1_label, form.category, form.gender],
  )

  const generateSizes = () => {
    if (!optionPresets.length) return
    setVariants((prev) => {
      const existing = new Set(prev.map((v) => `${v.size}__${v.color}`))
      const additions = optionPresets
        .filter((s) => !existing.has(`${s}__Default`))
        .map((s) => EMPTY_VARIANT_ROW(s, 'Default'))
      return [...prev, ...additions]
    })
  }

  const addVariantRow = () => setVariants((prev) => [...prev, EMPTY_VARIANT_ROW()])
  const removeVariant = (id) => setVariants((prev) => prev.filter((v) => v.id !== id))
  const updateVariant = (id, key, val) =>
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [key]: val } : v)))

  const totalStock = useMemo(
    () => variants.reduce((s, v) => s + (Number(v.quantity) || 0), 0),
    [variants],
  )

  // ---------- SPECS ----------
  const addSpecRow = () => setSpecs((prev) => [...prev, { id: cryptoId(), label: '', value: '', type: 'text' }])
  const removeSpec = (id) => setSpecs((prev) => prev.filter((s) => s.id !== id))
  const updateSpec = (id, key, val) =>
    setSpecs((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: val } : s)))
  const moveSpec = (idx, dir) => {
    setSpecs((arr) => {
      const next = arr.slice()
      const j = idx + dir
      if (j < 0 || j >= next.length) return arr
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })
  }
  const resetSpecsFromTemplate = () => {
    const template = getSpecTemplate(form.category)
    if (!template) return
    setSpecs(template.map((t) => ({
      id: cryptoId(),
      label: t.label,
      value: '',
      type: t.type,
      options: t.options,
      placeholder: t.placeholder,
    })))
  }

  // ---------- SUBMIT ----------
  const onSubmit = async (e) => {
    e?.preventDefault?.()
    if (!isValid || submitting) return

    // validate variants
    const cleanVariants = variants
      .map((v) => ({ ...v, size: v.size.trim(), color: (v.color || 'Default').trim() }))
      .filter((v) => v.size.length > 0)
    const seen = new Set()
    for (const v of cleanVariants) {
      const key = `${v.size}__${v.color}`
      if (seen.has(key)) {
        setError(`Duplicate variant: ${v.size} / ${v.color}`)
        return
      }
      seen.add(key)
    }

    setError('')
    setSubmitting(true)
    try {
      const cleanSpecs = specs
        .map((s) => ({ label: s.label.trim(), value: String(s.value || '').trim() }))
        .filter((s) => s.label.length > 0 && s.value.length > 0)

      const payload = {
        name: form.name.trim(),
        slug: slugify(form.slug || form.name),
        description: form.description.trim() || null,
        category: form.category,
        gender: form.gender,
        price: priceNum,
        mrp: mrpNum,
        status: form.status,
        primary_image_url: images[0]?.image_url || null,
        option1_label: (form.option1_label || 'Size').trim() || 'Size',
        option2_label: form.option2_label.trim() || null,
        specifications: cleanSpecs,
      }
      const saved = await upsertProduct(payload, editing?.id)
      await Promise.all([
        replaceProductImages(saved.id, images),
        replaceProductVariants(saved.id, cleanVariants),
      ])
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

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
                {editing ? 'Edit' : 'New'} product
              </p>
              <h2 className="font-display-lg text-headline-sm text-on-surface">
                {editing ? 'Edit Product' : 'Add Product'}
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

            {/* BASIC */}
            <Section title="Basics">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Product Name">
                  <input
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    placeholder="e.g. Leisure Club Oversized Tee"
                    className={INPUT}
                  />
                </Field>
                <Field label="Slug (URL)">
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                    placeholder="leisure-club-oversized-tee"
                    className={INPUT}
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Material, fit, care instructions, design story…"
                  className={`${INPUT} resize-y`}
                />
              </Field>
            </Section>

            {/* CATEGORY + GENDER + STATUS */}
            <Section title="Classification">
              <CategoryPicker
                value={form.category}
                onChange={(val) => setForm((f) => ({ ...f, category: val }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Gender / Wearer (optional)">
                  <select value={form.gender} onChange={set('gender')} className={INPUT}>
                    {GENDERS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={set('status')} className={INPUT}>
                    {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            {/* PRICING */}
            <Section title="Pricing">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Price (₹)">
                  <input
                    type="number" min="0" step="1"
                    value={form.price}
                    onChange={set('price')}
                    className={INPUT}
                  />
                </Field>
                <Field label="MRP / Compare-at (₹, optional)">
                  <input
                    type="number" min="0" step="1"
                    value={form.mrp}
                    onChange={set('mrp')}
                    placeholder="—"
                    className={INPUT}
                  />
                </Field>
                <Field label="Discount">
                  <div className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 font-body-md text-primary-fixed font-bold">
                    {mrpNum && mrpNum > priceNum
                      ? `${Math.round(((mrpNum - priceNum) / mrpNum) * 100)}% off`
                      : '—'}
                  </div>
                </Field>
              </div>
            </Section>

            {/* SPECIFICATIONS */}
            <Section
              title={`Specifications (${specs.filter((s) => s.label && s.value).length})`}
              hint={
                getSpecTemplate(form.category)
                  ? `Template loaded for ${form.category}. Fill what applies; empty rows are skipped on save.`
                  : 'Add custom specifications — anything customers should see in the spec table.'
              }
            >
              <div className="flex gap-2 mb-3 flex-wrap">
                {getSpecTemplate(form.category) && (
                  <button
                    type="button"
                    onClick={resetSpecsFromTemplate}
                    className="bg-surface-container border border-outline-variant/40 hover:border-primary-fixed/50 text-on-surface px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                  >
                    <Icon name="auto_awesome" className="!text-base" />
                    Reset to {form.category} template
                  </button>
                )}
                <button
                  type="button"
                  onClick={addSpecRow}
                  className="bg-surface-container border border-outline-variant/40 hover:border-primary-fixed/50 text-on-surface px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                >
                  <Icon name="add" className="!text-base" />
                  Add specification
                </button>
              </div>

              {specs.length === 0 ? (
                <div className="bg-surface-container rounded-xl border border-dashed border-outline-variant/40 p-8 text-center text-on-surface-variant">
                  <Icon name="list_alt" className="!text-3xl mb-1 opacity-60" />
                  <p className="font-body-md text-sm">
                    {form.category
                      ? 'No specifications yet. Click "Add specification" to start.'
                      : 'Pick a category above to load suggested specifications.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {specs.map((s, idx) => (
                    <div key={s.id} className="grid grid-cols-12 gap-2 items-start bg-surface-container border border-outline-variant/20 rounded-lg p-2">
                      <input
                        type="text"
                        value={s.label}
                        onChange={(e) => updateSpec(s.id, 'label', e.target.value)}
                        placeholder="Label (e.g. RAM)"
                        className="col-span-12 sm:col-span-4 bg-surface-container-low border border-outline-variant/30 rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary-fixed focus:outline-none"
                      />
                      {s.type === 'select' && Array.isArray(s.options) ? (
                        <select
                          value={s.value}
                          onChange={(e) => updateSpec(s.id, 'value', e.target.value)}
                          className="col-span-10 sm:col-span-6 bg-surface-container-low border border-outline-variant/30 rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary-fixed focus:outline-none [color-scheme:dark]"
                        >
                          <option value="">— select —</option>
                          {s.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={s.type === 'number' ? 'number' : 'text'}
                          value={s.value}
                          onChange={(e) => updateSpec(s.id, 'value', e.target.value)}
                          placeholder={s.placeholder || 'Value'}
                          className="col-span-10 sm:col-span-6 bg-surface-container-low border border-outline-variant/30 rounded-md px-3 py-2 text-sm text-on-surface focus:border-primary-fixed focus:outline-none"
                        />
                      )}
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => moveSpec(idx, -1)}
                          className="w-8 h-8 rounded-md text-on-surface-variant hover:text-on-surface flex items-center justify-center"
                          aria-label="Move up"
                        >
                          <Icon name="keyboard_arrow_up" className="!text-base" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSpec(idx, 1)}
                          className="w-8 h-8 rounded-md text-on-surface-variant hover:text-on-surface flex items-center justify-center"
                          aria-label="Move down"
                        >
                          <Icon name="keyboard_arrow_down" className="!text-base" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSpec(s.id)}
                          className="w-8 h-8 rounded-md text-red-400 hover:bg-red-500/10 flex items-center justify-center"
                          aria-label="Remove"
                        >
                          <Icon name="delete" className="!text-base" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* IMAGES */}
            <Section title={`Gallery (${images.length})`} hint="First image is the cover. Drag none — use arrows to reorder.">
              <div className="flex gap-3 mb-3 flex-wrap">
                <button
                  type="button"
                  onClick={onPickImages}
                  disabled={uploading}
                  className="bg-surface-container border border-outline-variant/40 hover:border-primary-fixed/50 text-on-surface px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-60"
                >
                  <Icon
                    name={uploading ? 'progress_activity' : 'upload'}
                    className={`!text-base ${uploading ? 'animate-spin' : ''}`}
                  />
                  {uploading ? 'Uploading…' : 'Upload Images'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFiles}
                  className="hidden"
                />
              </div>
              {images.length === 0 ? (
                <div className="bg-surface-container rounded-xl border border-dashed border-outline-variant/40 p-8 text-center text-on-surface-variant">
                  <Icon name="add_photo_alternate" className="!text-3xl mb-1 opacity-60" />
                  <p className="font-body-md text-sm">No images yet. Upload 4-6 for best results.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div key={img.id} className="relative aspect-[3/4] bg-surface-container rounded-xl overflow-hidden border border-outline-variant/30 group">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 font-label-mono text-[10px] uppercase bg-primary-fixed text-on-primary-fixed px-1.5 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between gap-1 p-1.5 opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => moveImage(idx, -1)} className="w-7 h-7 rounded bg-black/60 text-white flex items-center justify-center" aria-label="Move left">
                          <Icon name="chevron_left" className="!text-base" />
                        </button>
                        <button type="button" onClick={() => moveImage(idx, 1)} className="w-7 h-7 rounded bg-black/60 text-white flex items-center justify-center" aria-label="Move right">
                          <Icon name="chevron_right" className="!text-base" />
                        </button>
                        <button type="button" onClick={() => removeImage(img.id)} className="w-7 h-7 rounded bg-red-600 text-white flex items-center justify-center ml-auto" aria-label="Remove">
                          <Icon name="delete" className="!text-base" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* VARIANTS */}
            <Section
              title={`Variants & Inventory (Total stock: ${totalStock})`}
              hint={
                form.option2_label
                  ? `Each ${form.option1_label.toLowerCase()} × ${form.option2_label.toLowerCase()} combo has its own quantity.`
                  : `Each ${form.option1_label.toLowerCase()} has its own quantity.`
              }
            >
              {/* OPTION LABELS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Option 1 label (required)">
                  <input
                    type="text"
                    value={form.option1_label}
                    onChange={set('option1_label')}
                    list="option1-presets"
                    placeholder="Size"
                    className={INPUT}
                  />
                  <datalist id="option1-presets">
                    {OPTION_LABEL_PRESETS.map((p) => <option key={p} value={p} />)}
                  </datalist>
                  <p className="font-body-md text-xs text-on-surface-variant mt-1">
                    What this variant is called — e.g. Size, Weight, Pack, Storage.
                  </p>
                </Field>
                <Field label="Option 2 label (optional)">
                  <input
                    type="text"
                    value={form.option2_label}
                    onChange={set('option2_label')}
                    list="option2-presets"
                    placeholder="Color (leave blank if not needed)"
                    className={INPUT}
                  />
                  <datalist id="option2-presets">
                    {OPTION_LABEL_PRESETS.map((p) => <option key={p} value={p} />)}
                  </datalist>
                  <p className="font-body-md text-xs text-on-surface-variant mt-1">
                    Leave blank for single-axis products like mangoes or sweets.
                  </p>
                </Field>
              </div>

              <div className="flex gap-2 mb-3 flex-wrap">
                <button
                  type="button"
                  onClick={generateSizes}
                  disabled={!optionPresets.length}
                  className="bg-surface-container border border-outline-variant/40 hover:border-primary-fixed/50 text-on-surface px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={optionPresets.length ? '' : 'No presets for this label — add rows manually'}
                >
                  <Icon name="auto_awesome" className="!text-base" />
                  Auto-add {form.option1_label.toLowerCase()}s
                </button>
                <button
                  type="button"
                  onClick={addVariantRow}
                  className="bg-surface-container border border-outline-variant/40 hover:border-primary-fixed/50 text-on-surface px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                >
                  <Icon name="add" className="!text-base" />
                  Add custom row
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="bg-surface-container rounded-xl border border-dashed border-outline-variant/40 p-8 text-center text-on-surface-variant">
                  <Icon name="straighten" className="!text-3xl mb-1 opacity-60" />
                  <p className="font-body-md text-sm">No variants yet. Add at least one row to track inventory.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-on-surface-variant text-left font-label-mono uppercase text-xs">
                        <th className="py-2 px-2">{form.option1_label}</th>
                        {form.option2_label && <th className="py-2 px-2">{form.option2_label}</th>}
                        <th className="py-2 px-2">Qty</th>
                        <th className="py-2 px-2">SKU</th>
                        <th className="py-2 px-2 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v) => (
                        <tr key={v.id} className="border-t border-outline-variant/15">
                          <td className="py-1.5 px-1">
                            <input
                              type="text"
                              value={v.size}
                              onChange={(e) => updateVariant(v.id, 'size', e.target.value)}
                              className="w-24 bg-surface-container border border-outline-variant/30 rounded-md px-2 py-1.5 text-on-surface focus:border-primary-fixed focus:outline-none"
                            />
                          </td>
                          {form.option2_label && (
                            <td className="py-1.5 px-1">
                              <input
                                type="text"
                                value={v.color}
                                onChange={(e) => updateVariant(v.id, 'color', e.target.value)}
                                className="w-32 bg-surface-container border border-outline-variant/30 rounded-md px-2 py-1.5 text-on-surface focus:border-primary-fixed focus:outline-none"
                              />
                            </td>
                          )}
                          <td className="py-1.5 px-1">
                            <input
                              type="number" min="0"
                              value={v.quantity}
                              onChange={(e) => updateVariant(v.id, 'quantity', e.target.value)}
                              className="w-20 bg-surface-container border border-outline-variant/30 rounded-md px-2 py-1.5 text-on-surface focus:border-primary-fixed focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              type="text"
                              value={v.sku}
                              onChange={(e) => updateVariant(v.id, 'sku', e.target.value)}
                              placeholder="—"
                              className="w-40 bg-surface-container border border-outline-variant/30 rounded-md px-2 py-1.5 text-on-surface focus:border-primary-fixed focus:outline-none"
                            />
                          </td>
                          <td className="py-1.5 px-1 text-right">
                            <button
                              type="button"
                              onClick={() => removeVariant(v.id)}
                              className="w-8 h-8 rounded-md text-red-400 hover:bg-red-500/10 flex items-center justify-center"
                              aria-label="Remove variant"
                            >
                              <Icon name="delete" className="!text-base" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                <Icon
                  name={submitting ? 'progress_activity' : 'save'}
                  className={`!text-xl ${submitting ? 'animate-spin' : ''}`}
                />
                {submitting ? 'Saving…' : editing ? 'Update Product' : 'Save Product'}
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

function CategoryPicker({ value, onChange }) {
  const known = CATEGORIES.find((c) => c.id === value)
  const isCustom = !!value && !known
  const [customMode, setCustomMode] = useState(isCustom)

  // keep customMode in sync if the parent loads a stored custom value
  useEffect(() => {
    if (isCustom) setCustomMode(true)
  }, [isCustom])

  return (
    <Field label="Category">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = !customMode && value === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => { setCustomMode(false); onChange(c.id) }}
              className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-1.5 ${
                active
                  ? 'border-primary-fixed bg-primary-fixed/10 text-primary-fixed'
                  : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary-fixed/50'
              }`}
            >
              <Icon name={c.icon} className="!text-base" />
              <span className="font-body-md text-xs font-bold whitespace-nowrap">{c.label}</span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => { setCustomMode(true); onChange('') }}
          className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center gap-1.5 ${
            customMode
              ? 'border-primary-fixed bg-primary-fixed/10 text-primary-fixed'
              : 'border-outline-variant/30 bg-surface-container text-on-surface-variant hover:border-primary-fixed/50'
          }`}
        >
          <Icon name="edit" className="!text-base" />
          <span className="font-body-md text-xs font-bold whitespace-nowrap">Custom…</span>
        </button>
      </div>
      {customMode && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(
            e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_|_$/g, '')
          )}
          placeholder="e.g. notebooks, mugs, posters"
          className={`${INPUT} mt-2`}
        />
      )}
    </Field>
  )
}
