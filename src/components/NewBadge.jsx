// Always-on "NEW" marker for the shop links. `compact` is the bottom-nav size,
// where it sits over the icon rather than beside a label.
export default function NewBadge({ compact = false, className = '' }) {
  const base =
    'bg-primary-fixed text-on-primary-fixed font-label-mono uppercase font-extrabold rounded-full tracking-widest neon-glow'

  if (compact) {
    return (
      <span
        role="status"
        aria-label="New feature"
        className={`absolute -top-2 -right-5 text-[9px] leading-none px-1.5 py-[3px] ${base} ${className}`}
      >
        New
      </span>
    )
  }

  return (
    <span
      role="status"
      aria-label="New feature"
      className={`text-[11px] leading-none px-2.5 py-1.5 ${base} ${className}`}
    >
      New
    </span>
  )
}
