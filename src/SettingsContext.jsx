import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, fetchAllSettings } from './lib/settingsHelpers'

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: true,
  refresh: () => {},
})

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading]   = useState(true)

  const refresh = useCallback(async () => {
    try {
      const s = await fetchAllSettings()
      setSettings(s)
    } catch (err) {
      console.warn('[settings] load failed, using defaults', err)
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}

// Convenience: returns the boolean directly, defaulting to true so the shop
// stays accessible if Supabase fails or is still loading.
export function useShopEnabled() {
  const { settings } = useSettings()
  return settings.shop_enabled !== false
}
