import Icon from './Icon'
import Logo from './Logo'

const POLICY_LINKS = [
  { id: 'terms', label: 'Terms of Service' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'damage', label: 'Damage Policy' },
  { id: 'aadhar', label: 'Aadhar Verification' },
]

export default function Footer({ onSupport, onOpenPolicy }) {
  return (
    <footer className="bg-surface-container-lowest mt-auto border-t border-outline-variant/10 pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-12 gap-gutter max-w-container-max mx-auto">
        <div className="flex flex-col gap-4 items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="flex flex-col leading-none">
              <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold uppercase tracking-tight">
                Dhanshri&apos;s
              </span>
              <span className="font-label-mono text-label-mono text-primary-fixed font-bold uppercase tracking-widest mt-1">
                Gaming Vault
              </span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
            © 2026 Dhanshri&apos;s Gaming Vault, Nagpur. Pro hardware, local speed. Elevating Nagpur&apos;s gaming culture.
          </p>
          <a
            href="/admin/login"
            aria-label="Admin"
            className="text-on-surface-variant/30 hover:text-primary-fixed transition-colors inline-flex"
          >
            <Icon name="settings" className="!text-base" />
          </a>
        </div>

        <div className="flex flex-col gap-4 items-center md:items-end">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {POLICY_LINKS.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpenPolicy(p.id)}
                className="text-on-surface-variant hover:text-primary-fixed transition-colors font-body-md text-body-md"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => onSupport()}
              className="bg-primary-fixed text-on-primary-fixed px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:scale-95 transition-all"
            >
              <Icon name="support_agent" className="!text-base" /> Contact Support
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
