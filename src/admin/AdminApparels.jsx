import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CATEGORIES,
  GENDER_LABEL,
  STATUS_LABEL,
  categoryIcon,
  categoryLabel,
  deleteProduct,
  formatRupees,
  listProducts,
} from './apparelHelpers'
import Icon from '../components/Icon'
import AdminApparelFormModal from './AdminApparelFormModal'

const STATUS_FILTERS = [
  { id: 'all',    label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'draft',  label: 'Draft' },
]
const CATEGORY_FILTER_OPTIONS = CATEGORIES.map((c) => ({ id: c.id, label: c.label }))

export default function AdminApparels() {
  const [rows, setRows]                 = useState([])
  const [loading, setLoading]           = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [catFilter, setCatFilter]       = useState('all')
  const [search, setSearch]             = useState('')
  const [formOpen, setFormOpen]         = useState(false)
  const [editing, setEditing]           = useState(null)
  const [deletingId, setDeletingId]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await listProducts())
    } catch (err) {
      console.error('[apparels] load failed', err)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Build category filter from suggested list + any custom values present in rows
  const categoryOptions = useMemo(() => {
    const seen = new Set(CATEGORY_FILTER_OPTIONS.map((c) => c.id))
    const extras = []
    for (const r of rows) {
      if (r.category && !seen.has(r.category)) {
        seen.add(r.category)
        extras.push({ id: r.category, label: categoryLabel(r.category) })
      }
    }
    return [{ id: 'all', label: 'All categories' }, ...CATEGORY_FILTER_OPTIONS, ...extras]
  }, [rows])

  const filtered = useMemo(() => {
    let out = rows
    if (statusFilter !== 'all') out = out.filter((r) => r.status === statusFilter)
    if (catFilter !== 'all')    out = out.filter((r) => r.category === catFilter)
    const q = search.trim().toLowerCase()
    if (q) out = out.filter((r) => r.name?.toLowerCase().includes(q) || r.slug?.toLowerCase().includes(q))
    return out
  }, [rows, statusFilter, catFilter, search])

  const totals = useMemo(() => {
    const activeCount = rows.filter((r) => r.status === 'active').length
    return { all: rows.length, active: activeCount, shown: filtered.length }
  }, [rows, filtered])

  const onAdd = () => { setEditing(null); setFormOpen(true) }
  const onEdit = (p) => { setEditing(p); setFormOpen(true) }

  const onDelete = async (p) => {
    if (!confirm(`Delete "${p.name}"? This removes all its variants, images and is irreversible.`)) return
    setDeletingId(p.id)
    try {
      await deleteProduct(p.id)
      load()
    } catch (err) {
      alert(`Failed: ${err.message || err}`)
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display-lg text-headline-lg text-on-surface mb-1">Products</h1>
          <p className="font-body-md text-on-surface-variant">
            Manage your Dhanshri Store catalog — apparel, toys, accessories, anything.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="bg-primary-fixed text-on-primary-fixed px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:scale-95 transition-all"
        >
          <Icon name="add" className="!text-base" />
          New Product
        </button>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto border-b border-outline-variant/20">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-4 py-3 font-headline-sm text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                active ? 'border-primary-fixed text-primary-fixed' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4 mb-6 flex justify-between items-center gap-4 flex-wrap">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">Total</p>
            <p className="font-display-lg text-headline-md text-primary-fixed">{totals.all}</p>
          </div>
          <div>
            <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">Active</p>
            <p className="font-display-lg text-headline-md text-on-surface">{totals.active}</p>
          </div>
          <div>
            <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">Showing</p>
            <p className="font-display-lg text-headline-md text-on-surface">{totals.shown}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-lg">
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2.5 font-body-md text-sm text-on-surface focus:border-primary-fixed focus:outline-none [color-scheme:dark]"
          >
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <div className="flex-1 relative">
            <Icon name="search" className="!text-base absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or slug…"
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2.5 font-body-md text-sm text-on-surface focus:border-primary-fixed focus:outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="font-body-md text-on-surface-variant">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-10 text-center">
          <Icon name="inventory_2" className="!text-4xl text-on-surface-variant mb-2" />
          <p className="font-body-md text-on-surface-variant">No products match the current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              busy={deletingId === p.id}
              onEdit={() => onEdit(p)}
              onDelete={() => onDelete(p)}
            />
          ))}
        </div>
      )}

      <AdminApparelFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => { setFormOpen(false); load() }}
      />
    </div>
  )
}

function ProductCard({ product, busy, onEdit, onDelete }) {
  const discounted = product.mrp && product.mrp > product.price
  const statusColor =
    product.status === 'active'   ? 'text-green-400 bg-green-500/10 border-green-500/30' :
    product.status === 'draft'    ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' :
                                    'text-on-surface-variant bg-surface-container border-outline-variant/30'

  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 overflow-hidden flex flex-col">
      <div className="aspect-[3/4] bg-surface-container relative overflow-hidden">
        {product.primary_image_url ? (
          <img
            src={product.primary_image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <Icon name={categoryIcon(product.category)} className="!text-5xl opacity-40" />
          </div>
        )}
        <span className={`absolute top-2 left-2 font-label-mono text-xs uppercase border rounded px-2 py-0.5 ${statusColor}`}>
          {STATUS_LABEL[product.status]}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-label-mono text-xs text-on-surface-variant uppercase bg-surface-container px-2 py-0.5 rounded">
            {categoryLabel(product.category)}
          </span>
          {product.gender && product.gender !== 'na' && (
            <span className="font-label-mono text-xs text-primary-fixed uppercase bg-primary-fixed/10 border border-primary-fixed/30 px-2 py-0.5 rounded">
              {GENDER_LABEL[product.gender] || product.gender}
            </span>
          )}
        </div>

        <h3 className="font-headline-sm text-body-lg font-bold text-on-surface line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 mt-auto">
          <p className="font-display-lg text-headline-sm text-primary-fixed">
            {formatRupees(product.price)}
          </p>
          {discounted && (
            <p className="font-body-md text-sm text-on-surface-variant line-through">
              {formatRupees(product.mrp)}
            </p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            className="flex-1 border border-outline-variant/40 text-on-surface-variant hover:border-primary-fixed/50 hover:text-on-surface py-2 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <Icon name="edit" className="!text-base" />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="w-10 h-10 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center disabled:opacity-50"
            aria-label="Delete"
          >
            <Icon name={busy ? 'progress_activity' : 'delete'} className={`!text-base ${busy ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
