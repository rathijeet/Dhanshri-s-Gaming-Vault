import { supabase } from '../lib/supabase'

// Public catalogue read. RLS exposes only status='active' rows, and never the
// pc_component_prices history — customers see current_price, not what you paid
// or which seller you use.
export async function fetchCatalogue() {
  const { data, error } = await supabase
    .from('pc_components')
    .select('*')
    .eq('status', 'active')
    .order('type', { ascending: true })
  if (error) throw error
  return data || []
}

export function formatRupees(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

// Compact form for headline figures: ₹4.31L / ₹1.2Cr
export function formatShort(n) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '—'
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}
