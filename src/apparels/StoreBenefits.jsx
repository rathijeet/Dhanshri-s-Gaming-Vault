import { DELIVERY_FEE, SERVICE_CITY } from '../config'
import Icon from '../components/Icon'

const BENEFITS = [
  {
    id: 'delivery',
    icon: 'local_shipping',
    title: 'Home delivery',
    body: `Flat ₹${DELIVERY_FEE} anywhere in ${SERVICE_CITY}. Most orders reach you the same day.`,
    accent: true,
  },
  {
    id: 'pay',
    icon: 'payments',
    title: 'Cash on delivery',
    body: 'Pay when it reaches your door — nothing upfront.',
  },
  {
    id: 'genuine',
    icon: 'verified',
    title: 'Genuine & sealed',
    body: 'Original stock with brand warranty. Pre-owned items are always labelled.',
  },
  {
    id: 'support',
    icon: 'forum',
    title: 'WhatsApp support',
    body: 'Questions before or after ordering? Chat with us directly.',
  },
]

export default function StoreBenefits() {
  return (
    <section aria-label="Why shop with us" className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {BENEFITS.map((b) => (
          <div
            key={b.id}
            className={`group relative overflow-hidden rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
              b.accent
                ? 'border-primary-fixed/40 bg-primary-fixed/[0.07] hover:border-primary-fixed/70'
                : 'border-outline-variant/20 bg-surface-container hover:border-primary-fixed/40'
            }`}
          >
            {/* soft glow, accent card only */}
            {b.accent && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-primary-fixed/20 blur-2xl"
              />
            )}
            <div className="relative">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                  b.accent
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'bg-surface-container-high text-primary-fixed group-hover:bg-primary-fixed/15'
                }`}
              >
                <Icon name={b.icon} className="!text-2xl" filled />
              </div>
              <p className="font-headline-sm text-body-lg font-bold text-on-surface">{b.title}</p>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1 leading-relaxed">
                {b.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
