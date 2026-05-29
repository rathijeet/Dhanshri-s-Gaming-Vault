import { supabase } from '../lib/supabase'

// Suggested categories — admin can type any custom value too.
// `id` is what gets stored in the DB; `label` and `icon` are display-only.
export const CATEGORIES = [
  { id: 'tshirt',      label: 'T-Shirt',        icon: 'checkroom' },
  { id: 'pants',       label: 'Pants',          icon: 'styler' },
  { id: 'combo',       label: 'Combo',          icon: 'inventory_2' },
  { id: 'hoodie',      label: 'Hoodie',         icon: 'dry_cleaning' },
  { id: 'footwear',    label: 'Footwear',       icon: 'ice_skating' },
  { id: 'accessories', label: 'Accessories',    icon: 'watch' },
  { id: 'mobile',      label: 'Mobile',         icon: 'smartphone' },
  { id: 'tv',          label: 'TV',             icon: 'tv' },
  { id: 'laptop',      label: 'Laptop',         icon: 'laptop' },
  { id: 'electronics', label: 'Electronics',    icon: 'devices' },
  { id: 'toys',        label: 'Toys & Games',   icon: 'toys' },
  { id: 'school',      label: 'School',         icon: 'school' },
  { id: 'books',       label: 'Books',          icon: 'menu_book' },
  { id: 'home',        label: 'Home & Decor',   icon: 'chair' },
  { id: 'beauty',      label: 'Beauty',         icon: 'spa' },
  { id: 'sports',      label: 'Sports',         icon: 'sports_basketball' },
  { id: 'food',        label: 'Food & Grocery', icon: 'restaurant' },
  { id: 'gift',        label: 'Gift Box',       icon: 'redeem' },
  { id: 'other',       label: 'Other',          icon: 'more_horiz' },
]

export const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))
export const CATEGORY_ICON  = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.icon]))

// Return a friendly label for any stored category — falls back to titlecase for custom values.
export function categoryLabel(id) {
  if (!id) return '—'
  if (CATEGORY_LABEL[id]) return CATEGORY_LABEL[id]
  return id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function categoryIcon(id) {
  return CATEGORY_ICON[id] || 'inventory_2'
}

export const GENDERS = [
  { id: 'na',      label: 'Not applicable' },
  { id: 'men',     label: 'Men' },
  { id: 'women',   label: 'Women' },
  { id: 'boys',    label: 'Boys' },
  { id: 'girls',   label: 'Girls' },
  { id: 'unisex',  label: 'Unisex' },
]
export const GENDER_LABEL = Object.fromEntries(GENDERS.map((g) => [g.id, g.label]))

export const STATUSES = [
  { id: 'draft',    label: 'Draft' },
  { id: 'active',   label: 'Active' },
  { id: 'archived', label: 'Archived' },
]
export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]))

export const ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
export const KID_SIZES   = ['2-3y', '4-5y', '6-7y', '8-9y', '10-11y', '12-13y', '14-15y']
export const PANT_SIZES  = ['28', '30', '32', '34', '36', '38', '40']
export const WEIGHT_PRESETS = ['100g', '250g', '500g', '1 kg', '2 kg', '5 kg']
export const PACK_PRESETS   = ['Small', 'Medium', 'Large', 'Family Pack']

// Suggested option-label values for the variant picker in the form.
export const OPTION_LABEL_PRESETS = ['Size', 'Weight', 'Pack', 'Flavor', 'Color', 'Capacity', 'Length', 'Material', 'Style']

export const STORAGE_BUCKET = 'apparel-images'

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

export function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function sizesForCategoryGender(category, gender) {
  if (category === 'pants') return PANT_SIZES
  if (gender === 'boys' || gender === 'girls') return KID_SIZES
  return ADULT_SIZES
}

// Pick a sensible preset list based on what the admin called the option.
export function presetsForOptionLabel(label, category, gender) {
  const l = (label || '').trim().toLowerCase()
  if (l === 'weight')                 return WEIGHT_PRESETS
  if (l === 'pack' || l === 'pack size') return PACK_PRESETS
  if (l === 'size')                   return sizesForCategoryGender(category, gender)
  return []
}

// ---------- storage ----------
export async function uploadProductImage(file, productSlug) {
  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  const path = `${productSlug || 'misc'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || `image/${ext}`,
  })
  if (error) throw error
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

// ---------- product CRUD ----------
export async function listProducts() {
  const { data, error } = await supabase
    .from('apparel_products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getProductWithRelations(id) {
  const [{ data: product, error: e1 }, { data: images, error: e2 }, { data: variants, error: e3 }] = await Promise.all([
    supabase.from('apparel_products').select('*').eq('id', id).single(),
    supabase.from('apparel_product_images').select('*').eq('product_id', id).order('sort_order', { ascending: true }),
    supabase.from('apparel_product_variants').select('*').eq('product_id', id).order('size', { ascending: true }),
  ])
  if (e1) throw e1
  if (e2) throw e2
  if (e3) throw e3
  return { product, images: images || [], variants: variants || [] }
}

export async function upsertProduct(payload, id) {
  if (id) {
    const { data, error } = await supabase
      .from('apparel_products')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase
    .from('apparel_products')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('apparel_products').delete().eq('id', id)
  if (error) throw error
}

// ---------- images ----------
export async function replaceProductImages(productId, imageRows) {
  // wipe and reinsert — simpler than diffing for small galleries
  const { error: delErr } = await supabase
    .from('apparel_product_images')
    .delete()
    .eq('product_id', productId)
  if (delErr) throw delErr
  if (!imageRows.length) return []
  const rows = imageRows.map((r, idx) => ({
    product_id: productId,
    image_url: r.image_url,
    sort_order: idx,
  }))
  const { data, error } = await supabase
    .from('apparel_product_images')
    .insert(rows)
    .select()
  if (error) throw error
  return data
}

// ---------- variants ----------
export async function replaceProductVariants(productId, variants) {
  const { error: delErr } = await supabase
    .from('apparel_product_variants')
    .delete()
    .eq('product_id', productId)
  if (delErr) throw delErr
  if (!variants.length) return []
  const rows = variants.map((v) => ({
    product_id: productId,
    size: v.size,
    color: v.color || 'Default',
    quantity: Number(v.quantity) || 0,
    sku: v.sku || null,
  }))
  const { data, error } = await supabase
    .from('apparel_product_variants')
    .insert(rows)
    .select()
  if (error) throw error
  return data
}

export async function adjustVariantQuantity(variantId, delta) {
  const { data: row, error: e1 } = await supabase
    .from('apparel_product_variants')
    .select('quantity')
    .eq('id', variantId)
    .single()
  if (e1) throw e1
  const next = Math.max(0, (row?.quantity || 0) + delta)
  const { error: e2 } = await supabase
    .from('apparel_product_variants')
    .update({ quantity: next })
    .eq('id', variantId)
  if (e2) throw e2
  return next
}

// ============================================================
// SPECIFICATIONS — Amazon-style per-category spec templates.
// Each template entry is { label, type, options?, placeholder? }.
// Storage on the product row is a plain `[{label, value}]` array.
// ============================================================

const T_TEXT   = (label, placeholder) => ({ label, type: 'text', placeholder })
const T_SELECT = (label, options)     => ({ label, type: 'select', options })
const T_NUM    = (label, placeholder) => ({ label, type: 'number', placeholder })

export const SPEC_TEMPLATES = {
  mobile: [
    T_TEXT('Brand', 'e.g. Samsung'),
    T_TEXT('Model'),
    T_SELECT('RAM', ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB']),
    T_SELECT('Internal Storage', ['16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB']),
    T_TEXT('Display Size', 'e.g. 6.5 inches'),
    T_TEXT('Display Resolution', 'e.g. 1080 × 2400'),
    T_TEXT('Rear Camera', 'e.g. 50 MP + 8 MP'),
    T_TEXT('Front Camera', 'e.g. 16 MP'),
    T_TEXT('Battery', 'e.g. 5000 mAh'),
    T_TEXT('Processor'),
    T_SELECT('Operating System', ['Android', 'iOS', 'HarmonyOS', 'Other']),
    T_SELECT('Network', ['4G', '5G', '4G + 5G']),
    T_TEXT('SIM Slots', 'e.g. Dual SIM'),
    T_TEXT('In the Box'),
    T_TEXT('Warranty', 'e.g. 1 year manufacturer'),
  ],

  tv: [
    T_TEXT('Brand'),
    T_TEXT('Model'),
    T_TEXT('Screen Size', 'e.g. 43 inches'),
    T_SELECT('Display Type', ['LED', 'OLED', 'QLED', 'LCD', 'Mini-LED']),
    T_SELECT('Resolution', ['HD (720p)', 'Full HD (1080p)', '4K UHD (2160p)', '8K (4320p)']),
    T_SELECT('Smart TV', ['Yes', 'No']),
    T_TEXT('Operating System', 'e.g. Android TV, Google TV, Tizen'),
    T_SELECT('Refresh Rate', ['60 Hz', '120 Hz', '144 Hz']),
    T_NUM('HDMI Ports'),
    T_NUM('USB Ports'),
    T_TEXT('Audio Output', 'e.g. 20 W'),
    T_TEXT('Connectivity', 'e.g. Wi-Fi, Bluetooth, Ethernet'),
    T_TEXT('Warranty'),
  ],

  laptop: [
    T_TEXT('Brand'),
    T_TEXT('Model'),
    T_TEXT('Processor', 'e.g. Intel i5 12th gen'),
    T_SELECT('RAM', ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB']),
    T_TEXT('Storage', 'e.g. 512 GB SSD'),
    T_TEXT('Display Size', 'e.g. 15.6 inches'),
    T_TEXT('Display Resolution'),
    T_TEXT('Graphics', 'e.g. Intel UHD / NVIDIA RTX 3060'),
    T_TEXT('Operating System', 'e.g. Windows 11, macOS'),
    T_TEXT('Battery Life', 'e.g. up to 8 hours'),
    T_TEXT('Weight', 'e.g. 1.6 kg'),
    T_TEXT('Ports', 'e.g. 2× USB-C, 1× HDMI'),
    T_TEXT('Warranty'),
  ],

  electronics: [
    T_TEXT('Brand'),
    T_TEXT('Model'),
    T_TEXT('Power'),
    T_TEXT('In the Box'),
    T_TEXT('Warranty'),
  ],

  footwear: [
    T_TEXT('Brand'),
    T_TEXT('Upper Material', 'e.g. Mesh, Leather'),
    T_TEXT('Sole Material', 'e.g. Rubber, EVA'),
    T_SELECT('Closure', ['Lace-up', 'Slip-on', 'Velcro', 'Buckle', 'Zip']),
    T_SELECT('Use', ['Casual', 'Sports', 'Formal', 'Outdoor', 'Indoor']),
    T_TEXT('Pattern'),
    T_TEXT('Country of Origin', 'India'),
    T_TEXT('Warranty'),
  ],

  tshirt: [
    T_SELECT('Fabric', ['100% Cotton', 'Cotton Blend', 'Polyester', 'Linen', 'Viscose', 'Modal']),
    T_SELECT('Pattern', ['Solid', 'Printed', 'Striped', 'Checkered', 'Graphic', 'Typography']),
    T_SELECT('Sleeve', ['Half Sleeve', 'Full Sleeve', 'Sleeveless', '3/4 Sleeve']),
    T_SELECT('Fit', ['Regular', 'Slim', 'Oversized', 'Relaxed']),
    T_SELECT('Neck', ['Round Neck', 'V Neck', 'Polo Collar', 'Hooded', 'Henley']),
    T_TEXT('GSM', 'e.g. 180 GSM'),
    T_TEXT('Wash Care', 'e.g. Machine wash cold'),
    T_TEXT('Country of Origin', 'India'),
  ],

  pants: [
    T_SELECT('Fabric', ['Cotton', 'Denim', 'Linen', 'Polyester', 'Wool', 'Cotton Blend']),
    T_SELECT('Fit', ['Slim', 'Regular', 'Relaxed', 'Skinny', 'Straight']),
    T_SELECT('Pattern', ['Solid', 'Striped', 'Checkered', 'Printed']),
    T_SELECT('Rise', ['Low Rise', 'Mid Rise', 'High Rise']),
    T_SELECT('Closure', ['Zip & Button', 'Drawstring', 'Elastic', 'Hook & Bar']),
    T_TEXT('Wash Care'),
    T_TEXT('Country of Origin', 'India'),
  ],

  hoodie: [
    T_SELECT('Fabric', ['Cotton', 'Cotton Blend', 'Fleece', 'Polyester']),
    T_SELECT('Fit', ['Regular', 'Oversized', 'Slim']),
    T_SELECT('Hood', ['Drawstring', 'Without Drawstring']),
    T_SELECT('Pocket', ['Kangaroo', 'Side', 'None']),
    T_TEXT('GSM'),
    T_TEXT('Wash Care'),
  ],

  combo: [
    T_TEXT('Includes', 'e.g. 1 T-shirt + 1 Pant'),
    T_TEXT('Fabric'),
    T_TEXT('Wash Care'),
    T_TEXT('Country of Origin', 'India'),
  ],

  accessories: [
    T_TEXT('Brand'),
    T_TEXT('Material'),
    T_TEXT('Dimensions'),
    T_TEXT('Color'),
    T_TEXT('Country of Origin'),
  ],

  books: [
    T_TEXT('Author'),
    T_TEXT('Publisher'),
    T_TEXT('Language'),
    T_NUM('Number of Pages'),
    T_TEXT('Edition'),
    T_TEXT('ISBN'),
    T_SELECT('Format', ['Paperback', 'Hardcover', 'E-book']),
    T_TEXT('Publication Date'),
  ],

  toys: [
    T_TEXT('Brand'),
    T_TEXT('Age Range', 'e.g. 3-6 years'),
    T_TEXT('Material', 'e.g. Plastic, Wood'),
    T_SELECT('Batteries Required', ['Yes', 'No']),
    T_SELECT('Educational', ['Yes', 'No']),
    T_NUM('Number of Pieces'),
    T_TEXT('Safety Certification'),
  ],

  food: [
    T_TEXT('Net Weight', 'e.g. 500 g'),
    T_TEXT('Ingredients'),
    T_SELECT('Veg / Non-veg', ['Veg', 'Non-veg', 'Eggetarian']),
    T_TEXT('Shelf Life', 'e.g. 12 months'),
    T_TEXT('Best Before'),
    T_TEXT('Storage Instructions'),
    T_TEXT('FSSAI License No.'),
    T_TEXT('Manufactured By'),
    T_TEXT('Country of Origin', 'India'),
  ],

  beauty: [
    T_TEXT('Brand'),
    T_TEXT('Quantity', 'e.g. 100 ml'),
    T_SELECT('Skin Type', ['All', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal']),
    T_TEXT('Ingredients'),
    T_SELECT('Form', ['Cream', 'Gel', 'Liquid', 'Powder', 'Spray', 'Stick']),
    T_TEXT('Shelf Life'),
    T_TEXT('Country of Origin'),
  ],

  school: [
    T_TEXT('Brand'),
    T_TEXT('Material'),
    T_TEXT('Age Range'),
    T_TEXT('Dimensions'),
    T_TEXT('Country of Origin'),
  ],

  home: [
    T_TEXT('Brand'),
    T_TEXT('Material'),
    T_TEXT('Dimensions'),
    T_TEXT('Color'),
    T_TEXT('Weight'),
    T_TEXT('Country of Origin'),
  ],

  sports: [
    T_TEXT('Brand'),
    T_TEXT('Sport / Activity'),
    T_TEXT('Material'),
    T_TEXT('Size / Dimensions'),
    T_TEXT('Age Range'),
  ],

  gift: [
    T_TEXT('Contents'),
    T_TEXT('Occasion', 'e.g. Diwali, Rakhi, Birthday'),
    T_TEXT('Packaging'),
  ],
}

export function getSpecTemplate(category) {
  return SPEC_TEMPLATES[category] || null
}

