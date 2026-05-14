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
    <section id="trust" className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-24 scroll-mt-24">
      <div className="bg-surface-container-high rounded-3xl p-8 md:p-16 border border-primary-fixed/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-fixed/5 blur-[120px] pointer-events-none"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md text-on-surface mb-6">
              Safe &amp; Reliable Gaming
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
              We maintain high standards to ensure a fair and premium experience for the entire Nagpur gaming
              community.
            </p>

            <div className="space-y-6">
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

          <div className="relative flex justify-center">
            <div className="w-full max-w-md aspect-square rounded-2xl border border-outline-variant/30 overflow-hidden relative group">
              <img
                className="w-full h-full object-cover"
                alt="Stylized neon green tactical map of Nagpur city with a 3km service radius highlighted."
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
              />
              <div className="absolute inset-0 bg-primary-fixed/10 mix-blend-overlay"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-background/80 backdrop-blur-md p-6 rounded-2xl border border-primary-fixed/30 text-center">
                  <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-2">Live Status</p>
                  <p className="font-headline-sm text-headline-sm text-on-surface">Delivery Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
