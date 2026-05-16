import { useEffect, useState } from 'react'
import { CONSOLES } from '../config'
import { useAudioEngaged } from '../audioEngagement'
import Icon from './Icon'
import StyledPoster from './StyledPoster'

export default function GameDetailModal({ game, platform, onClose, onBook }) {
  const [posterErrored, setPosterErrored] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const audioEngaged = useAudioEngaged()

  useEffect(() => {
    setPosterErrored(false)
    setTrailerOpen(false)
  }, [game])

  useEffect(() => {
    if (!game) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [game, onClose])

  if (!game) return null

  const consoleData = CONSOLES.find((c) => c.id === platform)
  const consoleName =
    consoleData?.name ||
    (platform === 'ps5'
      ? 'PlayStation 5'
      : platform === 'ps4'
        ? 'PlayStation 4'
        : 'Xbox Series S')
  const showFallback = posterErrored || !game.image

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start md:items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl my-8 bg-surface-container-high rounded-3xl border border-primary-fixed/20 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="sticky top-0 z-10 flex items-start justify-between p-6 md:p-8 border-b border-outline-variant/20 bg-surface-container-high rounded-t-3xl">
          <div className="min-w-0 flex-1 pr-4">
            <p className="font-label-mono text-label-mono text-primary-fixed uppercase mb-2">
              Game Details
            </p>
            <h2 className="font-display-lg text-headline-sm md:text-headline-md text-on-surface line-clamp-2">
              {game.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-primary-fixed/60 transition-colors flex items-center justify-center flex-shrink-0"
            aria-label="Close"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-6 items-start">
            <div className="aspect-[2/3] rounded-xl overflow-hidden border border-outline-variant/20 max-w-[220px] w-full mx-auto sm:mx-0">
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
                  onError={() => setPosterErrored(true)}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="bg-primary-fixed/15 border border-primary-fixed/40 text-primary-fixed font-label-mono text-label-mono px-3 py-1 rounded-full uppercase">
                  {game.genre}
                </span>
                <span className="bg-surface-variant text-on-surface-variant font-label-mono text-label-mono px-3 py-1 rounded-full uppercase">
                  {game.year}
                </span>
                <span className="bg-surface-variant text-on-surface-variant font-label-mono text-label-mono px-3 py-1 rounded-full uppercase">
                  {platform === 'ps5' ? 'PS5' : platform === 'ps4' ? 'PS4' : 'Xbox'}
                </span>
              </div>

              {game.description && (
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  {game.description}
                </p>
              )}
            </div>
          </div>

          {(game.developer || game.players) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
              {game.developer && (
                <div>
                  <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-1">
                    Developer
                  </p>
                  <p className="font-body-md text-on-surface">{game.developer}</p>
                </div>
              )}
              {game.players && (
                <div>
                  <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-1">
                    Players
                  </p>
                  <p className="font-body-md text-on-surface">{game.players}</p>
                </div>
              )}
            </div>
          )}

          {/* Trailer */}
          {!trailerOpen ? (
            game.youtubeId ? (
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-surface-container border-2 border-primary-fixed/40 hover:border-primary-fixed text-primary-fixed px-6 py-4 rounded-xl font-bold font-headline-sm transition-colors group"
              >
                <Icon name="play_circle" className="!text-2xl group-hover:scale-110 transition-transform" filled />
                Watch Trailer
              </button>
            ) : (
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                  `${game.title} official trailer`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-surface-container border-2 border-outline-variant/30 hover:border-primary-fixed/40 text-on-surface-variant hover:text-primary-fixed px-6 py-4 rounded-xl font-bold font-headline-sm transition-colors group"
              >
                <Icon name="play_circle" className="!text-2xl" />
                Watch Trailer on YouTube
                <Icon name="open_in_new" className="!text-base opacity-70" />
              </a>
            )
          ) : (
            <div className="aspect-video w-full max-h-[50vh] rounded-xl overflow-hidden border border-outline-variant/30 bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${game.youtubeId}?autoplay=1${audioEngaged ? '' : '&mute=1'}&rel=0`}
                title={`${game.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 pt-0 flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border-2 border-outline-variant/40 text-on-surface-variant px-6 py-4 rounded-xl font-bold hover:border-primary-fixed/50 hover:text-on-surface transition-all"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onBook?.(platform)
            }}
            className="flex-1 bg-primary-fixed text-on-primary-fixed px-6 py-4 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow"
          >
            <Icon name="shopping_cart" className="!text-xl" />
            Book {consoleName}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
