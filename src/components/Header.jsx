import { useState } from 'react'
import Icon from './Icon'
import Logo from './Logo'

const NAV_LINKS = [
  { href: '#inventory', label: 'Inventory' },
  { href: '#build', label: 'Build' },
  { href: '#how', label: 'How it Works' },
  { href: '#trust', label: 'Terms' },
]

export default function Header({ onBook }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  return (
    <header className="bg-surface/90 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/20 shadow-lg shadow-primary-fixed/5">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <a href="#" className="flex items-center gap-3" onClick={close}>
          <Logo />
          <div className="flex flex-col leading-none">
            <span className="font-display-lg text-base sm:text-headline-sm font-extrabold text-primary-fixed uppercase tracking-tight">
              Dhanshri&apos;s
            </span>
            <span className="font-label-mono text-[10px] sm:text-label-mono font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">
              Gaming Vault
            </span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              className={
                i === 0
                  ? 'text-primary-fixed font-bold border-b-2 border-primary-fixed pb-1 font-body-md text-body-md'
                  : 'text-on-surface-variant hover:text-primary-fixed transition-colors font-body-md text-body-md'
              }
            >
              {l.label}
            </a>
          ))}
          <button
            onClick={() => onBook()}
            className="bg-primary-fixed text-on-primary-fixed px-6 py-2 rounded-lg font-bold hover:scale-95 transition-all neon-glow"
          >
            WhatsApp Us
          </button>
        </nav>

        <button
          className="md:hidden text-primary-fixed"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-outline-variant/20 bg-surface-container-high">
          <div className="px-margin-mobile py-2 max-w-container-max mx-auto">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={close}
                className="block py-4 font-body-md text-body-md text-on-surface hover:text-primary-fixed border-b border-outline-variant/10 last:border-b-0"
              >
                {l.label}
              </a>
            ))}
            <button
              onClick={() => {
                close()
                onBook()
              }}
              className="w-full mt-4 mb-2 bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 neon-glow"
            >
              <Icon name="chat" className="!text-base" /> WhatsApp Us
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
