import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ORDER_STATUSES,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_ICON,
  ORDER_STATUS_LABEL,
  formatDateTime,
  formatRupees,
  listOrders,
} from './orderHelpers'
import Icon from '../components/Icon'

const FILTERS = [
  { id: 'all', label: 'All' },
  ...ORDER_STATUSES.map((s) => ({ id: s.id, label: s.label })),
]

export default function AdminOrders() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await listOrders())
    } catch (err) {
      console.error('[orders] load failed', err)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let out = filter === 'all' ? rows : rows.filter((r) => r.status === filter)
    const q = search.trim().toLowerCase()
    if (q) out = out.filter((r) =>
      r.order_number?.toLowerCase().includes(q) ||
      r.customer_name?.toLowerCase().includes(q) ||
      r.phone?.includes(q)
    )
    return out
  }, [rows, filter, search])

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    revenue: rows
      .filter((r) => ['confirmed', 'packed', 'shipped', 'delivered'].includes(r.status))
      .reduce((s, r) => s + (Number(r.total) || 0), 0),
  }), [rows])

  return (
    <div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display-lg text-headline-lg text-on-surface mb-1">Store Orders</h1>
          <p className="font-body-md text-on-surface-variant">
            Manage every order placed on Dhanshri's Store.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Total orders"  value={stats.total} />
        <Stat label="Pending"       value={stats.pending} accent="amber" />
        <Stat label="Confirmed ₹"   value={formatRupees(stats.revenue)} accent="primary" />
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto border-b border-outline-variant/20">
        {FILTERS.map((f) => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`px-4 py-3 font-headline-sm text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                active ? 'border-primary-fixed text-primary-fixed' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4 mb-6">
        <div className="relative">
          <Icon name="search" className="!text-base absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer name or phone…"
            className="w-full bg-surface-container border border-outline-variant/30 rounded-lg pl-9 pr-4 py-2.5 font-body-md text-sm text-on-surface focus:border-primary-fixed focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <p className="font-body-md text-on-surface-variant">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-10 text-center">
          <Icon name="receipt_long" className="!text-4xl text-on-surface-variant mb-2" />
          <p className="font-body-md text-on-surface-variant">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => <OrderRow key={o.id} order={o} />)}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, accent }) {
  const tone =
    accent === 'amber'   ? 'text-amber-300' :
    accent === 'primary' ? 'text-primary-fixed' :
                           'text-on-surface'
  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4">
      <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">{label}</p>
      <p className={`font-display-lg text-headline-md ${tone} mt-1`}>{value}</p>
    </div>
  )
}

function OrderRow({ order }) {
  const itemsCount = Array.isArray(order.items) ? order.items.reduce((s, i) => s + (Number(i.qty) || 0), 0) : 0
  const previewItem = Array.isArray(order.items) ? order.items[0] : null
  return (
    <Link
      to={`/admin/orders/${order.id}`}
      className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4 flex gap-4 items-start hover:border-primary-fixed/40 transition-colors"
    >
      <div className="w-14 h-14 rounded-lg bg-surface-container overflow-hidden flex-shrink-0">
        {previewItem?.image_url ? (
          <img src={previewItem.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <Icon name="checkroom" className="!text-2xl opacity-50" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-headline-sm text-body-lg font-bold text-on-surface">{order.order_number}</p>
          <span className={`font-label-mono text-xs uppercase border rounded px-2 py-0.5 flex items-center gap-1 ${ORDER_STATUS_COLOR[order.status]}`}>
            <Icon name={ORDER_STATUS_ICON[order.status]} className="!text-xs" />
            {ORDER_STATUS_LABEL[order.status]}
          </span>
        </div>
        <p className="font-body-md text-sm text-on-surface">
          {order.customer_name} · {order.phone}
        </p>
        <p className="font-body-md text-xs text-on-surface-variant">
          {itemsCount} item{itemsCount === 1 ? '' : 's'} · {order.city} · {formatDateTime(order.created_at)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <p className="font-display-lg text-headline-sm text-primary-fixed">
          {formatRupees(Number(order.total) || 0)}
        </p>
        <Icon name="chevron_right" className="!text-base text-on-surface-variant" />
      </div>
    </Link>
  )
}
