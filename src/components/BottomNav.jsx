import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { useShopEnabled } from '../SettingsContext'

const SECTION_TO_TAB = {
  inventory: 'rent',
  how: 'process',
  trust: 'verify',
}

export default function BottomNav({ onBook, onSupport }) {
  const [activeTab, setActiveTab] = useState('rent')
  const shopEnabled = useShopEnabled()

  useEffect(() => {
    const ids = Object.keys(SECTION_TO_TAB)
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const mostVisible = visible.reduce((a, b) =>
          a.intersectionRatio > b.intersectionRatio ? a : b
        )
        const tab = SECTION_TO_TAB[mostVisible.target.id]
        if (tab) setActiveTab(tab)
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const items = [
    { id: 'rent', icon: 'sports_esports', label: 'Rent', onClick: () => onBook() },
    ...(shopEnabled ? [{ id: 'shop', icon: 'storefront', label: 'Shop', to: '/apparels' }] : []),
    { id: 'process', icon: 'sync_alt', label: 'Process', href: '#how' },
    { id: 'verify', icon: 'verified_user', label: 'Verify', href: '#trust' },
    { id: 'support', icon: 'support_agent', label: 'Support', onClick: () => onSupport() },
  ]

  return (
    <nav className="md:hidden flex justify-around items-center px-4 py-3 fixed bottom-0 w-full z-50 rounded-t-xl bg-surface-container-high border-t border-primary-fixed/30 shadow-[0_-8px_24px_rgba(0,227,139,0.15)]">
      {items.map((it) => {
        const isActive = activeTab === it.id
        const className = `flex flex-col items-center justify-center py-1 px-3 transition-colors ${
          isActive ? 'text-primary-fixed bg-surface-variant/50 rounded-lg' : 'text-on-surface-variant'
        }`
        const content = (
          <>
            <Icon name={it.icon} />
            <span className="font-label-mono text-[10px] uppercase mt-1">{it.label}</span>
          </>
        )
        if (it.onClick) {
          return (
            <button key={it.label} onClick={it.onClick} className={className}>
              {content}
            </button>
          )
        }
        if (it.to) {
          return (
            <Link key={it.label} to={it.to} className={className}>
              {content}
            </Link>
          )
        }
        return (
          <a
            key={it.label}
            href={it.href}
            onClick={() => setActiveTab(it.id)}
            className={className}
          >
            {content}
          </a>
        )
      })}
    </nav>
  )
}
