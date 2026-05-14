import { useEffect } from 'react'
import Icon from './Icon'

export default function PolicyModal({ policy, onClose }) {
  useEffect(() => {
    if (!policy) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [policy, onClose])

  if (!policy) return null

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start md:items-center justify-center p-4">
        <div
          className="relative w-full max-w-3xl my-8 bg-surface-container-high rounded-3xl border border-primary-fixed/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="sticky top-0 z-10 flex items-start justify-between p-6 md:p-8 border-b border-outline-variant/20 bg-surface-container-high rounded-t-3xl">
          <div>
            <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-2">Policy</p>
            <h2 className="font-display-lg text-headline-sm md:text-headline-md text-on-surface">
              {policy.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary-fixed transition-colors flex-shrink-0 ml-4"
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {policy.intro}
          </p>

          {policy.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="font-headline-sm text-body-lg font-bold text-on-surface mb-3 border-b border-outline-variant/20 pb-2">
                {section.heading}
              </h3>
              <ul className="space-y-2 font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {section.body.map((line, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-primary-fixed flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-primary-fixed" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <p className="font-label-mono text-label-mono text-on-surface-variant uppercase pt-4 border-t border-outline-variant/20">
            {policy.footerNote}
          </p>
        </div>

        <div className="p-6 md:p-8 pt-0">
          <button
            onClick={onClose}
            className="w-full bg-primary-fixed text-on-primary-fixed px-6 py-4 rounded-xl font-bold font-headline-sm hover:scale-[1.02] transition-transform neon-glow"
          >
            I Understand
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
