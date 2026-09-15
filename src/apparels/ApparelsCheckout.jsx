import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabase'
import { DELIVERY_FEE, WHATSAPP_NUMBER } from '../config'
import { formatRupees, isRealSize, variantSummary } from './publicApparelHelpers'
import { useCart } from './CartContext'

function generateOrderNumber() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `DA${ymd}-${rand}`
}

const EMPTY = {
  customer_name: '',
  phone:         '',
  email:         '',
  address_line1: '',
  address_line2: '',
  city:          '',
  state:         'Maharashtra',
  pincode:       '',
  payment_method: 'cod',
  notes:         '',
}

export default function ApparelsCheckout() {
  const { items, subtotal, count, clear, removeItem } = useCart()
  const navigate = useNavigate()

  const [form, setForm]             = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    if (count === 0) navigate('/apparels/cart', { replace: true })
  }, [count, navigate])

  const delivery = items.length ? DELIVERY_FEE : 0
  const total    = subtotal + delivery

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const isValid = useMemo(() => (
    form.customer_name.trim().length >= 2 &&
    /^\d{10}$/.test(form.phone.replace(/\D/g, '').slice(-10)) &&
    form.address_line1.trim().length >= 5 &&
    form.city.trim().length >= 2 &&
    /^\d{6}$/.test(form.pincode.trim())
  ), [form])

  const onSubmit = async (e) => {
    e?.preventDefault?.()
    if (!isValid || submitting || items.length === 0) return
    setError('')
    setSubmitting(true)

    const order_number = generateOrderNumber()
    const orderItems = items.map((it) => ({
      product_id:     it.product_id,
      variant_id:     it.variant_id,
      name:           it.name,
      size:           it.size,
      color:          it.color,
      option1_label:  it.option1_label || 'Size',
      option2_label:  it.option2_label || '',
      qty:            it.qty,
      unit_price:     it.unit_price,
      line_total:     it.unit_price * it.qty,
      image_url:      it.image_url,
    }))

    const payload = {
      order_number,
      customer_name: form.customer_name.trim(),
      phone:         form.phone.replace(/\D/g, '').slice(-10),
      email:         form.email.trim() || null,
      address_line1: form.address_line1.trim(),
      address_line2: form.address_line2.trim() || null,
      city:          form.city.trim(),
      state:         form.state.trim() || null,
      pincode:       form.pincode.trim(),
      items:         orderItems,
      subtotal,
      delivery_fee:  delivery,
      total,
      payment_method: form.payment_method,
      notes:         form.notes.trim() || null,
    }

    try {
      const { error: err } = await supabase.from('apparel_orders').insert(payload)
      if (err) throw err

      // WhatsApp is the only checkout path, so the handoff always runs
      {
        const lines = [
          `Hi Dhanshri's Store,`,
          `New order ${order_number} placed on the site.`,
          '',
          ...orderItems.map((i) => {
            // Single-SKU items (console, game, accessory) have no options to name -
            // drop the brackets entirely rather than sending an empty pair.
            const opts = [
              isRealSize(i.size) ? `${i.option1_label}: ${i.size}` : '',
              i.option2_label && i.color && i.color !== 'Default' ? `${i.option2_label}: ${i.color}` : '',
            ]
              .filter(Boolean)
              .join(', ')
            return `• ${i.name}${opts ? ` (${opts})` : ''} × ${i.qty} = ${formatRupees(i.line_total)}`
          }),
          '',
          `Subtotal: ${formatRupees(subtotal)}`,
          `Delivery: ${formatRupees(delivery)}`,
          `Total: ${formatRupees(total)}`,
          '',
          `Name: ${payload.customer_name}`,
          `Phone: ${payload.phone}`,
          `Address: ${payload.address_line1}${payload.address_line2 ? ', ' + payload.address_line2 : ''}, ${payload.city}, ${payload.state} - ${payload.pincode}`,
        ]
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer')
      }

      clear()
      navigate(`/apparels/order-success/${order_number}`, { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.')
      setSubmitting(false)
    }
  }

  if (count === 0) return null

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
        <h1 className="font-display-lg text-headline-lg text-on-surface">Checkout</h1>
        <Link to="/apparels/cart" className="font-body-md text-sm text-primary-fixed hover:underline">
          ← Back to cart
        </Link>
      </div>

      <form onSubmit={onSubmit} className="grid lg:grid-cols-3 gap-6" noValidate>
        {/* LEFT — FORM */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-error-container/20 border border-error/40 rounded-xl p-4 flex gap-3 items-start">
              <Icon name="error" className="text-error flex-shrink-0 !text-2xl" filled />
              <p className="font-body-md text-sm text-error">{error}</p>
            </div>
          )}

          <Section title="Contact">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name *">
                <input
                  type="text"
                  value={form.customer_name}
                  onChange={set('customer_name')}
                  placeholder="e.g. Rohan Sharma"
                  className={INPUT}
                />
              </Field>
              <Field label="Phone *">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  className={INPUT}
                />
              </Field>
              <Field label="Email (optional)">
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="for order updates"
                  className={INPUT}
                />
              </Field>
            </div>
          </Section>

          <Section title="Delivery address">
            <Field label="Address Line 1 *">
              <input
                type="text"
                value={form.address_line1}
                onChange={set('address_line1')}
                placeholder="House / flat no., street, area"
                className={INPUT}
              />
            </Field>
            <Field label="Address Line 2 (optional)">
              <input
                type="text"
                value={form.address_line2}
                onChange={set('address_line2')}
                placeholder="Landmark"
                className={INPUT}
              />
            </Field>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="City *">
                <input type="text" value={form.city} onChange={set('city')} placeholder="Nagpur" className={INPUT} />
              </Field>
              <Field label="State">
                <input type="text" value={form.state} onChange={set('state')} className={INPUT} />
              </Field>
              <Field label="Pincode *">
                <input
                  type="text"
                  value={form.pincode}
                  onChange={set('pincode')}
                  placeholder="6-digit"
                  inputMode="numeric"
                  className={INPUT}
                />
              </Field>
            </div>
          </Section>

          <Section title="Booking & payment">
            <div className="space-y-2">
              <div className="flex gap-4 p-4 rounded-2xl border border-primary-fixed/30 bg-primary-fixed/[0.07]">
                <Icon name="chat" className="text-primary-fixed !text-3xl flex-shrink-0" filled />
                <div className="min-w-0">
                  <p className="font-headline-sm text-body-lg font-bold text-on-surface">
                    Booked on WhatsApp
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
                    Placing the order opens WhatsApp with your details ready to send. We reply to
                    confirm stock and the delivery slot.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl border border-outline-variant/20 bg-surface-container">
                <Icon name="payments" className="text-primary-fixed !text-3xl flex-shrink-0" filled />
                <div className="min-w-0">
                  <p className="font-headline-sm text-body-lg font-bold text-on-surface">
                    Cash on delivery
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
                    Pay when the order reaches you — nothing upfront.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Notes (optional)">
            <textarea
              rows={3}
              value={form.notes}
              onChange={set('notes')}
              placeholder="Anything we should know?"
              className={`${INPUT} resize-y`}
            />
          </Section>
        </div>

        {/* RIGHT — SUMMARY */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5 space-y-3">
            <h2 className="font-headline-sm text-body-lg font-bold text-on-surface">Your order</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto -mx-1 px-1">
              {items.map((it) => (
                <div key={it.variant_id} className="flex gap-2 items-start">
                  <div className="w-12 h-14 rounded-md bg-surface-container overflow-hidden flex-shrink-0">
                    {it.image_url ? <img src={it.image_url} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-sm text-on-surface line-clamp-1">{it.name}</p>
                    <p className="font-body-md text-xs text-on-surface-variant">
                      {[variantSummary(it.size, it.color), `× ${it.qty}`].filter(Boolean).join(' ')}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <p className="font-display-lg text-sm font-bold text-primary-fixed">
                      {formatRupees(it.unit_price * it.qty)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(it.variant_id)}
                      disabled={submitting}
                      aria-label={`Remove ${it.name} from order`}
                      title="Remove"
                      className="w-7 h-7 rounded-md text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Icon name="delete" className="!text-base" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-outline-variant/20 my-1" />
            <Row label="Subtotal" value={formatRupees(subtotal)} />
            <Row label="Delivery" value={formatRupees(delivery)} />
            <div className="border-t border-outline-variant/20 my-1" />
            <Row label="Total" value={formatRupees(total)} bold />

            <button
              type="submit"
              disabled={!isValid || submitting}
              className="w-full bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform neon-glow flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Icon name={submitting ? 'progress_activity' : 'lock'} className={`!text-base ${submitting ? 'animate-spin' : ''}`} />
              {submitting ? 'Placing order…' : `Place order · ${formatRupees(total)}`}
            </button>
            <p className="font-body-md text-xs text-on-surface-variant text-center">
              By placing the order you agree to our shipping & return terms.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}

const INPUT =
  'w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 font-body-md text-on-surface focus:border-primary-fixed focus:outline-none'

function Section({ title, children }) {
  return (
    <section className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5 space-y-4">
      <h2 className="font-headline-sm text-body-lg font-bold text-on-surface">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="font-label-mono text-label-mono text-on-surface-variant uppercase block mb-2">{label}</label>
      {children}
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`font-body-md text-sm ${bold ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>{label}</span>
      <span className={`font-display-lg ${bold ? 'text-headline-sm text-primary-fixed' : 'text-body-lg text-on-surface'}`}>{value}</span>
    </div>
  )
}
