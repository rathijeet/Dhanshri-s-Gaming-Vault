import { supabase } from './supabase'

export const DEFAULT_SETTINGS = {
  shop_enabled: true,
}

export async function fetchAllSettings() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value')
  if (error) throw error
  const map = { ...DEFAULT_SETTINGS }
  for (const row of data || []) {
    map[row.key] = row.value
  }
  return map
}

export async function upsertSetting(key, value) {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value }, { onConflict: 'key' })
  if (error) throw error
}
