import { useState } from 'react'
import Icon from './Icon'
import ConsoleBuilder from './ConsoleBuilder'
import PCBuilder from './PCBuilder'

const TABS = [
  { id: 'console', label: 'Refurbished Console', icon: 'sports_esports' },
  { id: 'pc', label: 'Custom Gaming PC', icon: 'computer' },
]

export default function BuildSection() {
  const [tab, setTab] = useState('console')

  return (
    <section
      id="build"
      className="py-24 px-margin-mobile md:px-margin-desktop scroll-mt-24"
    >
      <div className="max-w-container-max mx-auto">
        <div className="text-center mb-10 md:mb-12">
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-3">
            Build &amp; Buy · QC Tested · Nagpur Delivery
          </p>
          <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md text-on-surface mb-4">
            Build Your Setup
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
            Configure a refurbished console with the exact games and controllers you want, or
            assemble a custom gaming PC from the ground up. Live pricing — order via WhatsApp.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-10">
          <div
            role="tablist"
            aria-label="Build type"
            className="inline-flex bg-surface-container rounded-xl p-1 border border-outline-variant/20"
          >
            {TABS.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`px-4 md:px-6 py-3 rounded-lg font-headline-sm text-body-md font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
                    active
                      ? 'bg-primary-fixed text-on-primary-fixed'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Icon name={t.icon} className="!text-xl" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">
                    {t.id === 'console' ? 'Console' : 'PC'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {tab === 'console' ? <ConsoleBuilder /> : <PCBuilder />}
      </div>
    </section>
  )
}
