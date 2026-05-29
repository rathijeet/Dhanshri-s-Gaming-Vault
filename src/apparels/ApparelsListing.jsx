import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { categoryLabel, genderLabel, formatRupees, listActiveProducts } from './publicApparelHelpers'

const GENDER_ORDER = ['men', 'women', 'boys', 'girls', 'unisex']

export default function ApparelsListing() {
  const [rows, setRows]     = useState([])
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState('')
  const [cat, setCat]       = useState('all')
  const [gen, setGen]       = useState('all')

  useEffect(() => {
    let cancelled = false
    setLoad(true)
    listActiveProducts()
      .then((d) => { if (!cancelled) setRows(d) })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load') })
      .finally(() => { if (!cancelled) setLoad(false) })
    return () => { cancelled = true }
  }, [])

  // Build category filter from products present in the catalog
  const categoryFilters = useMemo(() => {
    const seen = new Set()
    const out = [{ id: 'all', label: 'All' }]
    for (const r of rows) {
      if (r.category && !seen.has(r.category)) {
        seen.add(r.category)
        out.push({ id: r.category, label: categoryLabel(r.category) })
      }
    }
    return out
  }, [rows])

  // Build gender filter from products that actually have a gender set
  const genderFilters = useMemo(() => {
    const seen = new Set()
    for (const r of rows) {
      if (r.gender && r.gender !== 'na') seen.add(r.gender)
    }
    if (seen.size === 0) return []
    const ordered = GENDER_ORDER.filter((g) => seen.has(g))
    return [{ id: 'all', label: 'Everyone' }, ...ordered.map((g) => ({ id: g, label: genderLabel(g) || g }))]
  }, [rows])

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      (cat === 'all' || r.category === cat) &&
      (gen === 'all' || r.gender === gen)
    )
  }, [rows, cat, gen])

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
      {/* HERO */}
      <section className="bg-surface-container-high border border-primary-fixed/20 rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-2">New arrivals</p>
          <h1 className="font-display-lg text-headline-lg sm:text-4xl text-on-surface mb-3">
            Everything you need, <span className="text-primary-fixed">delivered from Nagpur.</span>
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-xl">
            Hand-picked apparel, accessories, toys and more — curated by Dhanshri's Store.
            Pan-India shipping, cash on delivery available.
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <div className="space-y-3 mb-6">
        {categoryFilters.length > 1 && (
          <FilterRow label="Category" filters={categoryFilters} value={cat} onChange={setCat} />
        )}
        {genderFilters.length > 0 && (
          <FilterRow label="For"      filters={genderFilters}   value={gen} onChange={setGen} />
        )}
      </div>

      {/* GRID */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="bg-error-container/20 border border-error/40 rounded-2xl p-6 text-center">
          <p className="font-body-md text-error">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-high border border-outline-variant/20 rounded-2xl p-10 text-center">
          <Icon name="checkroom" className="!text-4xl text-on-surface-variant mb-2" />
          <p className="font-body-md text-on-surface-variant">No products match the filters yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}

function FilterRow({ label, filters, value, onChange }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1">
      <span className="font-label-mono text-label-mono text-on-surface-variant uppercase whitespace-nowrap shrink-0">
        {label}
      </span>
      <div className="flex gap-2">
        {filters.map((f) => {
          const active = value === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(f.id)}
              className={`px-3 py-1.5 rounded-full font-body-md text-sm font-bold whitespace-nowrap transition-all border ${
                active
                  ? 'bg-primary-fixed text-on-primary-fixed border-primary-fixed'
                  : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:border-primary-fixed/50 hover:text-on-surface'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProductCard({ product }) {
  const discounted = product.mrp && product.mrp > product.price
  const off = discounted ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0

  return (
    <Link
      to={`/apparels/${product.slug}`}
      className="bg-surface-container-high rounded-2xl border border-outline-variant/20 overflow-hidden hover:border-primary-fixed/40 transition-colors group flex flex-col"
    >
      <div className="aspect-[3/4] bg-surface-container relative overflow-hidden">
        {product.primary_image_url ? (
          <img
            src={product.primary_image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <Icon name="checkroom" className="!text-5xl opacity-40" />
          </div>
        )}
        {off > 0 && (
          <span className="absolute top-2 left-2 font-label-mono text-[10px] uppercase bg-primary-fixed text-on-primary-fixed px-1.5 py-0.5 rounded">
            {off}% OFF
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4 flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-label-mono text-[10px] text-on-surface-variant uppercase">
            {categoryLabel(product.category)}
          </span>
          {product.gender && product.gender !== 'na' && (
            <span className="font-label-mono text-[10px] text-primary-fixed uppercase">
              · {genderLabel(product.gender) || product.gender}
            </span>
          )}
        </div>
        <h3 className="font-headline-sm text-body-md sm:text-body-lg font-bold text-on-surface line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 mt-auto pt-1">
          <p className="font-display-lg text-body-lg sm:text-headline-sm text-primary-fixed font-bold">
            {formatRupees(product.price)}
          </p>
          {discounted && (
            <p className="font-body-md text-xs sm:text-sm text-on-surface-variant line-through">
              {formatRupees(product.mrp)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

function Skeleton() {
  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 overflow-hidden">
      <div className="aspect-[3/4] bg-surface-container animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-surface-container animate-pulse rounded w-1/3" />
        <div className="h-4 bg-surface-container animate-pulse rounded w-3/4" />
        <div className="h-5 bg-surface-container animate-pulse rounded w-1/2" />
      </div>
    </div>
  )
}
