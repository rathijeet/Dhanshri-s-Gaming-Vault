import logoSrc from '../assets/screen.png'

export default function Logo({ className = '' }) {
  return (
    <div
      className={`h-10 w-10 rounded-lg overflow-hidden bg-surface-container-high border border-primary-fixed/30 flex-shrink-0 ${className}`}
    >
      <img
        src={logoSrc}
        alt="Dhanshri's Gaming Vault logo"
        className="w-full h-full object-cover"
      />
    </div>
  )
}
