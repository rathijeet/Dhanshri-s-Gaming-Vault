import { useState } from 'react'
import Icon from '../components/Icon'
import { upsertSetting } from '../lib/settingsHelpers'
import { useSettings } from '../SettingsContext'

export default function AdminSettings() {
  const { settings, loading, refresh } = useSettings()
  const [savingKey, setSavingKey] = useState('')
  const [error, setError]         = useState('')

  const shopEnabled = settings.shop_enabled !== false

  const setBoolean = async (key, value) => {
    setSavingKey(key)
    setError('')
    try {
      await upsertSetting(key, value)
      await refresh()
    } catch (err) {
      setError(err.message || 'Failed to update')
    } finally {
      setSavingKey('')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display-lg text-headline-lg text-on-surface mb-1">Settings</h1>
        <p className="font-body-md text-on-surface-variant">
          Site-wide controls. Changes take effect immediately for new visitors.
        </p>
      </div>

      {error && (
        <div className="bg-error-container/20 border border-error/40 rounded-xl p-4 flex gap-3 items-start mb-4">
          <Icon name="error" className="text-error flex-shrink-0 !text-2xl" filled />
          <p className="font-body-md text-sm text-error">{error}</p>
        </div>
      )}

      <SettingCard
        icon="storefront"
        title="Dhanshri's Store"
        description={
          shopEnabled
            ? 'The Store is live. Visitors can browse products, add to cart and place orders.'
            : 'The Store is hidden. The "Shop" link won\'t appear and /apparels will show a "coming soon" page.'
        }
        toggle={
          <Toggle
            on={shopEnabled}
            busy={loading || savingKey === 'shop_enabled'}
            onChange={(next) => setBoolean('shop_enabled', next)}
          />
        }
      />
    </div>
  )
}

function SettingCard({ icon, title, description, toggle }) {
  return (
    <div className="bg-surface-container-high rounded-2xl border border-outline-variant/20 p-5 flex items-start gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary-fixed/15 text-primary-fixed flex items-center justify-center flex-shrink-0">
        <Icon name={icon} className="!text-2xl" />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-headline-sm text-body-lg font-bold text-on-surface">{title}</h2>
        <p className="font-body-md text-sm text-on-surface-variant mt-1">{description}</p>
      </div>
      <div className="flex-shrink-0">{toggle}</div>
    </div>
  )
}

function Toggle({ on, busy, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={busy}
      onClick={() => onChange(!on)}
      className={`relative w-14 h-8 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-60 ${
        on ? 'bg-primary-fixed' : 'bg-surface-container border border-outline-variant/40'
      }`}
    >
      <span
        className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-200 flex items-center justify-center ${
          on ? 'left-7 bg-on-primary-fixed' : 'left-1 bg-on-surface-variant'
        }`}
      >
        {busy && (
          <Icon name="progress_activity" className={`!text-base animate-spin ${on ? 'text-primary-fixed' : 'text-surface-container'}`} />
        )}
      </span>
    </button>
  )
}
