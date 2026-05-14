import { useEffect } from 'react'
import { ADDRESS, BUSINESS_NAME, MAPS_URL, OWNER_NAME, WHATSAPP_NUMBER } from '../config'
import Icon from './Icon'

const PHONE_DISPLAY = `+91 ${WHATSAPP_NUMBER.slice(2, 7)} ${WHATSAPP_NUMBER.slice(7)}`
const TEL_HREF = `tel:+${WHATSAPP_NUMBER}`
const WA_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  `Hi ${BUSINESS_NAME}! I have a question about your rentals.`
)}`

export default function SupportModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start md:items-center justify-center p-4">
        <div
          className="relative w-full max-w-lg my-8 bg-surface-container-high rounded-3xl border border-primary-fixed/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-start justify-between p-6 md:p-8 border-b border-outline-variant/20">
          <div>
            <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-2">Contact</p>
            <h2 className="font-display-lg text-headline-sm md:text-headline-md text-on-surface">
              Get in Touch
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

        <div className="p-6 md:p-8 space-y-5">
          <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
            <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-3">
              Business
            </p>
            <p className="font-headline-sm text-body-lg font-bold text-on-surface">{BUSINESS_NAME}</p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Owner: <span className="text-on-surface font-bold">{OWNER_NAME}</span>
            </p>
          </div>

          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 p-5 rounded-2xl border border-outline-variant/20 bg-surface-container hover:border-primary-fixed/50 transition-colors group"
          >
            <Icon name="location_on" className="text-primary-fixed !text-3xl flex-shrink-0" filled />
            <div className="flex-1 min-w-0">
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">
                Address
              </p>
              <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                {ADDRESS.line1}
                <br />
                {ADDRESS.line2}
                <br />
                {ADDRESS.city} – {ADDRESS.pincode}, {ADDRESS.state}
              </p>
              <p className="font-label-mono text-label-mono text-primary-fixed uppercase mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                Open in Maps <Icon name="arrow_forward" className="!text-base" />
              </p>
            </div>
          </a>

          <a
            href={TEL_HREF}
            className="flex gap-4 p-5 rounded-2xl border border-outline-variant/20 bg-surface-container hover:border-primary-fixed/50 transition-colors group"
          >
            <Icon name="call" className="text-primary-fixed !text-3xl flex-shrink-0" filled />
            <div className="flex-1 min-w-0">
              <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-2">
                Phone
              </p>
              <p className="font-body-md text-body-lg text-on-surface font-bold">{PHONE_DISPLAY}</p>
              <p className="font-label-mono text-label-mono text-primary-fixed uppercase mt-2 flex items-center gap-1 group-hover:gap-2 transition-all">
                Tap to Call <Icon name="arrow_forward" className="!text-base" />
              </p>
            </div>
          </a>

          <a
            href={WA_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-primary-fixed text-on-primary-fixed px-6 py-4 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow"
          >
            <Icon name="chat" className="!text-xl" />
            Message on WhatsApp
          </a>
        </div>
        </div>
      </div>
    </div>
  )
}
