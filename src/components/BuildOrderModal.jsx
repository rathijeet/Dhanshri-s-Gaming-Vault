import { useEffect, useMemo, useState } from 'react'
import { BUSINESS_NAME, WHATSAPP_NUMBER } from '../config'
import { formatPrice } from '../buildConfig'
import Icon from './Icon'

const EMPTY = { name: '', phone: '', address: '', notes: '' }

export default function BuildOrderModal({ open, onClose, title, summaryLines, total }) {
  const [form, setForm] = useState(EMPTY)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setTouched(false)
    }
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

  const phoneDigits = useMemo(() => form.phone.replace(/\D/g, ''), [form.phone])
  const errors = {
    name: form.name.trim().length < 2 ? 'Enter your name' : '',
    phone: phoneDigits.length !== 10 ? 'Enter 10-digit mobile number' : '',
    address: form.address.trim().length < 8 ? 'Enter full delivery address' : '',
  }
  const isValid = Object.values(errors).every((e) => !e)
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  if (!open) return null

  const errClass = (field) =>
    touched && errors[field]
      ? 'border-error focus:border-error'
      : 'border-outline-variant/30 focus:border-primary-fixed'

  const handleSubmit = (e) => {
    e?.preventDefault?.()
    if (!isValid) {
      setTouched(true)
      return
    }
    const lines = [
      `Hi ${BUSINESS_NAME}! I'd like to place a custom build order.`,
      '',
      `*Order Type:* ${title}`,
      '',
      ...summaryLines,
      '',
      `*TOTAL:* ${formatPrice(total)}`,
      '',
      `*Name:* ${form.name.trim()}`,
      `*Phone:* +91 ${phoneDigits}`,
      `*Delivery Address:* ${form.address.trim()}`,
      form.notes.trim() ? `*Notes:* ${form.notes.trim()}` : null,
      '',
      'Please confirm price and ETA. Thanks!',
    ].filter(Boolean)
    const text = encodeURIComponent(lines.join('\n'))
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener,noreferrer')
    onClose()
  }

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
                Confirm Order
              </p>
              <h2 className="font-display-lg text-headline-sm md:text-headline-md text-on-surface">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-primary-fixed/60 transition-colors flex items-center justify-center flex-shrink-0 ml-4"
              aria-label="Close"
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
                </div>
              </div>
            )}

            <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-3">
                Build Summary
              </p>
              <div className="space-y-1 font-body-md text-sm text-on-surface-variant max-h-64 overflow-y-auto">
                {summaryLines.map((line, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {line}
                  </p>
                ))}
              </div>
              <div className="border-t border-outline-variant/20 mt-3 pt-3 flex justify-between items-center">
                <span className="font-headline-sm text-body-lg font-bold text-on-surface">
                  Total
                </span>
                <span className="font-display-lg text-headline-sm text-primary-fixed font-extrabold">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={setField('name')}
                  placeholder="Your full name"
                  className={`w-full bg-surface-container border ${errClass('name')} rounded-lg px-4 py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none transition-colors`}
                />
                {touched && errors.name && (
                  <p className="text-error font-body-md text-sm mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                  Phone (10 digits) <span className="text-error">*</span>
                </label>
                <div
                  className={`flex items-center bg-surface-container border ${errClass('phone')} rounded-lg focus-within:border-primary-fixed transition-colors`}
                >
                  <span className="pl-4 font-label-mono text-label-mono text-on-surface-variant">
                    +91
                  </span>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="9876543210"
                    inputMode="numeric"
                    maxLength={13}
                    className="flex-1 bg-transparent px-4 py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
                  />
                </div>
                {touched && errors.phone && (
                  <p className="text-error font-body-md text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                Delivery Address <span className="text-error">*</span>
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

            <div>
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">
                Notes (optional)
              </label>
              <textarea
                value={form.notes}
                onChange={setField('notes')}
                rows={2}
                placeholder="Preferred delivery time, custom requests, anything else"
                className="w-full bg-surface-container border border-outline-variant/30 focus:border-primary-fixed rounded-lg px-4 py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none transition-colors resize-none"
              />
            </div>

            <p className="font-body-md text-sm text-on-surface-variant bg-surface-container rounded-lg p-3">
              <Icon name="info" className="!text-base align-middle mr-1 text-primary-fixed" />
              Final price confirmed on WhatsApp. Refurbished units pass our 7-point QC. Build orders
              dispatched in 3–7 business days.
            </p>

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
                className="flex-1 bg-primary-fixed text-on-primary-fixed px-6 py-4 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow"
              >
                <Icon name="chat" className="!text-xl" />
                Send via WhatsApp
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
