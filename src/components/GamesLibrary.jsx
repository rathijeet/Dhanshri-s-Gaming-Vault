import { useEffect, useRef, useState } from 'react'
import { GAMES } from '../games'
import Icon from './Icon'
import StyledPoster from './StyledPoster'
import GameDetailModal from './GameDetailModal'

const TABS = [
  { id: 'ps5', label: 'PlayStation 5', icon: 'sports_esports' },
  { id: 'xbox', label: 'Xbox Series S', icon: 'videogame_asset' },
]

const HOVER_DELAY_MS = 400

function GameCard({ game, platform, onClick }) {
  const [errored, setErrored] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [isTouch, setIsTouch] = useState(false)
  const hoverTimer = useRef(null)
  const showFallback = errored || !game.image

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsTouch(!window.matchMedia('(hover: hover)').matches)
  }, [])

  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  const beginHover = () => {
    if (!game.youtubeId || isTouch) return
    hoverTimer.current = setTimeout(() => setPreviewing(true), HOVER_DELAY_MS)
  }
  const endHover = () => {
    if (isTouch) return
    clearTimeout(hoverTimer.current)
    setPreviewing(false)
  }

  const togglePreview = (e) => {
    e.stopPropagation()
    e.preventDefault()
    setPreviewing((p) => !p)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKey}
      onMouseEnter={beginHover}
      onMouseLeave={endHover}
      onFocus={beginHover}
      onBlur={endHover}
      className="group relative bg-surface-container rounded-xl border border-outline-variant/20 overflow-hidden hover:border-primary-fixed/50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary-fixed/60 cursor-pointer"
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

        {previewing && game.youtubeId && (
          <div className="absolute inset-0 bg-black overflow-hidden pointer-events-none">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${game.youtubeId}?autoplay=1&controls=0&loop=1&playlist=${game.youtubeId}&modestbranding=1&playsinline=1&rel=0&start=5`}
              title={`${game.title} preview`}
              allow="autoplay; encrypted-media"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[267%] h-full border-0"
            />
          </div>
        )}

        {isTouch && game.youtubeId && (
          <button
            type="button"
            onClick={togglePreview}
            className="absolute top-2 right-2 z-10 w-10 h-10 rounded-full bg-background/85 backdrop-blur-md border border-primary-fixed/40 text-primary-fixed flex items-center justify-center active:scale-95 transition-transform"
            aria-label={previewing ? 'Stop preview' : 'Play preview'}
          >
            <Icon name={previewing ? 'stop' : 'play_arrow'} className="!text-xl" filled />
          </button>
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
    </div>
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
