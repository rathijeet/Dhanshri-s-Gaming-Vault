import { useState } from 'react'
import { GAMES } from '../games'
import Icon from './Icon'
import StyledPoster from './StyledPoster'
import GameDetailModal from './GameDetailModal'

const TABS = [
  { id: 'ps5', label: 'PlayStation 5', icon: 'sports_esports' },
  { id: 'xbox', label: 'Xbox Series S', icon: 'videogame_asset' },
]

function GameCard({ game, platform, onClick }) {
  const [errored, setErrored] = useState(false)
  const showFallback = errored || !game.image

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative bg-surface-container rounded-xl border border-outline-variant/20 overflow-hidden hover:border-primary-fixed/50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary-fixed/60"
      aria-label={`View details for ${game.title}`}
    >
      <div className="aspect-[2/3] w-full bg-surface-container-low relative overflow-hidden">
        {showFallback ? (
          <StyledPoster
            title={game.title}
            genre={game.genre}
            year={game.year}
            platform={platform}
          />
        ) : (
          <img
            src={game.image}
            alt={`${game.title} cover art`}
            onError={() => setErrored(true)}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 hardware-card-gradient pointer-events-none"></div>
        <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-primary-fixed/90 text-on-primary-fixed font-label-mono text-label-mono uppercase px-2 py-1 rounded">
            Details
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="font-headline-sm text-body-md font-bold text-on-surface line-clamp-1">
          {game.title}
        </p>
        <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mt-1 truncate">
          {game.genre} · {game.year}
        </p>
      </div>
    </button>
  )
}

export default function GamesLibrary({ onBook }) {
  const [tab, setTab] = useState('ps5')
  const [selectedGame, setSelectedGame] = useState(null)
  const games = GAMES[tab] || []

  return (
    <>
      <section
        id="games"
        className="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto scroll-mt-24"
      >
        <div className="text-center mb-12 md:mb-16">
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-3">
            Pre-loaded Library
          </p>
          <h2 className="font-display-lg text-display-lg-mobile md:text-headline-md text-on-surface mb-4">
            Games Library
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto">
            Every rental ships with these titles installed. Tap any game to see details.
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <div
            role="tablist"
            aria-label="Choose console library"
            className="inline-flex bg-surface-container rounded-xl p-1 border border-outline-variant/20"
          >
            {TABS.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`px-5 md:px-6 py-3 rounded-lg font-headline-sm text-body-md font-bold transition-colors flex items-center gap-2 ${
                    active
                      ? 'bg-primary-fixed text-on-primary-fixed'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Icon name={t.icon} className="!text-xl" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.id === 'ps5' ? 'PS5' : 'Xbox'}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {games.map((g) => (
            <GameCard
              key={g.title}
              game={g}
              platform={tab}
              onClick={() => setSelectedGame(g)}
            />
          ))}
        </div>

        <p className="text-center font-body-md text-sm text-on-surface-variant mt-10">
          Game lineup may vary by booking. Confirm availability on WhatsApp before pickup.
        </p>
      </section>

      <GameDetailModal
        game={selectedGame}
        platform={tab}
        onClose={() => setSelectedGame(null)}
        onBook={onBook}
      />
    </>
  )
}
