import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Icon from '../components/Icon'
import {
  STATUS_TABS,
  STATUS_BADGE,
  STATUS_LABEL,
  formatDateTime,
  formatRupees,
} from './bookingHelpers'
import AdminBookingFormModal from './AdminBookingFormModal'

export default function AdminBookings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeStatus = searchParams.get('status') || 'pending'

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [counts, setCounts] = useState({})

  const loadRows = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('status', activeStatus)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[bookings] load failed', error)
      setRows([])
    } else {
      setRows(data || [])
    }
    setLoading(false)
  }, [activeStatus])

  const loadCounts = useCallback(async () => {
    const { data, error } = await supabase.from('bookings').select('status')
    if (error) return
    const next = {}
    for (const r of data) next[r.status] = (next[r.status] ?? 0) + 1
    setCounts(next)
  }, [])

  useEffect(() => {
    loadRows()
  }, [loadRows])

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  const setStatus = (id, status) => async () => {
    if (busyId) return
    setBusyId(id)
    const { error } = await supabase
      .from('bookings')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id)
    setBusyId('')
    if (error) {
      alert(`Failed: ${error.message}`)
      return
    }
    await Promise.all([loadRows(), loadCounts()])
  }

  const setTab = (id) => () => setSearchParams({ status: id }, { replace: true })

  const emptyMessage = useMemo(
    () => `No ${STATUS_LABEL[activeStatus].toLowerCase()} bookings.`,
    [activeStatus]
  )

  return (
    <div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display-lg text-headline-lg text-on-surface mb-1">Bookings</h1>
          <p className="font-body-md text-on-surface-variant">
            Review incoming requests, approve real ones, reject spam.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="bg-primary-fixed text-on-primary-fixed px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:scale-95 transition-all"
        >
          <Icon name="add" className="!text-base" />
          Add Booking
        </button>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-outline-variant/20">
        {STATUS_TABS.map((t) => {
          const active = activeStatus === t.id
          const count = counts[t.id] ?? 0
          return (
            <button
              key={t.id}
              type="button"
              onClick={setTab(t.id)}
              className={`px-4 py-3 font-headline-sm text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                active
                  ? 'border-primary-fixed text-primary-fixed'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t.label}
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded text-xs ${
                    active ? 'bg-primary-fixed/20' : 'bg-surface-container'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p className="font-body-md text-on-surface-variant">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-10 text-center">
          <Icon name="inbox" className="!text-4xl text-on-surface-variant mb-2" />
          <p className="font-body-md text-on-surface-variant">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              busy={busyId === b.id}
              onApprove={setStatus(b.id, 'confirmed')}
              onReject={setStatus(b.id, 'rejected')}
              onComplete={setStatus(b.id, 'completed')}
              onCancel={setStatus(b.id, 'cancelled')}
              onReopen={setStatus(b.id, 'pending')}
            />
          ))}
        </div>
      )}

      <AdminBookingFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false)
          loadRows()
          loadCounts()
        }}
      />
    </div>
  )
}

function BookingRow({ booking, busy, onApprove, onReject, onComplete, onCancel, onReopen }) {
  const s = booking.status

  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-headline-sm text-body-lg font-bold text-on-surface">
              {booking.customer_name}
            </p>
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${STATUS_BADGE[s]}`}>
              {STATUS_LABEL[s]}
            </span>
            {booking.source === 'manual' && (
              <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30">
                Manual
              </span>
            )}
          </div>
          <p className="font-body-md text-sm text-on-surface-variant">
            +91 {booking.phone} · {booking.console_name} · {booking.days} day
            {booking.days > 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display-lg text-headline-sm text-primary-fixed">
            {formatRupees(booking.total)}
          </p>
          <p className="font-body-md text-xs text-on-surface-variant">
            Booked {formatDateTime(booking.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
        <Detail icon="schedule" label="Pickup" value={formatDateTime(booking.start_at)} />
        <Detail icon="event_available" label="Return by" value={formatDateTime(booking.end_at)} />
        <Detail icon="home" label="Address" value={booking.address} className="sm:col-span-2" />
        {booking.extra_controller && (
          <Detail icon="sports_esports" label="Extras" value="Second controller" />
        )}
        {booking.notes && (
          <Detail icon="sticky_note_2" label="Notes" value={booking.notes} className="sm:col-span-2" />
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/20">
        <a
          href={`https://wa.me/91${booking.phone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-outline-variant/40 text-on-surface-variant px-3 py-2 rounded-lg font-bold text-sm hover:border-primary-fixed/50 hover:text-on-surface transition-all flex items-center gap-1.5"
        >
          <Icon name="chat" className="!text-base" />
          WhatsApp
        </a>

        {s === 'pending' && (
          <>
            <button
              type="button"
              onClick={onApprove}
              disabled={busy}
              className="bg-green-500/15 text-green-400 border border-green-500/30 px-3 py-2 rounded-lg font-bold text-sm hover:bg-green-500/25 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icon name="check" className="!text-base" />
              Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={busy}
              className="bg-red-500/15 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg font-bold text-sm hover:bg-red-500/25 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icon name="close" className="!text-base" />
              Reject
            </button>
          </>
        )}

        {s === 'confirmed' && (
          <>
            <button
              type="button"
              onClick={onComplete}
              disabled={busy}
              className="bg-green-500/15 text-green-400 border border-green-500/30 px-3 py-2 rounded-lg font-bold text-sm hover:bg-green-500/25 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icon name="task_alt" className="!text-base" />
              Mark Completed
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="bg-gray-500/15 text-gray-400 border border-gray-500/30 px-3 py-2 rounded-lg font-bold text-sm hover:bg-gray-500/25 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Icon name="block" className="!text-base" />
              Cancel
            </button>
          </>
        )}

        {(s === 'rejected' || s === 'cancelled') && (
          <button
            type="button"
            onClick={onReopen}
            disabled={busy}
            className="border border-outline-variant/40 text-on-surface-variant px-3 py-2 rounded-lg font-bold text-sm hover:border-primary-fixed/50 hover:text-on-surface transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Icon name="undo" className="!text-base" />
            Move to Pending
          </button>
        )}
      </div>
    </div>
  )
}

function Detail({ icon, label, value, className = '' }) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <Icon name={icon} className="!text-base text-on-surface-variant flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="font-label-mono text-xs text-on-surface-variant uppercase">{label}</p>
        <p className="font-body-md text-on-surface break-words">{value || '—'}</p>
      </div>
    </div>
  )
}
