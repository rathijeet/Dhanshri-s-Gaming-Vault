import Icon from './Icon'

const steps = [
  {
    n: '01',
    icon: 'sports_esports',
    title: 'Choose Gear',
    body: 'Browse our elite inventory of PS5 and Xbox consoles. Select your dates and preferred game bundles.',
  },
  {
    n: '02',
    icon: 'local_shipping',
    title: 'Express Setup',
    body: 'We deliver to your doorstep (Nagpur city only). Full technical setup done in 15 minutes for just ₹30.',
  },
  {
    n: '03',
    icon: 'workspace_premium',
    title: 'Level Up!',
    body: "Immerse yourself in 4K gaming. When you're done, we handle the pickup. No stress, just play.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-mt-24">
      <div className="text-center mb-16">
        <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md text-on-surface">How it Works</h2>
        <div className="w-24 h-1 bg-primary-fixed mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {steps.map((s) => (
          <div
            key={s.n}
            className="p-8 rounded-2xl border border-outline-variant/10 bg-surface-container/50 backdrop-blur-md relative overflow-hidden"
          >
            <div className="text-primary-fixed-dim text-8xl font-black absolute -top-4 -right-4 opacity-10">
              {s.n}
            </div>
            <Icon name={s.icon} className="text-primary-fixed !text-4xl mb-6 block" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">{s.title}</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
