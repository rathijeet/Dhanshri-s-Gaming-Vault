import { supabase } from '../lib/supabase'
import { slugify, uploadProductImage } from './apparelHelpers'

// Component images live in the existing public `apparel-images` bucket under a
// `components/` prefix — see the storage note at the foot of sql/006.
export function uploadComponentImage(file, componentSlug) {
  return uploadProductImage(file, `components/${componentSlug || 'misc'}`)
}

export { slugify }

// ---------- taxonomy ----------
// `id` is what gets stored in pc_components.type.
export const COMPONENT_TYPES = [
  { id: 'cpu',         label: 'Processor',    icon: 'memory',              fields: ['socket', 'tdp_watts'] },
  { id: 'gpu',         label: 'Graphics Card', icon: 'auto_awesome_mosaic', fields: ['vram_gb', 'tdp_watts', 'length_mm'] },
  { id: 'motherboard', label: 'Motherboard',  icon: 'developer_board',     fields: ['socket', 'ram_type', 'form_factor', 'pcie_slots'] },
  { id: 'ram',         label: 'Memory',       icon: 'view_module',         fields: ['ram_type', 'capacity_gb', 'module_count'] },
  { id: 'storage',     label: 'Storage',      icon: 'hard_drive',          fields: ['capacity_gb'] },
  { id: 'psu',         label: 'Power Supply', icon: 'bolt',                fields: ['psu_watts'] },
  { id: 'case',        label: 'Cabinet',      icon: 'dns',                 fields: ['supported_form_factors', 'max_gpu_length_mm', 'max_cooler_height_mm'] },
  { id: 'cooler',      label: 'Cooling',      icon: 'mode_fan',            fields: ['height_mm', 'cooling_capacity_watts'] },
  { id: 'os',          label: 'OS / Licence', icon: 'terminal',            fields: [] },
  { id: 'monitor',     label: 'Monitor',      icon: 'desktop_windows',     fields: [] },
  { id: 'peripheral',  label: 'Peripheral',   icon: 'keyboard',            fields: [] },
  { id: 'network',     label: 'Networking',   icon: 'router',              fields: [] },
]

export const TYPE_LABEL = Object.fromEntries(COMPONENT_TYPES.map((t) => [t.id, t.label]))
export const TYPE_ICON  = Object.fromEntries(COMPONENT_TYPES.map((t) => [t.id, t.icon]))

export function typeLabel(id) {
  if (!id) return '—'
  if (TYPE_LABEL[id]) return TYPE_LABEL[id]
  return id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function typeIcon(id) {
  return TYPE_ICON[id] || 'memory'
}

export const STATUSES = [
  { id: 'draft',    label: 'Draft' },
  { id: 'active',   label: 'Active' },
  { id: 'archived', label: 'Archived' },
]
export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]))

export const AVAILABILITIES = [
  { id: 'in_stock',        label: 'In stock' },
  { id: 'order_on_demand', label: 'Order on demand' },
  { id: 'discontinued',    label: 'Discontinued' },
]
export const AVAILABILITY_LABEL = Object.fromEntries(AVAILABILITIES.map((a) => [a.id, a.label]))

// ---------- compatibility field metadata ----------
// Only the fields the build engine actually joins on. Each component type
// declares which of these it uses (see COMPONENT_TYPES above), and the form
// renders exactly that set — so a CPU never asks for VRAM.
export const COMPAT_FIELDS = {
  socket:      { label: 'Socket',              input: 'text',   placeholder: 'AM5, LGA1851…' },
  ram_type:    { label: 'Memory type',         input: 'select', options: ['DDR4', 'DDR5'] },
  form_factor: { label: 'Form factor',         input: 'select', options: ['ATX', 'mATX', 'ITX', 'E-ATX'] },
  supported_form_factors: {
    label: 'Supported board sizes', input: 'multi', options: ['ATX', 'mATX', 'ITX', 'E-ATX'],
    hint: 'Which motherboard sizes fit in this cabinet.',
  },
  tdp_watts:            { label: 'TDP — power drawn (W)',   input: 'number', placeholder: '120' },
  cooling_capacity_watts: {
    label: 'Cooling capacity (W)', input: 'number', placeholder: '280',
    hint: 'Heat this cooler can dissipate — kept separate from TDP so a build’s power draw never double-counts it.',
  },
  psu_watts:            { label: 'Rated wattage (W)',       input: 'number', placeholder: '850' },
  length_mm:            { label: 'Card length (mm)',        input: 'number', placeholder: '336' },
  max_gpu_length_mm:    { label: 'Max GPU length (mm)',     input: 'number', placeholder: '400' },
  height_mm:            { label: 'Cooler height (mm)',      input: 'number', placeholder: '158' },
  max_cooler_height_mm: { label: 'Max cooler height (mm)',  input: 'number', placeholder: '170' },
  vram_gb:              { label: 'VRAM (GB)',               input: 'number', placeholder: '24',
                          hint: 'Decisive for AI workloads — 24GB runs most 30B models at Q4.' },
  capacity_gb:          { label: 'Capacity (GB)',           input: 'number', placeholder: '32' },
  module_count:         { label: 'Modules in kit',          input: 'number', placeholder: '2' },
  pcie_slots:           { label: 'PCIe x16 slots',          input: 'number', placeholder: '2',
                          hint: 'Needed to validate multi-GPU builds.' },
}

// A few fields read better retitled for the part they sit on.
const FIELD_LABEL_OVERRIDES = {
  storage: { capacity_gb: 'Capacity (GB)' },
}

export function fieldsForType(type) {
  const def = COMPONENT_TYPES.find((t) => t.id === type)
  if (!def) return []
  const overrides = FIELD_LABEL_OVERRIDES[type] || {}
  return def.fields.map((key) => ({
    key,
    ...COMPAT_FIELDS[key],
    label: overrides[key] || COMPAT_FIELDS[key].label,
  }))
}

// Every typed compatibility column, used to null out fields that don't apply
// when an admin switches a component's type.
export const ALL_COMPAT_KEYS = Object.keys(COMPAT_FIELDS)

// ---------- price staleness ----------
// Component prices move weekly in the Indian market; anything older than this
// is flagged in the list so the owner knows to re-verify before quoting.
export const STALE_AFTER_DAYS = 14

export function priceAgeDays(priceUpdatedAt) {
  if (!priceUpdatedAt) return null
  const then = new Date(priceUpdatedAt).getTime()
  if (Number.isNaN(then)) return null
  return Math.floor((Date.now() - then) / 86400000)
}

export function isPriceStale(priceUpdatedAt, days = STALE_AFTER_DAYS) {
  const age = priceAgeDays(priceUpdatedAt)
  return age === null || age >= days
}

// ---------- sellers ----------
// Deep links so re-verifying a price is a click, not a search. `search` is a
// template with {q} replaced by the part name — correct these if a retailer
// changes its URL scheme.
export const SELLERS = [
  { id: 'mdcomputers', label: 'MDComputers', search: 'https://mdcomputers.in/index.php?route=product/search&search={q}' },
  { id: 'primeabgb',   label: 'PrimeABGB',   search: 'https://www.primeabgb.com/?s={q}&post_type=product' },
  { id: 'vedant',      label: 'Vedant',      search: 'https://www.vedantcomputers.com/index.php?route=product/search&search={q}' },
  { id: 'theitgear',   label: 'The IT Gear', search: 'https://theitgear.com/?s={q}' },
  { id: 'vendor',      label: 'Vendor quote', search: null },
]
export const SELLER_LABEL = Object.fromEntries(SELLERS.map((s) => [s.id, s.label]))

export function sellerSearchUrl(sellerId, query) {
  const seller = SELLERS.find((s) => s.id === sellerId)
  if (!seller?.search) return null
  return seller.search.replace('{q}', encodeURIComponent(query || ''))
}

export const PRICE_SOURCES = [
  { id: 'manual',       label: 'Checked manually' },
  { id: 'vendor_quote', label: 'Vendor quote' },
  { id: 'scraper',      label: 'Automated' },
]

// ---------- formatters ----------
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

// ---------- component CRUD ----------
export async function listComponents() {
  const { data, error } = await supabase
    .from('pc_components')
    .select('*')
    .order('type', { ascending: true })
    .order('current_price', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data || []
}

export async function getComponent(id) {
  const { data, error } = await supabase.from('pc_components').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

// pc_components.slug is UNIQUE. Brands reuse model names across generations,
// so resolve collisions rather than letting the insert fail.
export async function uniqueComponentSlug(base, { excludeId } = {}) {
  const root = slugify(base) || 'component'

  let q = supabase.from('pc_components').select('id, slug').like('slug', `${root}%`)
  if (excludeId) q = q.neq('id', excludeId)
  const { data, error } = await q
  if (error) throw error

  const taken = new Set((data || []).map((r) => r.slug))
  if (!taken.has(root)) return root

  let n = 2
  while (taken.has(`${root}-${n}`)) n += 1
  return `${root}-${n}`
}

export async function upsertComponent(payload, id) {
  if (id) {
    const { data, error } = await supabase
      .from('pc_components')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase
    .from('pc_components')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteComponent(id) {
  const { error } = await supabase.from('pc_components').delete().eq('id', id)
  if (error) throw error
}

// ---------- price history ----------
// current_price / price_updated_at on the parent row are maintained by the
// trg_pc_component_prices_sync trigger — never write them from here.
export async function listComponentPrices(componentId) {
  const { data, error } = await supabase
    .from('pc_component_prices')
    .select('*')
    .eq('component_id', componentId)
    .order('fetched_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addComponentPrice({ componentId, seller, price, url, source = 'manual' }) {
  const { data, error } = await supabase
    .from('pc_component_prices')
    .insert({
      component_id: componentId,
      seller,
      price: Number(price),
      url: url || null,
      source,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteComponentPrice(id) {
  const { error } = await supabase.from('pc_component_prices').delete().eq('id', id)
  if (error) throw error
}
