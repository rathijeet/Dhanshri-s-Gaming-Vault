import Icon from './Icon'

const items = [
  {
    icon: 'verified_user',
    title: 'Aadhar Verification',
    body: 'Identity check required for all first-time renters for security.',
  },
  {
    icon: 'map',
    title: '3km Core Service Area',
    body: 'Fastest response times and lowest delivery fees within our core radius.',
  },
  {
    icon: 'contract',
    title: 'Transparent Agreement',
    body: 'Simple digital contract covers equipment safety and rental duration.',
  },
]

export default function TrustSafety() {
  return (
    <section id="trust" className="pt-12 pb-6 md:pt-24 md:pb-12 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-mt-24">
      <div className="bg-surface-container-high rounded-3xl p-8 md:p-16 border border-primary-fixed/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-fixed/5 blur-[120px] pointer-events-none"></div>

        <div className="max-w-3xl">
          <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md text-on-surface mb-6">
            Safe &amp; Reliable Gaming
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
            We maintain high standards to ensure a fair and premium experience for the entire Nagpur gaming
            community.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {items.map((it) => (
              <div key={it.title} className="flex gap-4">
                <Icon name={it.icon} className="text-primary-fixed" filled />
                <div>
                  <h4 className="font-headline-sm text-body-lg font-bold text-on-surface">{it.title}</h4>
                  <p className="text-on-surface-variant font-body-md">{it.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
