import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'dhanshri.apparels.cart.v1'

const CartContext = createContext(null)

function readStorage() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((it) => it && it.variant_id && typeof it.unit_price === 'number')
  } catch {
    return []
  }
}

function writeStorage(items) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* quota / private mode */
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStorage)

  useEffect(() => { writeStorage(items) }, [items])

  // sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return
      setItems(readStorage())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addItem = useCallback((item, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.variant_id === item.variant_id)
      if (idx >= 0) {
        const next = prev.slice()
        const cap = item.stock ?? Infinity
        next[idx] = { ...next[idx], qty: Math.min(cap, next[idx].qty + qty) }
        return next
      }
      return [...prev, { ...item, qty: Math.max(1, qty) }]
    })
  }, [])

  const updateQty = useCallback((variantId, qty) => {
    setItems((prev) =>
      prev
        .map((i) => (i.variant_id === variantId ? { ...i, qty: Math.max(0, Number(qty) || 0) } : i))
        .filter((i) => i.qty > 0)
    )
  }, [])

  const removeItem = useCallback((variantId) => {
    setItems((prev) => prev.filter((i) => i.variant_id !== variantId))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const { subtotal, count } = useMemo(() => {
    let sub = 0
    let c = 0
    for (const i of items) {
      sub += (Number(i.unit_price) || 0) * (Number(i.qty) || 0)
      c += Number(i.qty) || 0
    }
    return { subtotal: sub, count: c }
  }, [items])

  const value = useMemo(
    () => ({ items, addItem, updateQty, removeItem, clear, subtotal, count }),
    [items, addItem, updateQty, removeItem, clear, subtotal, count],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
