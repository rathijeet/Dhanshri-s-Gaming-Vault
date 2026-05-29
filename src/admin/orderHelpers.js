import { supabase } from '../lib/supabase'
import { adjustVariantQuantity } from './apparelHelpers'

export const ORDER_STATUSES = [
  { id: 'pending',   label: 'Pending',   icon: 'schedule',           color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  { id: 'confirmed', label: 'Confirmed', icon: 'check_circle',       color: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
  { id: 'packed',    label: 'Packed',    icon: 'inventory_2',        color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30' },
  { id: 'shipped',   label: 'Shipped',   icon: 'local_shipping',     color: 'text-purple-300 bg-purple-500/10 border-purple-500/30' },
  { id: 'delivered', label: 'Delivered', icon: 'task_alt',           color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  { id: 'cancelled', label: 'Cancelled', icon: 'cancel',             color: 'text-red-400 bg-red-500/10 border-red-500/30' },
]

export const ORDER_STATUS_LABEL = Object.fromEntries(ORDER_STATUSES.map((s) => [s.id, s.label]))
export const ORDER_STATUS_ICON  = Object.fromEntries(ORDER_STATUSES.map((s) => [s.id, s.icon]))
export const ORDER_STATUS_COLOR = Object.fromEntries(ORDER_STATUSES.map((s) => [s.id, s.color]))

export const PAYMENT_METHODS = [
  { id: 'cod',      label: 'Cash on Delivery' },
  { id: 'upi',      label: 'UPI' },
  { id: 'whatsapp', label: 'WhatsApp / Manual' },
]
export const PAYMENT_METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map((p) => [p.id, p.label]))

export function formatRupees(n) {
  if (typeof n !== 'number') return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

export function formatDateTime(value) {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function generateOrderNumber() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `DA${ymd}-${rand}`
}

// ---------- CRUD ----------
export async function listOrders() {
  const { data, error } = await supabase
    .from('apparel_orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getOrder(id) {
  const { data, error } = await supabase
    .from('apparel_orders')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createOrder(payload) {
  const order_number = payload.order_number || generateOrderNumber()
  const { data, error } = await supabase
    .from('apparel_orders')
    .insert({ ...payload, order_number })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateOrderStatus(id, status, notes) {
  const patch = { status }
  if (notes !== undefined) patch.notes = notes
  const { data, error } = await supabase
    .from('apparel_orders')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteOrder(id) {
  const { error } = await supabase.from('apparel_orders').delete().eq('id', id)
  if (error) throw error
}

// Decrement stock when order is confirmed. Reverses if cancelled-after-confirmed.
export async function applyInventoryChange(order, direction) {
  // direction: -1 to deduct, +1 to restore
  if (!Array.isArray(order?.items)) return
  for (const it of order.items) {
    if (!it.variant_id) continue
    try {
      await adjustVariantQuantity(it.variant_id, direction * (Number(it.qty) || 0))
    } catch (err) {
      console.warn('[orders] inventory adjust failed for variant', it.variant_id, err)
    }
  }
}
