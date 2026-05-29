import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { DELIVERY_FEE } from '../config'
import { formatRupees } from './publicApparelHelpers'
import { useCart } from './CartContext'

export default function ApparelsCart() {
  const { items, updateQty, removeItem, subtotal, count } = useCart()
  const navigate = useNavigate()

  const delivery = subtotal > 0 ? DELIVERY_FEE : 0
  const total    = subtotal + delivery

  if (count === 0) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 text-center">
        <Icon name="shopping_bag" className="!text-6xl text-on-surface-variant opacity-40 mb-3" />
        <h1 className="font-display-lg text-headline-md text-on-surface mb-2">Your cart is empty</h1>
        <p className="font-body-md text-on-surface-variant mb-6">
          Looks like you haven't added anything yet. Browse the collection and find your next favourite.
        </p>
        <Link
          to="/apparels"
          className="inline-flex items-center gap-2 bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold hover:scale-95 transition-all neon-glow"
        >
          <Icon name="checkroom" className="!text-base" /> Shop apparels
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
        <h1 className="font-display-lg text-headline-lg text-on-surface">
          Cart <span className="text-on-surface-variant text-headline-sm">({count})</span>
        </h1>
        <Link to="/apparels" className="font-body-md text-sm text-primary-fixed hover:underline">
          ← Continue shopping
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ITEMS */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((it) => (
            <CartLine
              key={it.variant_id}
              item={it}
              onIncrease={() => updateQty(it.variant_id, Math.min(it.stock ?? 99, it.qty + 1))}
              onDecrease={() => updateQty(it.variant_id, it.qty - 1)}
              onRemove={() => removeItem(it.variant_id)}
            />
          ))}
        </div>

        {/* SUMMARY */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5 space-y-3">
            <h2 className="font-headline-sm text-body-lg font-bold text-on-surface">Order summary</h2>

            <Row label={`Subtotal (${count} item${count === 1 ? '' : 's'})`} value={formatRupees(subtotal)} />
            <Row label="Delivery" value={formatRupees(delivery)} />
            <div className="border-t border-outline-variant/20 my-1" />
            <Row label="Total" value={formatRupees(total)} bold />

            <button
              type="button"
              onClick={() => navigate('/apparels/checkout')}
              className="w-full bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform neon-glow flex items-center justify-center gap-2 mt-2"
            >
              <Icon name="shopping_bag" className="!text-base" />
              Proceed to checkout
            </button>
            <p className="font-body-md text-xs text-on-surface-variant text-center">
              Cash on delivery available · Pan-India shipping
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function CartLine({ item, onIncrease, onDecrease, onRemove }) {
  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-4 flex gap-4 items-start">
      <Link to={`/apparels/${item.slug || ''}`} className="w-20 h-24 rounded-lg bg-surface-container overflow-hidden flex-shrink-0">
        {item.image_url ? (
          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <Icon name="checkroom" className="!text-2xl opacity-50" />
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={`/apparels/${item.slug || ''}`}
          className="font-headline-sm text-body-lg font-bold text-on-surface hover:text-primary-fixed"
        >
          {item.name}
        </Link>
        <p className="font-body-md text-sm text-on-surface-variant">
          {item.option1_label || 'Size'}: {item.size}
          {item.option2_label && item.color && item.color !== 'Default'
            ? ` · ${item.option2_label}: ${item.color}`
            : ''}
        </p>
        <p className="font-body-md text-xs text-on-surface-variant mt-1">
          {formatRupees(item.unit_price)} each
        </p>

        <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
          <div className="inline-flex items-center bg-surface-container border border-outline-variant/30 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={onDecrease}
              className="w-9 h-9 text-on-surface-variant hover:text-on-surface"
              aria-label="Decrease"
            >
              <Icon name="remove" className="!text-base" />
            </button>
            <span className="w-10 text-center font-body-md font-bold text-on-surface">{item.qty}</span>
            <button
              type="button"
              onClick={onIncrease}
              className="w-9 h-9 text-on-surface-variant hover:text-on-surface"
              aria-label="Increase"
            >
              <Icon name="add" className="!text-base" />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="font-body-md text-sm text-red-400 hover:underline flex items-center gap-1"
          >
            <Icon name="delete" className="!text-base" /> Remove
          </button>
        </div>
      </div>

      <p className="font-display-lg text-body-lg font-bold text-primary-fixed">
        {formatRupees(item.unit_price * item.qty)}
      </p>
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
