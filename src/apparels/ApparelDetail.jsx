import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon'
import { categoryLabel, genderLabel, formatRupees, getProductBySlug, PLACEHOLDER_SIZES } from './publicApparelHelpers'
import { useCart } from './CartContext'

export default function ApparelDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [activeImg, setActiveImg] = useState(0)
  const [selSize, setSelSize]     = useState('')
  const [selColor, setSelColor]   = useState('')
  const [qty, setQty]             = useState(1)
  const [qtyError, setQtyError]   = useState('')
  const [added, setAdded]         = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setActiveImg(0)
    setSelSize('')
    setSelColor('')
    setQty(1)
    setQtyError('')
    getProductBySlug(slug)
      .then((d) => { if (!cancelled) setData(d) })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  const product  = data?.product
  const images   = data?.images || []
  const variants = data?.variants || []

  const sizes  = useMemo(() => Array.from(new Set(variants.map((v) => v.size))), [variants])
  const sizeForColors = selSize || (sizes.length === 1 ? sizes[0] : '')
  const colors = useMemo(() => {
    if (!sizeForColors) return Array.from(new Set(variants.map((v) => v.color)))
    return Array.from(new Set(variants.filter((v) => v.size === sizeForColors).map((v) => v.color)))
  }, [variants, sizeForColors])

  // A single-option product (most games and consoles) has nothing to choose, so
  // resolve it without waiting for a click. Only a genuine multi-option product
  // stays unresolved until the shopper picks.
  // A synthetic single variant (console, game) carries no real choice, so the
  // selector stays hidden. Genuine one-size-left apparel still shows its size.
  const showSizes = sizes.length > 1 || (sizes.length === 1 && !PLACEHOLDER_SIZES.includes(sizes[0]))

  const effSize  = sizeForColors
  const effColor = selColor || (colors.length === 1 ? colors[0] : '')

  const activeVariant = useMemo(() => {
    if (!variants.length) return null
    if (sizes.length > 0 && !effSize) return null
    if (colors.length > 0 && !effColor) return null
    return (
      variants.find(
        (v) =>
          (sizes.length === 0 || v.size === effSize) &&
          (colors.length === 0 || v.color === effColor)
      ) || null
    )
  }, [variants, sizes, colors, effSize, effColor])

  const maxQty  = activeVariant?.quantity || 0
  const inStock = maxQty > 0

  // Derived, not synced: a variant switch onto smaller stock clamps the shown qty
  // without an extra render pass, and switching back restores what was picked.
  const shownQty = Math.min(Math.max(1, qty), Math.max(1, maxQty))

  const increaseQty = () => {
    if (!activeVariant) return
    if (shownQty >= maxQty) {
      setQtyError(`Only ${maxQty} available in this option.`)
      return
    }
    setQtyError('')
    setQty(shownQty + 1)
  }

  const decreaseQty = () => {
    setQtyError('')
    setQty(Math.max(1, shownQty - 1))
  }

  // Reset color when size changes if previously selected color no longer available
  useEffect(() => {
    if (selSize && selColor && !colors.includes(selColor)) setSelColor('')
  }, [selSize, selColor, colors])

  const handleAdd = () => {
    if (!product || !activeVariant || !inStock) return false
    const safeQty = Math.min(shownQty, maxQty)
    addItem({
      variant_id: activeVariant.id,
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      size: activeVariant.size,
      color: activeVariant.color,
      option1_label: product.option1_label || 'Size',
      option2_label: product.option2_label || '',
      unit_price: Number(product.price) || 0,
      image_url: product.primary_image_url || images[0]?.image_url || null,
      stock: activeVariant.quantity,
    }, safeQty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
    return true
  }

  const handleBuyNow = () => {
    if (!handleAdd()) return
    navigate('/apparels/checkout')
  }

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-[3/4] bg-surface-container animate-pulse rounded-2xl" />
          <div className="space-y-3">
            <div className="h-6 bg-surface-container animate-pulse rounded w-1/3" />
            <div className="h-8 bg-surface-container animate-pulse rounded w-3/4" />
            <div className="h-10 bg-surface-container animate-pulse rounded w-1/3" />
            <div className="h-24 bg-surface-container animate-pulse rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 text-center">
        <Icon name="error_outline" className="!text-5xl text-on-surface-variant mb-2" />
        <p className="font-body-md text-on-surface-variant">{error || 'Product not found.'}</p>
        <Link to="/apparels" className="inline-block mt-4 text-primary-fixed font-bold underline">
          ← Back to shop
        </Link>
      </div>
    )
  }

  const discounted = product.mrp && product.mrp > product.price
  const off = discounted ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0
  const allImages = images.length
    ? images.map((i) => i.image_url)
    : product.primary_image_url ? [product.primary_image_url] : []
  const opt1Label = product.option1_label || 'Size'
  const opt2Label = product.option2_label || ''

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-6 sm:py-8">
      <Link to="/apparels" className="font-body-md text-sm text-on-surface-variant hover:text-primary-fixed inline-flex items-center gap-1 mb-4">
        <Icon name="arrow_back" className="!text-base" /> Back to shop
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* GALLERY */}
        <div>
          <div className="aspect-[3/4] bg-surface-container rounded-2xl overflow-hidden border border-outline-variant/20 relative">
            {allImages[activeImg] ? (
              <img src={allImages[activeImg]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                <Icon name="checkroom" className="!text-6xl opacity-40" />
              </div>
            )}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImg((i) => (i - 1 + allImages.length) % allImages.length)}
                  className="absolute top-1/2 left-2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center"
                  aria-label="Previous"
                >
                  <Icon name="chevron_left" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImg((i) => (i + 1) % allImages.length)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center"
                  aria-label="Next"
                >
                  <Icon name="chevron_right" />
                </button>
              </>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2 mt-3">
              {allImages.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    activeImg === i ? 'border-primary-fixed' : 'border-outline-variant/30 hover:border-primary-fixed/50'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-label-mono text-label-mono text-on-surface-variant uppercase">
                {categoryLabel(product.category)}
              </span>
              {product.gender && product.gender !== 'na' && (
                <span className="font-label-mono text-label-mono text-primary-fixed uppercase">
                  · {genderLabel(product.gender) || product.gender}
                </span>
              )}
            </div>
            <h1 className="font-display-lg text-headline-lg sm:text-3xl text-on-surface">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            <p className="font-display-lg text-3xl text-primary-fixed font-bold">{formatRupees(product.price)}</p>
            {discounted && (
              <>
                <p className="font-body-md text-on-surface-variant line-through">{formatRupees(product.mrp)}</p>
                <span className="font-label-mono text-xs uppercase bg-primary-fixed/10 text-primary-fixed border border-primary-fixed/30 rounded px-2 py-0.5">
                  {off}% off
                </span>
              </>
            )}
          </div>
          <p className="font-body-md text-xs text-on-surface-variant">Inclusive of all taxes.</p>

          {product.description && (
            <p className="font-body-md text-on-surface-variant whitespace-pre-line">{product.description}</p>
          )}

          {/* OPTION 1 (size / weight / pack / …) */}
          {showSizes && (
            <div>
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">
                Select {opt1Label.toLowerCase()}
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const active = effSize === s
                  const anyStock = variants.some((v) => v.size === s && (v.quantity || 0) > 0)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSelSize(s); setQtyError('') }}
                      disabled={!anyStock}
                      className={`min-w-[3rem] px-3 py-2 rounded-lg border-2 font-body-md font-bold text-sm transition-all ${
                        active
                          ? 'border-primary-fixed bg-primary-fixed text-on-primary-fixed'
                          : anyStock
                            ? 'border-outline-variant/40 bg-surface-container text-on-surface hover:border-primary-fixed/50'
                            : 'border-outline-variant/20 bg-surface-container text-on-surface-variant/40 line-through cursor-not-allowed'
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* OPTION 2 (color / flavor / …) — hidden when label is blank or every variant is the default */}
          {opt2Label && colors.filter((c) => c !== 'Default').length > 0 && (
            <div>
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">{opt2Label}</p>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const active = effColor === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setSelColor(c); setQtyError('') }}
                      className={`px-3 py-2 rounded-lg border-2 font-body-md font-bold text-sm transition-all ${
                        active
                          ? 'border-primary-fixed bg-primary-fixed text-on-primary-fixed'
                          : 'border-outline-variant/40 bg-surface-container text-on-surface hover:border-primary-fixed/50'
                      }`}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* QTY */}
          <div>
            <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">Quantity</p>
            <div className="inline-flex items-center bg-surface-container border border-outline-variant/30 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={decreaseQty}
                className="w-10 h-10 text-on-surface-variant hover:text-on-surface"
                aria-label="Decrease"
              >
                <Icon name="remove" className="!text-base" />
              </button>
              <span className="w-12 text-center font-body-md font-bold text-on-surface">{shownQty}</span>
              <button
                type="button"
                onClick={increaseQty}
                disabled={!activeVariant || shownQty >= maxQty}
                className="w-10 h-10 text-on-surface-variant hover:text-on-surface"
                aria-label="Increase"
              >
                <Icon name="add" className="!text-base" />
              </button>
            </div>
            {qtyError ? (
              <p className="font-body-md text-xs mt-2 text-red-400 flex items-center gap-1">
                <Icon name="error" className="!text-sm" filled />
                {qtyError}
              </p>
            ) : (
              activeVariant && (
                <p className={`font-body-md text-xs mt-2 ${inStock ? 'text-on-surface-variant' : 'text-red-400'}`}>
                  {inStock ? `${maxQty} in stock` : 'Out of stock'}
                </p>
              )
            )}
          </div>

          {/* CTAs */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!activeVariant || !inStock}
              className="flex-1 border-2 border-primary-fixed text-primary-fixed px-6 py-3 rounded-xl font-bold hover:bg-primary-fixed/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name={added ? 'check' : 'shopping_bag'} className="!text-base" />
              {added ? 'Added to cart' : 'Add to cart'}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!activeVariant || !inStock}
              className="flex-1 bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform neon-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Icon name="bolt" className="!text-base" />
              Buy now
            </button>
          </div>

          {!activeVariant && (showSizes || colors.length > 0) && (
            <p className="font-body-md text-xs text-on-surface-variant">
              Select {effSize ? '' : opt1Label.toLowerCase()}
              {!effSize && !effColor && opt2Label && colors.filter((c) => c !== 'Default').length > 0 ? ' and ' : ''}
              {effColor || !opt2Label ? '' : (colors.filter((c) => c !== 'Default').length > 0 ? opt2Label.toLowerCase() : '')}
              {' '}to continue.
            </p>
          )}

          {/* TRUST */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-outline-variant/20">
            <Perk icon="local_shipping" label="Nagpur home delivery" />
            <Perk icon="payments"       label="Cash on delivery" />
            <Perk icon="verified"       label="Genuine products" />
          </div>
        </div>
      </div>

      {/* SPECIFICATIONS */}
      {Array.isArray(product.specifications) && product.specifications.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display-lg text-headline-md text-on-surface mb-4">Specifications</h2>
          <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 overflow-hidden">
            <table className="w-full">
              <tbody>
                {product.specifications.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-surface-container-low/30' : ''}>
                    <td className="font-label-mono text-label-mono text-on-surface-variant uppercase px-4 py-3 w-1/3 align-top">
                      {s.label}
                    </td>
                    <td className="font-body-md text-on-surface px-4 py-3">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function Perk({ icon, label }) {
  return (
    <div className="flex flex-col items-center text-center gap-1 py-2">
      <Icon name={icon} className="!text-2xl text-primary-fixed" />
      <span className="font-body-md text-xs text-on-surface-variant">{label}</span>
    </div>
  )
}
