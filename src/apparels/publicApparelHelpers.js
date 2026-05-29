import { supabase } from '../lib/supabase'

export const CATEGORY_LABEL = {
  tshirt:      'T-Shirts',
  pants:       'Pants',
  combo:       'Combos',
  hoodie:      'Hoodies',
  footwear:    'Footwear',
  accessories: 'Accessories',
  toys:        'Toys & Games',
  school:      'School',
  books:       'Books',
  home:        'Home & Decor',
  beauty:      'Beauty',
  sports:      'Sports',
  electronics: 'Electronics',
  gift:        'Gift Box',
  other:       'Other',
}

export const GENDER_LABEL = {
  na:     '',
  men:    'Men',
  women:  'Women',
  boys:   'Boys',
  girls:  'Girls',
  unisex: 'Unisex',
}

export function categoryLabel(id) {
  if (!id) return 'Other'
  if (CATEGORY_LABEL[id]) return CATEGORY_LABEL[id]
  return id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function genderLabel(id) {
  return GENDER_LABEL[id] || ''
}

export function formatRupees(n) {
  if (typeof n !== 'number') return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

export async function listActiveProducts() {
  const { data, error } = await supabase
    .from('apparel_products')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getProductBySlug(slug) {
  const { data: product, error } = await supabase
    .from('apparel_products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  if (error) throw error
  if (!product) return null

  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase
      .from('apparel_product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('apparel_product_variants')
      .select('*')
      .eq('product_id', product.id)
      .order('size', { ascending: true }),
  ])

  return {
    product,
    images: images || [],
    variants: variants || [],
  }
}
