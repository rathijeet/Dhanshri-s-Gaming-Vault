export const CATEGORIES = [
  { id: 'console',     label: 'Console',     icon: 'videogame_asset' },
  { id: 'controller',  label: 'Controller',  icon: 'sports_esports' },
  { id: 'game',        label: 'Game',        icon: 'album' },
  { id: 'accessory',   label: 'Accessory',   icon: 'cable' },
  { id: 'battery',     label: 'Battery',     icon: 'battery_charging_full' },
  { id: 'maintenance', label: 'Maintenance', icon: 'build' },
  { id: 'utility',     label: 'Utility',     icon: 'receipt_long' },
  { id: 'other',       label: 'Other',       icon: 'more_horiz' },
]

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))
export const CATEGORY_ICON = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.icon]))

export const LINKED_CONSOLES = [
  { id: 'ps5',  label: 'PlayStation 5' },
  { id: 'ps4',  label: 'PlayStation 4' },
  { id: 'xbox', label: 'Xbox Series S' },
]

export function formatRupees(n) {
  if (typeof n !== 'number') return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

export function formatDate(value) {
  if (!value) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
