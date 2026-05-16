import Icon from './Icon'

export default function Hero({ onBook }) {
  return (
    <section className="relative overflow-hidden px-margin-mobile md:px-margin-desktop pt-16 pb-24 max-w-container-max mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center">
        <div className="z-10">
          <div className="inline-flex items-center gap-2 bg-surface-container-high border border-primary-fixed/20 px-3 py-1 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
            <span className="font-label-mono text-label-mono text-primary-fixed uppercase">
              Now Serving Nagpur City
            </span>
          </div>

          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-6">
            Gaming Without the <span className="text-primary-fixed">Gear Cost.</span>
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-xl">
            Rent a PS5, Xbox or PS4 in Nagpur today. Starting at{' '}
            <span className="text-primary-fixed font-bold">₹599/day</span>. We deliver, set up, and you play.
            Professional hardware, local speed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onBook()}
              className="bg-primary-fixed text-on-primary-fixed px-8 py-4 rounded-xl font-bold font-headline-sm text-headline-sm hover:scale-105 transition-transform flex items-center justify-center gap-2 neon-glow"
            >
              Book Now <Icon name="arrow_forward" />
            </button>
            <a
              href="#inventory"
              className="border-2 border-primary-fixed/50 text-primary-fixed px-8 py-4 rounded-xl font-bold font-headline-sm text-headline-sm hover:bg-primary-fixed/10 transition-all flex items-center justify-center gap-2"
            >
              View Console List
            </a>
          </div>
        </div>

        <div className="relative mt-12 lg:mt-0">
          <div className="absolute -inset-4 bg-primary-fixed/10 blur-[100px] rounded-full"></div>
          <img
            className="relative z-10 w-full h-auto rounded-2xl border border-outline-variant/30 shadow-2xl"
            alt="PlayStation 5 and Xbox Series X controller on a dark technical surface with neon green rim lighting."
            src="https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=1200&q=80"
          />
        </div>
      </div>
    </section>
  )
}
