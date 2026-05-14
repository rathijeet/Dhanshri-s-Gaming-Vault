import { CONSOLES } from '../config'
import { GAMES } from '../games'

function ConsoleCard({ item, onBook }) {
  const games = GAMES[item.id] || []
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-high transition-all hover:border-primary-fixed/50">
      <div className="aspect-video w-full relative">
        <img src={item.image} alt={`${item.name} rental`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 hardware-card-gradient"></div>
        <div className="absolute bottom-4 left-6">
          <span className={`${item.tierClass} font-label-mono text-label-mono px-3 py-1 rounded uppercase`}>
            {item.tier}
          </span>
        </div>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">{item.name}</h3>
            <p className="text-on-surface-variant font-body-md">{item.subtitle}</p>
          </div>
          <div className="text-right">
            <span className="font-display-lg text-headline-sm text-primary-fixed">₹{item.price}</span>
            <span className="text-on-surface-variant font-label-mono text-label-mono block uppercase">Per Day</span>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
            <h4 className="font-label-mono text-label-mono text-on-surface uppercase tracking-widest">
              Games Included
            </h4>
            <span className="font-label-mono text-label-mono text-primary-fixed">
              {games.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {games.map((g) => (
              <span
                key={g.title}
                title={`${g.genre} · ${g.year}`}
                className="bg-surface-variant text-on-surface-variant px-2.5 py-1 rounded-md font-body-md text-sm border border-outline-variant/20"
              >
                {g.title}
              </span>
            ))}
          </div>
          <a
            href="#games"
            className="inline-flex items-center gap-1 font-label-mono text-label-mono text-primary-fixed uppercase hover:gap-2 transition-all"
          >
            View Library Details <span className="material-symbols-outlined !text-base">arrow_forward</span>
          </a>
        </div>

        <button
          onClick={() => onBook(item.id)}
          className="w-full bg-primary-container text-on-primary-container py-4 rounded-xl font-bold hover:bg-primary-fixed transition-colors"
        >
          {item.cta}
        </button>
      </div>
    </div>
  )
}

export default function Inventory({ onBook }) {
  return (
    <section id="inventory" className="px-margin-mobile md:px-margin-desktop scroll-mt-24">
      <div className="max-w-container-max mx-auto bg-surface-container-lowest/50 backdrop-blur-sm rounded-3xl border border-outline-variant/10 py-16 md:py-24 px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md text-on-surface mb-4">
            Elite Inventory
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Choose your weapon. All rentals include setup and local support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {CONSOLES.map((c) => (
            <ConsoleCard key={c.id} item={c} onBook={onBook} />
          ))}
        </div>
      </div>
    </section>
  )
}
