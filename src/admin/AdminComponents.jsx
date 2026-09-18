import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AVAILABILITY_LABEL,
  COMPONENT_TYPES,
  STALE_AFTER_DAYS,
  STATUS_LABEL,
  deleteComponent,
  formatRupees,
  isPriceStale,
  listComponents,
  priceAgeDays,
  typeIcon,
  typeLabel,
} from './componentHelpers'
import Icon from '../components/Icon'
import AdminComponentFormModal from './AdminComponentFormModal'

const TYPE_FILTERS = [{ id: 'all', label: 'All' }, ...COMPONENT_TYPES.map((t) => ({ id: t.id, label: t.label }))]

export default function AdminComponents() {
  const [rows, setRows]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch]         = useState('')
  const [staleOnly, setStaleOnly]   = useState(false)
  const [formOpen, setFormOpen]     = useState(false)
  const [editing, setEditing]       = useState(null)
  const [deletingId, setDeletingId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await listComponents())
      setError('')
    } catch (err) {
      // Surfaced rather than swallowed: a missing table and an empty catalogue
      // look identical to the user otherwise, and the first is not the second.
      console.error('[components] load failed', err)
      setRows([])
      setError(
        err?.code === 'PGRST205' || /schema cache|does not exist/i.test(err?.message || '')
          ? 'The pc_components table does not exist yet. Run sql/006_pc_components.sql and sql/007_seed_components.sql in the Supabase SQL editor.'
          : err?.message || 'Failed to load components'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let out = rows
    if (typeFilter !== 'all') out = out.filter((r) => r.type === typeFilter)
    if (staleOnly)            out = out.filter((r) => isPriceStale(r.price_updated_at))
    const q = search.trim().toLowerCase()
    if (q) {
      out = out.filter((r) =>
        r.name?.toLowerCase().includes(q) ||
        r.brand?.toLowerCase().includes(q) ||
        r.slug?.toLowerCase().includes(q)
      )
    }
    return out
  }, [rows, typeFilter, staleOnly, search])

  const totals = useMemo(() => {
    let stale = 0
    let unpriced = 0
    let stockValue = 0
    for (const r of rows) {
      if (r.current_price === null || r.current_price === undefined) unpriced += 1
      else if (isPriceStale(r.price_updated_at)) stale += 1
      stockValue += (Number(r.current_price) || 0) * (r.stock_qty || 0)
    }
    return { all: rows.length, stale, unpriced, stockValue, shown: filtered.length }
  }, [rows, filtered])

  const onAdd = () => { setEditing(null); setFormOpen(true) }
  const onEdit = (c) => { setEditing(c); setFormOpen(true) }

  const onDelete = async (c) => {
    if (!confirm(`Delete "${c.brand} ${c.name}"? This removes its price history and is irreversible.`)) return
    setDeletingId(c.id)
    try {
      await deleteComponent(c.id)
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
          <h1 className="font-display-lg text-headline-md text-on-surface mb-1">Components</h1>
          <p className="font-body-md text-on-surface-variant">
            The parts catalogue every system quote is priced from.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="bg-primary-fixed text-on-primary-fixed px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:scale-95 transition-all"
        >
          <Icon name="add" className="!text-base" />
          New Component
        </button>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto border-b border-outline-variant/20">
        {TYPE_FILTERS.map((f) => {
          const active = typeFilter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
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
          <Stat label="Parts" value={totals.all} accent />
          <Stat label="Stock value" value={formatRupees(totals.stockValue)} />
          <Stat label="No price" value={totals.unpriced} warn={totals.unpriced > 0} />
          <Stat label={`Stale >${STALE_AFTER_DAYS}d`} value={totals.stale} warn={totals.stale > 0} />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-lg">
          <button
            type="button"
            onClick={() => setStaleOnly((v) => !v)}
            className={`px-3 py-2.5 rounded-lg border text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              staleOnly
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                : 'border-outline-variant/40 text-on-surface-variant hover:border-primary-fixed/50'
            }`}
          >
            <Icon name="schedule" className="!text-base" />
            Needs repricing
          </button>
          <div className="flex-1 relative">
            <Icon name="search" className="!text-base absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand or model…"
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2.5 font-body-md text-sm text-on-surface focus:border-primary-fixed focus:outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="font-body-md text-on-surface-variant">Loading…</p>
      ) : error ? (
        <div className="bg-error-container/20 border border-error/40 rounded-2xl p-6 flex gap-3 items-start">
          <Icon name="error" className="text-error flex-shrink-0 !text-2xl" filled />
          <div>
            <p className="font-headline-sm text-body-lg font-bold text-error mb-1">
              Couldn&rsquo;t load the catalogue
            </p>
            <p className="font-body-md text-sm text-error">{error}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-10 text-center">
          <Icon name="memory" className="!text-4xl text-on-surface-variant mb-2" />
          <p className="font-body-md text-on-surface-variant">
            {rows.length === 0
              ? 'No components yet. Add your first part to start building the catalogue.'
              : 'No components match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <ComponentRow
              key={c.id}
              component={c}
              busy={deletingId === c.id}
              onEdit={() => onEdit(c)}
              onDelete={() => onDelete(c)}
            />
          ))}
        </div>
      )}

      <AdminComponentFormModal
        open={formOpen}
        editing={editing}
        // Price rows are written immediately inside the modal, so even a cancel
        // can leave the list showing a stale current_price. Reload either way.
        onClose={() => { setFormOpen(false); load() }}
        onSaved={() => { setFormOpen(false); load() }}
      />
    </div>
  )
}

function Stat({ label, value, accent, warn }) {
  return (
    <div>
      <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">{label}</p>
      <p className={`font-display-lg text-headline-sm ${
        warn ? 'text-amber-300' : accent ? 'text-primary-fixed' : 'text-on-surface'
      }`}>
        {value}
      </p>
    </div>
  )
}

function ComponentRow({ component: c, busy, onEdit, onDelete }) {
  const priced = c.current_price !== null && c.current_price !== undefined
  const stale = priced && isPriceStale(c.price_updated_at)
  const age = priceAgeDays(c.price_updated_at)

  const statusColor =
    c.status === 'active'   ? 'text-green-400 bg-green-500/10 border-green-500/30' :
    c.status === 'draft'    ? 'text-amber-300 bg-amber-500/10 border-amber-500/30' :
                              'text-on-surface-variant bg-surface-container border-outline-variant/30'

  return (
    <div className="bg-surface-container-high rounded-xl border border-outline-variant/20 p-3 flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-surface-container border border-outline-variant/20 overflow-hidden flex items-center justify-center flex-shrink-0">
        {c.image_url ? (
          <img src={c.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <Icon name={typeIcon(c.type)} className="!text-xl text-on-surface-variant opacity-40" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-label-mono text-xs text-on-surface-variant uppercase bg-surface-container px-2 py-0.5 rounded">
            {typeLabel(c.type)}
          </span>
          <span className={`font-label-mono text-xs uppercase border rounded px-2 py-0.5 ${statusColor}`}>
            {STATUS_LABEL[c.status]}
          </span>
          {c.availability !== 'in_stock' && (
            <span className="font-label-mono text-xs uppercase text-on-surface-variant border border-outline-variant/30 rounded px-2 py-0.5">
              {AVAILABILITY_LABEL[c.availability]}
            </span>
          )}
        </div>
        <h3 className="font-headline-sm text-body-md font-bold text-on-surface truncate mt-1">
          {c.brand} {c.name}
        </h3>
        {c.type === 'laptop' ? (
          // A laptop row is a whole machine, so "24 GB VRAM" alone says almost
          // nothing. These are the four fields that identify it at a glance —
          // and a missing TGP is called out, because without it the matcher
          // cannot tell this machine apart from a slower one with the same
          // graphics card on the box.
          <p className="font-body-md text-xs text-on-surface-variant truncate">
            {[
              c.gpu_model,
              c.gpu_tgp_watts ? `${c.gpu_tgp_watts}W` : (c.gpu_model && c.compute_platform === 'cuda' ? 'TGP not set' : null),
              c.vram_gb ? `${c.vram_gb}GB VRAM` : null,
              c.ram_gb ? `${c.ram_gb}GB RAM` : null,
              c.weight_kg ? `${c.weight_kg}kg` : null,
            ].filter(Boolean).join(' · ')}
          </p>
        ) : c.vram_gb ? (
          <p className="font-body-md text-xs text-on-surface-variant">{c.vram_gb} GB VRAM</p>
        ) : null}
      </div>

      <div className="text-right flex-shrink-0 hidden sm:block">
        <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">Stock</p>
        <p className="font-body-md text-sm text-on-surface">{c.stock_qty}</p>
      </div>

      <div className="text-right flex-shrink-0 min-w-[110px]">
        {priced ? (
          <>
            <p className="font-display-lg text-body-lg text-primary-fixed">
              {formatRupees(Number(c.current_price))}
            </p>
            {c.type === 'laptop' && (
              <p className="font-body-md text-xs text-on-surface-variant">
                {formatRupees(Math.round(Number(c.current_price) * 1.18))} incl. GST
              </p>
            )}
            <p className={`font-body-md text-xs flex items-center justify-end gap-1 ${
              stale ? 'text-amber-300' : 'text-on-surface-variant'
            }`}>
              {stale && <Icon name="schedule" className="!text-xs" />}
              {age === 0 ? 'today' : `${age}d ago`}
            </p>
          </>
        ) : (
          <p className="font-body-md text-xs text-amber-300 flex items-center justify-end gap-1">
            <Icon name="error" className="!text-sm" />
            No price
          </p>
        )}
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onEdit}
          disabled={busy}
          className="border border-outline-variant/40 text-on-surface-variant hover:border-primary-fixed/50 hover:text-on-surface px-3 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-1 disabled:opacity-50"
        >
          <Icon name="edit" className="!text-base" />
          <span className="hidden sm:inline">Edit</span>
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
  )
}
