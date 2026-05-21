import { useEffect } from 'react'
import Icon from '../components/Icon'

const VARIANTS = {
  primary: {
    iconBg: 'bg-primary-fixed/15 text-primary-fixed',
    button: 'bg-primary-fixed text-on-primary-fixed neon-glow',
    icon: 'help_outline',
  },
  danger: {
    iconBg: 'bg-red-500/15 text-red-400',
    button: 'bg-red-500 text-white',
    icon: 'warning',
  },
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmIcon,
  variant = 'primary',
  busy = false,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose, busy])

  if (!open) return null

  const v = VARIANTS[variant] || VARIANTS.primary

  return (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto bg-background/80 backdrop-blur-md"
      onClick={busy ? undefined : onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md bg-surface-container-high rounded-3xl border border-primary-fixed/20 shadow-2xl p-6 sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${v.iconBg}`}>
              <Icon name={v.icon} className="!text-3xl" filled />
            </div>

            <h2 className="font-display-lg text-headline-sm text-on-surface mb-2">{title}</h2>
            {message && (
              <p className="font-body-md text-on-surface-variant mb-6">{message}</p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 border-2 border-outline-variant/40 text-on-surface-variant px-6 py-3 rounded-xl font-bold hover:border-primary-fixed/50 hover:text-on-surface transition-all disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`flex-1 px-6 py-3 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 ${v.button}`}
            >
              <Icon
                name={busy ? 'progress_activity' : confirmIcon || 'check'}
                className={`!text-xl ${busy ? 'animate-spin' : ''}`}
              />
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
