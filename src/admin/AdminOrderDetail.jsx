import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ORDER_STATUSES,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_ICON,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  applyInventoryChange,
  deleteOrder,
  formatDateTime,
  formatRupees,
  getOrder,
  updateOrderStatus,
} from './orderHelpers'
import Icon from '../components/Icon'

const CONFIRMED_STATUSES = ['confirmed', 'packed', 'shipped', 'delivered']

export default function AdminOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [savingStatus, setSavingStatus] = useState('')
  const [notes, setNotes]       = useState('')
  const [notesSaving, setNotesSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const o = await getOrder(id)
      setOrder(o)
      setNotes(o.notes || '')
    } catch (err) {
      setError(err.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const changeStatus = async (next) => {
    if (!order || next === order.status || savingStatus) return
    if (!confirm(`Move order ${order.order_number} to "${ORDER_STATUS_LABEL[next]}"?`)) return

    setSavingStatus(next)
    try {
      const wasConfirmed   = CONFIRMED_STATUSES.includes(order.status)
      const willBeConfirmed = CONFIRMED_STATUSES.includes(next)
      if (!wasConfirmed && willBeConfirmed) {
        await applyInventoryChange(order, -1)
      } else if (wasConfirmed && !willBeConfirmed) {
        await applyInventoryChange(order, +1)
      }
      const updated = await updateOrderStatus(order.id, next)
      setOrder(updated)
    } catch (err) {
      alert(`Failed: ${err.message || err}`)
    } finally {
      setSavingStatus('')
    }
  }

  const saveNotes = async () => {
    if (!order || notes === (order.notes || '')) return
    setNotesSaving(true)
    try {
      const updated = await updateOrderStatus(order.id, order.status, notes)
      setOrder(updated)
    } catch (err) {
      alert(`Failed: ${err.message || err}`)
    } finally {
      setNotesSaving(false)
    }
  }

  const onDelete = async () => {
    if (!order) return
    if (!confirm(`Delete order ${order.order_number}? This is irreversible.`)) return
    try {
      await deleteOrder(order.id)
      navigate('/admin/orders', { replace: true })
    } catch (err) {
      alert(`Failed: ${err.message || err}`)
    }
  }

  const waLink = order
    ? `https://wa.me/91${order.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
        `Hi ${order.customer_name}, this is Dhanshri Apparels regarding your order ${order.order_number}.`
      )}`
    : '#'

  if (loading) return <p className="font-body-md text-on-surface-variant">Loading…</p>
  if (error)   return <p className="font-body-md text-error">{error}</p>
  if (!order)  return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-primary-fixed/60 transition-colors flex items-center justify-center"
            aria-label="Back"
          >
            <Icon name="arrow_back" />
          </Link>
          <div>
            <p className="font-label-mono text-label-mono text-primary-fixed uppercase">Order</p>
            <h1 className="font-display-lg text-headline-lg text-on-surface">{order.order_number}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-label-mono text-sm uppercase border rounded-lg px-3 py-1.5 flex items-center gap-2 ${ORDER_STATUS_COLOR[order.status]}`}>
            <Icon name={ORDER_STATUS_ICON[order.status]} className="!text-base" />
            {ORDER_STATUS_LABEL[order.status]}
          </span>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="border border-outline-variant/40 text-on-surface-variant px-3 py-2 rounded-lg font-bold hover:border-primary-fixed/50 hover:text-on-surface transition-all flex items-center gap-2 text-sm"
          >
            <Icon name="chat" className="!text-base" />
            WhatsApp
          </a>
          <button
            type="button"
            onClick={onDelete}
            className="border border-red-500/40 text-red-400 px-3 py-2 rounded-lg font-bold hover:bg-red-500/10 transition-all flex items-center gap-2 text-sm"
          >
            <Icon name="delete" className="!text-base" />
            Delete
          </button>
        </div>
      </div>

      {/* STATUS PIPELINE */}
      <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4">
        <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-3">Move to status</p>
        <div className="flex gap-2 flex-wrap">
          {ORDER_STATUSES.map((s) => {
            const isCurrent = s.id === order.status
            const isSaving  = savingStatus === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => changeStatus(s.id)}
                disabled={isCurrent || !!savingStatus}
                className={`px-3 py-2 rounded-lg font-bold text-sm border flex items-center gap-2 transition-all ${
                  isCurrent
                    ? `${ORDER_STATUS_COLOR[s.id]} cursor-default`
                    : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:border-primary-fixed/50 hover:text-on-surface'
                } disabled:opacity-60`}
              >
                <Icon name={isSaving ? 'progress_activity' : s.icon} className={`!text-base ${isSaving ? 'animate-spin' : ''}`} />
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ITEMS */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-headline-sm text-body-lg font-bold text-on-surface">
            Items ({Array.isArray(order.items) ? order.items.length : 0})
          </h2>
          <div className="space-y-3">
            {(order.items || []).map((it, idx) => (
              <div key={idx} className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4 flex gap-3 items-start">
                <div className="w-16 h-20 rounded-lg bg-surface-container overflow-hidden flex-shrink-0">
                  {it.image_url ? (
                    <img src={it.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                      <Icon name="checkroom" className="!text-xl opacity-50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-headline-sm text-body-lg font-bold text-on-surface">{it.name}</p>
                  <p className="font-body-md text-sm text-on-surface-variant">
                    {it.option1_label || 'Size'}: {it.size}
                    {it.option2_label && it.color && it.color !== 'Default'
                      ? ` · ${it.option2_label}: ${it.color}`
                      : ''}
                    {' · Qty '}{it.qty}
                  </p>
                  <p className="font-body-md text-xs text-on-surface-variant mt-0.5">
                    {formatRupees(it.unit_price)} each
                  </p>
                </div>
                <p className="font-display-lg text-body-lg text-primary-fixed font-bold">
                  {formatRupees(it.line_total)}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4 space-y-2">
            <Row label="Subtotal"      value={formatRupees(Number(order.subtotal) || 0)} />
            <Row label="Delivery"      value={formatRupees(Number(order.delivery_fee) || 0)} />
            <div className="border-t border-outline-variant/20 my-2" />
            <Row label="Total"         value={formatRupees(Number(order.total) || 0)} bold />
            <Row label="Payment"       value={PAYMENT_METHOD_LABEL[order.payment_method] || order.payment_method} muted />
          </div>
        </div>

        {/* CUSTOMER + ADDRESS + NOTES */}
        <div className="space-y-4">
          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4">
            <h3 className="font-headline-sm text-body-lg font-bold text-on-surface mb-2">Customer</h3>
            <p className="font-body-md text-on-surface">{order.customer_name}</p>
            <p className="font-body-md text-sm text-on-surface-variant">{order.phone}</p>
            {order.email && <p className="font-body-md text-sm text-on-surface-variant">{order.email}</p>}
            <p className="font-label-mono text-xs text-on-surface-variant mt-2">
              Placed {formatDateTime(order.created_at)}
            </p>
          </div>

          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4">
            <h3 className="font-headline-sm text-body-lg font-bold text-on-surface mb-2">Shipping address</h3>
            <p className="font-body-md text-on-surface">{order.address_line1}</p>
            {order.address_line2 && <p className="font-body-md text-on-surface">{order.address_line2}</p>}
            <p className="font-body-md text-on-surface">
              {order.city}{order.state ? `, ${order.state}` : ''} - {order.pincode}
            </p>
          </div>

          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4">
            <h3 className="font-headline-sm text-body-lg font-bold text-on-surface mb-2">Notes</h3>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this order…"
              className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 font-body-md text-sm text-on-surface focus:border-primary-fixed focus:outline-none resize-y"
            />
            <button
              type="button"
              onClick={saveNotes}
              disabled={notesSaving || notes === (order.notes || '')}
              className="mt-2 bg-primary-fixed text-on-primary-fixed px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-60"
            >
              <Icon name={notesSaving ? 'progress_activity' : 'save'} className={`!text-base ${notesSaving ? 'animate-spin' : ''}`} />
              {notesSaving ? 'Saving…' : 'Save notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold, muted }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`font-body-md text-sm ${muted ? 'text-on-surface-variant' : 'text-on-surface'}`}>{label}</span>
      <span className={`font-display-lg ${bold ? 'text-headline-sm text-primary-fixed' : 'text-body-lg text-on-surface'}`}>{value}</span>
    </div>
  )
}
