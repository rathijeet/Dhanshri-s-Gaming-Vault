import { useEffect, useMemo, useState } from 'react'
import { DAY_PRESETS, DELIVERY_FEE, MAX_RENTAL_DAYS } from '../config'
import { supabase } from '../lib/supabase'
import Icon from '../components/Icon'
import { RENTAL_OPTIONS } from './bookingHelpers'

const pad = (n) => String(n).padStart(2, '0')
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`

const EMPTY = {
  consoleId: '',
  customer_name: '',
  phone: '',
  address: '',
  days: 1,
  startDateTime: '',
  extraController: false,
  useCustomAmount: false,
  customAmount: '',
  status: 'confirmed',
  notes: '',
}

export default function AdminBookingFormModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const d = new Date()
    d.setSeconds(0, 0)
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15)
    setForm({ ...EMPTY, startDateTime: toLocalInput(d) })
    setError('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const selectedConsole = useMemo(
    () => RENTAL_OPTIONS.find((c) => c.id === form.consoleId),
    [form.consoleId]
  )
  const controllerOnly = !!selectedConsole?.controllerOnly

  const endDate = useMemo(() => {
    if (!form.startDateTime) return null
    const d = new Date(form.startDateTime)
    if (Number.isNaN(d.getTime())) return null
    d.setHours(d.getHours() + form.days * 24)
    return d
  }, [form.startDateTime, form.days])

  const controllerPerDay = selectedConsole?.extraControllerPrice ?? 0
  const consoleSubtotal = selectedConsole ? selectedConsole.price * form.days : 0
  const controllerSubtotal =
    form.extraController && selectedConsole ? controllerPerDay * form.days : 0
  const calculatedTotal = consoleSubtotal + controllerSubtotal + (consoleSubtotal ? DELIVERY_FEE : 0)

  const customAmount = Number(form.customAmount)
  const customAmountValid =
    form.customAmount.trim() !== '' && Number.isFinite(customAmount) && customAmount >= 0
  const total = form.useCustomAmount && customAmountValid ? customAmount : calculatedTotal
  const amountDiff = total - calculatedTotal

  const phoneDigits = form.phone.replace(/\D/g, '')
  const isValid =
    !!selectedConsole &&
    (!form.useCustomAmount || customAmountValid) &&
    form.customer_name.trim().length >= 2 &&
    phoneDigits.length === 10 &&
    form.address.trim().length >= 4 &&
    form.days >= 1 &&
    form.days <= MAX_RENTAL_DAYS &&
    !!form.startDateTime &&
    !!endDate

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e?.preventDefault?.()
    if (!isValid || submitting) return

    setError('')
    setSubmitting(true)
    const startAt = new Date(form.startDateTime)
    const { error: err } = await supabase.from('bookings').insert({
      source: 'manual',
      console_id: selectedConsole.id,
      console_name: selectedConsole.name,
      console_price_per_day: selectedConsole.price,
      extra_controller: form.extraController,
      extra_controller_price_per_day: controllerPerDay,
      days: form.days,
      start_at: startAt.toISOString(),
      end_at: endDate.toISOString(),
      customer_name: form.customer_name.trim(),
      phone: phoneDigits,
      address: form.address.trim(),
      console_subtotal: consoleSubtotal,
      controller_subtotal: controllerSubtotal,
      delivery_fee: DELIVERY_FEE,
      total,
      status: form.status,
      reviewed_at: new Date().toISOString(),
      notes: form.notes.trim() || null,
    })
    setSubmitting(false)
    if (err) {
      setError(err.message || 'Failed to save')
      return
    }
    onSaved?.()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start md:items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl my-8 bg-surface-container-high rounded-3xl border border-primary-fixed/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-start justify-between p-6 border-b border-outline-variant/20 bg-surface-container-high rounded-t-3xl">
            <div>
              <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-1">
                Manual entry
              </p>
              <h2 className="font-display-lg text-headline-sm text-on-surface">Add Booking</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-primary-fixed/60 transition-colors flex items-center justify-center"
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="p-6 space-y-5" noValidate>
            {error && (
              <div className="bg-error-container/20 border border-error/40 rounded-xl p-4 flex gap-3 items-start">
                <Icon name="error" className="text-error flex-shrink-0 !text-2xl" filled />
                <p className="font-body-md text-sm text-error">{error}</p>
              </div>
            )}

            <div>
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                Rental Item
              </label>
              <select
                value={form.consoleId}
                onChange={set('consoleId')}
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none [color-scheme:dark]"
              >
                <option value="">Pick a console…</option>
                {RENTAL_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.optionLabel}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DAY_PRESETS.map((d) => {
                    const active = form.days === d
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, days: d }))}
                        className={`py-3 rounded-lg border-2 font-headline-sm font-bold transition-all ${
                          active
                            ? 'border-primary-fixed bg-primary-fixed text-on-primary-fixed'
                            : 'border-outline-variant/30 bg-surface-container text-on-surface hover:border-primary-fixed/50'
                        }`}
                      >
                        {d}d
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Pickup Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.startDateTime}
                  onChange={set('startDateTime')}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.extraController}
                onChange={(e) => setForm((f) => ({ ...f, extraController: e.target.checked }))}
                disabled={!selectedConsole}
                className="w-5 h-5 accent-primary-fixed"
              />
              <span className="font-body-md text-on-surface">
                {controllerOnly ? 'Second controller' : 'Extra controller'}
                {selectedConsole ? ` (+₹${controllerPerDay}/day)` : ''}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={set('customer_name')}
                  placeholder="Full name"
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none"
                />
              </div>
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Phone (10 digits)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="9876543210"
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                Delivery Address
              </label>
              <textarea
                value={form.address}
                onChange={set('address')}
                rows={2}
                placeholder="Flat, street, area, landmark"
                className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={set('status')}
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none [color-scheme:dark]"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="Walk-in, phone booking, etc."
                  className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20">
              <div className="flex justify-between font-body-md text-on-surface-variant">
                <span>
                  {selectedConsole ? selectedConsole.name : 'Console'} × {form.days} day
                  {form.days > 1 ? 's' : ''}
                </span>
                <span>₹{consoleSubtotal}</span>
              </div>
              {form.extraController && selectedConsole && (
                <div className="flex justify-between font-body-md text-on-surface-variant mt-1">
                  <span>{controllerOnly ? 'Second controller' : 'Extra controller'}</span>
                  <span>₹{controllerSubtotal}</span>
                </div>
              )}
              <div className="flex justify-between font-body-md text-on-surface-variant mt-1">
                <span>Delivery</span>
                <span>₹{consoleSubtotal ? DELIVERY_FEE : 0}</span>
              </div>
              <div className="flex justify-between font-headline-sm font-bold text-on-surface mt-2 pt-2 border-t border-outline-variant/20">
                <span>Calculated total</span>
                <span className={form.useCustomAmount ? 'text-on-surface-variant line-through' : 'text-primary-fixed'}>
                  ₹{calculatedTotal}
                </span>
              </div>

              <label className="flex items-center gap-3 cursor-pointer mt-4 pt-4 border-t border-outline-variant/20">
                <input
                  type="checkbox"
                  checked={form.useCustomAmount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      useCustomAmount: e.target.checked,
                      customAmount: e.target.checked ? String(calculatedTotal) : '',
                    }))
                  }
                  className="w-5 h-5 accent-primary-fixed"
                />
                <span className="font-body-md text-on-surface">
                  Custom amount (enter what the customer actually paid)
                </span>
              </label>

              {form.useCustomAmount && (
                <div className="mt-3">
                  <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                    Amount Received
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-headline-sm font-bold text-on-surface-variant">
                      ₹
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="1"
                      value={form.customAmount}
                      onChange={set('customAmount')}
                      placeholder={String(calculatedTotal)}
                      className="w-full bg-surface-container-high border border-outline-variant/30 rounded-lg pl-9 pr-4 py-3 font-headline-sm font-bold text-on-surface focus:border-primary-fixed focus:outline-none"
                    />
                  </div>
                  {customAmountValid ? (
                    amountDiff !== 0 && (
                      <p className="font-body-md text-sm text-on-surface-variant mt-2">
                        {amountDiff < 0 ? 'Discount of ' : 'Extra of '}
                        <span className={amountDiff < 0 ? 'text-error font-bold' : 'text-primary-fixed font-bold'}>
                          ₹{Math.abs(amountDiff)}
                        </span>{' '}
                        vs the calculated total.
                      </p>
                    )
                  ) : (
                    <p className="font-body-md text-sm text-error mt-2">
                      Enter a valid amount (0 or more) to save.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-between font-headline-sm font-bold text-on-surface mt-4 pt-3 border-t-2 border-primary-fixed/30">
                <span>Amount Payable</span>
                <span className="text-primary-fixed">₹{total}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border-2 border-outline-variant/40 text-on-surface-variant px-6 py-3 rounded-xl font-bold hover:border-primary-fixed/50 hover:text-on-surface transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || submitting}
                className="flex-1 bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Icon
                  name={submitting ? 'progress_activity' : 'save'}
                  className={`!text-xl ${submitting ? 'animate-spin' : ''}`}
                />
                {submitting ? 'Saving…' : 'Save Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
