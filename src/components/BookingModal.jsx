import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BUSINESS_NAME,
  CONSOLES,
  DAY_PRESETS,
  DELIVERY_FEE,
  MAX_ADVANCE_BOOKING_DAYS,
  MAX_RENTAL_DAYS,
  WHATSAPP_NUMBER,
} from '../config'
import Icon from './Icon'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

const pad = (n) => String(n).padStart(2, '0')

function toLocalInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

function nowRoundedUp15() {
  const d = new Date()
  d.setSeconds(0, 0)
  const m = d.getMinutes()
  d.setMinutes(Math.ceil(m / 15) * 15)
  return d
}

function nowLocalString() {
  const d = new Date()
  d.setSeconds(0, 0)
  return toLocalInput(d)
}

function maxLocalString() {
  const d = new Date()
  d.setDate(d.getDate() + MAX_ADVANCE_BOOKING_DAYS)
  d.setSeconds(0, 0)
  return toLocalInput(d)
}

function computeEnd(startStr, days) {
  if (!startStr) return null
  const d = new Date(startStr)
  if (Number.isNaN(d.getTime())) return null
  d.setHours(d.getHours() + days * 24)
  return d
}

function formatDateTime(date) {
  if (!date) return ''
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const EMPTY = {
  consoleId: '',
  name: '',
  phone: '',
  address: '',
  days: 1,
  startDateTime: '',
  extraController: false,
}

const FIELD_ORDER = ['consoleId', 'days', 'startDateTime', 'name', 'phone', 'address']

export default function BookingModal({ open, onClose, preselectedConsoleId }) {
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState(false)
  const [scrollTarget, setScrollTarget] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fieldRefs = {
    consoleId: useRef(null),
    days: useRef(null),
    startDateTime: useRef(null),
    name: useRef(null),
    phone: useRef(null),
    address: useRef(null),
  }

  useEffect(() => {
    if (!scrollTarget) return
    const node = fieldRefs[scrollTarget]?.current
    if (!node) {
      setScrollTarget('')
      return
    }
    const raf = requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const focusable = node.querySelector(
        'input:not([type="radio"]):not([type="hidden"]), textarea, button[type="button"]'
      )
      focusable?.focus?.({ preventScroll: true })
    })
    setScrollTarget('')
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollTarget])

  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY,
        consoleId: preselectedConsoleId || '',
        startDateTime: toLocalInput(nowRoundedUp15()),
      })
      setTouched(false)
    }
  }, [open, preselectedConsoleId])

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
    () => CONSOLES.find((c) => c.id === form.consoleId),
    [form.consoleId]
  )

  const endDate = useMemo(
    () => computeEnd(form.startDateTime, form.days),
    [form.startDateTime, form.days]
  )

  const consoleSubtotal = selectedConsole ? selectedConsole.price * form.days : 0
  const controllerPerDay = selectedConsole?.extraControllerPrice ?? 0
  const controllerSubtotal =
    form.extraController && selectedConsole ? controllerPerDay * form.days : 0
  const subtotal = consoleSubtotal + controllerSubtotal
  const total = subtotal ? subtotal + DELIVERY_FEE : 0

  const phoneDigits = form.phone.replace(/\D/g, '')

  const startDateObj = form.startDateTime ? new Date(form.startDateTime) : null
  const minDateObj = new Date()
  minDateObj.setSeconds(0, 0)
  minDateObj.setMinutes(minDateObj.getMinutes() - 1) // small grace
  const maxDateObj = new Date()
  maxDateObj.setDate(maxDateObj.getDate() + MAX_ADVANCE_BOOKING_DAYS)

  const startInvalidReason = (() => {
    if (!startDateObj || Number.isNaN(startDateObj.getTime())) return 'Pick a start date & time'
    if (startDateObj < minDateObj) return 'Pickup must be now or later'
    if (startDateObj > maxDateObj) return `Pickup must be within ${MAX_ADVANCE_BOOKING_DAYS} days`
    return ''
  })()

  const errors = {
    consoleId: !form.consoleId ? 'Choose a console' : '',
    name: form.name.trim().length < 2 ? 'Enter your name' : '',
    phone: phoneDigits.length !== 10 ? 'Enter 10-digit mobile number' : '',
    address: form.address.trim().length < 8 ? 'Enter delivery address' : '',
    days: form.days < 1 || form.days > MAX_RENTAL_DAYS ? `Choose 1–${MAX_RENTAL_DAYS} days` : '',
    startDateTime: startInvalidReason,
  }
  const isValid = Object.values(errors).every((e) => !e)

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setDays = (n) => setForm((f) => ({ ...f, days: n }))

  const onStartChange = (e) => {
    const v = e.target.value
    if (!v) {
      setForm((f) => ({ ...f, startDateTime: '' }))
      return
    }
    const picked = new Date(v)
    if (Number.isNaN(picked.getTime())) return
    const minD = new Date()
    minD.setSeconds(0, 0)
    const maxD = new Date()
    maxD.setDate(maxD.getDate() + MAX_ADVANCE_BOOKING_DAYS)
    let clamped = picked
    if (picked < minD) clamped = minD
    if (picked > maxD) clamped = maxD
    setForm((f) => ({ ...f, startDateTime: toLocalInput(clamped) }))
  }

  const handleSubmit = (e) => {
    e?.preventDefault?.()
    if (!isValid || submitting) {
      if (!isValid) {
        setTouched(true)
        const firstBad = FIELD_ORDER.find((f) => errors[f])
        if (firstBad) setScrollTarget(firstBad)
      }
      return
    }

    setSubmitting(true)

    const lines = [
      `Hi ${BUSINESS_NAME}! I'd like to book a rental.`,
      '',
      `*Console:* ${selectedConsole.name} (₹${selectedConsole.price}/day)`,
      `*Duration:* ${form.days} day${form.days > 1 ? 's' : ''} (24 hrs × ${form.days})`,
      `*Pickup:* ${formatDateTime(startDateObj)}`,
      `*Return by:* ${formatDateTime(endDate)}`,
      form.extraController
        ? `*Extra Controller:* Yes (₹${controllerPerDay}/day × ${form.days} = ₹${controllerSubtotal})`
        : `*Extra Controller:* No`,
      `*Subtotal:* ₹${subtotal}`,
      `*Delivery:* ₹${DELIVERY_FEE}`,
      `*Total:* ₹${total}`,
      '',
      `*Name:* ${form.name.trim()}`,
      `*Phone:* +91 ${phoneDigits}`,
      `*Address:* ${form.address.trim()}`,
      '',
      'Please confirm availability. Thanks!',
    ]
    const text = encodeURIComponent(lines.join('\n'))
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`

    // Send the booking with keepalive:true so the request survives the
    // browser navigating away to WhatsApp. Fire first, then open WhatsApp
    // synchronously to preserve the iOS Safari user gesture.
    const payload = {
      source: 'web',
      console_id: selectedConsole.id,
      console_name: selectedConsole.name,
      console_price_per_day: selectedConsole.price,
      extra_controller: form.extraController,
      extra_controller_price_per_day: controllerPerDay,
      days: form.days,
      start_at: startDateObj.toISOString(),
      end_at: endDate.toISOString(),
      customer_name: form.name.trim(),
      phone: phoneDigits,
      address: form.address.trim(),
      console_subtotal: consoleSubtotal,
      controller_subtotal: controllerSubtotal,
      delivery_fee: DELIVERY_FEE,
      total,
      status: 'pending',
    }

    fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((err) => console.error('[booking] save failed', err))

    window.open(url, '_blank', 'noopener,noreferrer')
    setSubmitting(false)
    onClose()
  }

  if (!open) return null

  const errClass = (field) =>
    touched && errors[field]
      ? 'border-error focus:border-error'
      : 'border-outline-variant/30 focus:border-primary-fixed'

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
        <div className="sticky top-0 z-10 flex items-start justify-between p-6 md:p-8 border-b border-outline-variant/20 bg-surface-container-high rounded-t-3xl">
          <div>
            <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-2">
              Reserve Your Gear
            </p>
            <h2 className="font-display-lg text-headline-sm md:text-headline-md text-on-surface">
              Book Your Rental
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-primary-fixed/60 hover:bg-surface-container-high transition-colors flex items-center justify-center flex-shrink-0 ml-4"
            aria-label="Close booking form"
          >
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6" noValidate>
          {touched && !isValid && (
            <div className="bg-error-container/20 border border-error/40 rounded-xl p-4 flex gap-3 items-start">
              <Icon name="error" className="text-error flex-shrink-0 !text-2xl" filled />
              <div>
                <p className="font-headline-sm text-body-md font-bold text-error">
                  Please complete all required fields
                </p>
                <p className="font-body-md text-sm text-on-surface-variant mt-1">
                  Every field below is mandatory before you can book.
                </p>
              </div>
            </div>
          )}

          {/* 1. Console */}
          <div ref={fieldRefs.consoleId} className="scroll-mt-32">
            <label
              className={`font-label-mono text-label-mono uppercase block mb-3 transition-colors ${
                touched && errors.consoleId ? 'text-error' : 'text-on-surface-variant'
              }`}
            >
              Choose Console <Req />
            </label>
            <div role="radiogroup" aria-label="Choose console" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONSOLES.map((c) => {
                const active = form.consoleId === c.id
                const showError = touched && !!errors.consoleId && !active
                return (
                  <label
                    key={c.id}
                    className={`relative cursor-pointer text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      active
                        ? 'border-primary-fixed bg-primary-fixed/10'
                        : showError
                          ? 'border-error/60 bg-error-container/10 hover:border-error'
                          : 'border-outline-variant/30 bg-surface-container hover:border-primary-fixed/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="console"
                      value={c.id}
                      checked={active}
                      onChange={() => setForm((f) => ({ ...f, consoleId: c.id }))}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        active
                          ? 'border-primary-fixed'
                          : showError
                            ? 'border-error'
                            : 'border-outline-variant'
                      }`}
                    >
                      {active && <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed" />}
                    </span>
                    <div className="flex justify-between items-start flex-1 min-w-0">
                      <div className="min-w-0">
                        <p className="font-headline-sm text-body-lg font-bold text-on-surface truncate">
                          {c.name}
                        </p>
                        <p className="font-body-md text-sm text-on-surface-variant truncate">
                          {c.subtitle}
                        </p>
                      </div>
                      <span className="font-label-mono text-label-mono text-primary-fixed flex-shrink-0 ml-2">
                        ₹{c.price}/d
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
            {touched && errors.consoleId && (
              <p className="text-error font-body-md text-sm mt-2">{errors.consoleId}</p>
            )}
          </div>

          {/* 2. Duration (days first) */}
          <div ref={fieldRefs.days} className="scroll-mt-32">
            <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-3">
              Duration · max {MAX_RENTAL_DAYS} days <Req />
            </label>
            <div role="radiogroup" aria-label="Duration in days" className="grid grid-cols-3 gap-3">
              {DAY_PRESETS.map((d) => {
                const active = form.days === d
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    aria-pressed={active}
                    className={`py-4 rounded-xl border-2 font-headline-sm text-body-lg font-bold transition-all ${
                      active
                        ? 'border-primary-fixed bg-primary-fixed text-on-primary-fixed'
                        : 'border-outline-variant/30 bg-surface-container text-on-surface hover:border-primary-fixed/50'
                    }`}
                  >
                    {d} {d === 1 ? 'Day' : 'Days'}
                  </button>
                )
              })}
            </div>
            <p className="font-body-md text-sm text-on-surface-variant mt-2">
              1 day = 24 hours from pickup
            </p>
          </div>

          {/* Extras: second controller */}
          <div>
            <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-3">
              Extras
            </label>
            <label
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                !selectedConsole
                  ? 'border-outline-variant/20 bg-surface-container/50 opacity-60 cursor-not-allowed'
                  : form.extraController
                    ? 'border-primary-fixed bg-primary-fixed/10 cursor-pointer'
                    : 'border-outline-variant/30 bg-surface-container hover:border-primary-fixed/50 cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={form.extraController}
                disabled={!selectedConsole}
                onChange={(e) =>
                  setForm((f) => ({ ...f, extraController: e.target.checked }))
                }
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  form.extraController
                    ? 'border-primary-fixed bg-primary-fixed'
                    : 'border-outline-variant'
                }`}
              >
                {form.extraController && (
                  <Icon name="check" className="text-on-primary-fixed !text-base" />
                )}
              </span>
              <div className="flex justify-between items-start flex-1 min-w-0">
                <div className="min-w-0">
                  <p className="font-headline-sm text-body-lg font-bold text-on-surface">
                    Add Second Controller
                  </p>
                  <p className="font-body-md text-sm text-on-surface-variant">
                    {selectedConsole
                      ? `For 2-player local co-op on your ${selectedConsole.name}`
                      : 'Pick a console above to enable'}
                  </p>
                </div>
                <span className="font-label-mono text-label-mono text-primary-fixed flex-shrink-0 ml-2">
                  {selectedConsole ? `+₹${controllerPerDay}/d` : ''}
                </span>
              </div>
            </label>
          </div>

          {/* 3. Start datetime + auto end */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div ref={fieldRefs.startDateTime} className="scroll-mt-32">
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                Pickup Date &amp; Time <Req />
              </label>
              <input
                type="datetime-local"
                value={form.startDateTime}
                min={nowLocalString()}
                max={maxLocalString()}
                onChange={onStartChange}
                className={`w-full bg-surface-container border ${errClass('startDateTime')} rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none transition-colors [color-scheme:dark]`}
              />
              {touched && errors.startDateTime && (
                <p className="text-error font-body-md text-sm mt-1">{errors.startDateTime}</p>
              )}
            </div>

            <div>
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                Return By (auto)
              </label>
              <div className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 flex items-center gap-3 min-h-[50px]">
                <Icon name="schedule" className="text-primary-fixed !text-xl flex-shrink-0" />
                <p className="font-body-md text-on-surface">
                  {endDate ? formatDateTime(endDate) : <span className="text-on-surface-variant">—</span>}
                </p>
              </div>
            </div>
          </div>

          {/* 4. Name + Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div ref={fieldRefs.name} className="scroll-mt-32">
              <Field
                label="Full Name"
                required
                value={form.name}
                onChange={setField('name')}
                placeholder="Your full name"
                error={touched && errors.name}
                errClass={errClass('name')}
              />
            </div>
            <div ref={fieldRefs.phone} className="scroll-mt-32">
              <Field
                label="Phone (10 digits)"
                required
                value={form.phone}
                onChange={setField('phone')}
                placeholder="9876543210"
                inputMode="numeric"
                maxLength={13}
                error={touched && errors.phone}
                errClass={errClass('phone')}
                prefix="+91"
              />
            </div>
          </div>

          {/* 5. Address */}
          <div ref={fieldRefs.address} className="scroll-mt-32">
            <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
              Delivery Address <Req />
            </label>
            <textarea
              value={form.address}
              onChange={setField('address')}
              rows={2}
              placeholder="House / flat, street, area, landmark, Nagpur"
              className={`w-full bg-surface-container border ${errClass('address')} rounded-lg px-4 py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none transition-colors resize-none`}
            />
            {touched && errors.address && (
              <p className="text-error font-body-md text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* 6. Order summary */}
          <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
            <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-3">
              Order Summary
            </p>
            <div className="space-y-2 font-body-md text-on-surface-variant">
              <Row
                label={
                  selectedConsole
                    ? `${selectedConsole.name} × ${form.days} day${form.days > 1 ? 's' : ''}`
                    : 'Select a console'
                }
                value={consoleSubtotal ? `₹${consoleSubtotal}` : '—'}
              />
              {form.extraController && selectedConsole && (
                <Row
                  label={`Extra controller × ${form.days} day${form.days > 1 ? 's' : ''}`}
                  value={`₹${controllerSubtotal}`}
                />
              )}
              <Row label="Delivery & Setup" value={subtotal ? `₹${DELIVERY_FEE}` : '—'} />
              {startDateObj && !errors.startDateTime && (
                <Row label="Pickup" value={formatDateTime(startDateObj)} />
              )}
              {endDate && (
                <Row label="Return by" value={formatDateTime(endDate)} />
              )}
              <div className="border-t border-outline-variant/20 pt-2 mt-2 flex justify-between">
                <span className="font-headline-sm text-body-lg font-bold text-on-surface">Total</span>
                <span className="font-headline-sm text-body-lg font-bold text-primary-fixed">
                  {total ? `₹${total}` : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-outline-variant/40 text-on-surface-variant px-6 py-4 rounded-xl font-bold hover:border-primary-fixed/50 hover:text-on-surface transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-primary-fixed text-on-primary-fixed px-6 py-4 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Icon name={submitting ? 'progress_activity' : 'chat'} className={`!text-xl ${submitting ? 'animate-spin' : ''}`} />
              {submitting ? 'Saving…' : 'Book Via WhatsApp'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

function Req() {
  return (
    <span aria-hidden="true" className="text-error ml-0.5 normal-case">
      *
    </span>
  )
}

function Field({ label, required, value, onChange, placeholder, error, errClass, inputMode, maxLength, prefix }) {
  return (
    <div>
      <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
        {label} {required && <Req />}
      </label>
      <div
        className={`flex items-center bg-surface-container border ${errClass} rounded-lg focus-within:border-primary-fixed transition-colors`}
      >
        {prefix && (
          <span className="pl-4 font-label-mono text-label-mono text-on-surface-variant">{prefix}</span>
        )}
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          className="flex-1 bg-transparent px-4 py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
        />
      </div>
      {error && <p className="text-error font-body-md text-sm mt-1">{error}</p>}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="flex-shrink-0">{label}</span>
      <span className="text-on-surface text-right">{value}</span>
    </div>
  )
}
