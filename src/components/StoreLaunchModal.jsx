import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShopEnabled } from '../SettingsContext'
import {
  formatRupees,
  latestProductTimestamp,
  listActiveProducts,
} from '../apparels/publicApparelHelpers'
import Icon from './Icon'

// Bump the suffix to re-announce to everyone (e.g. for the next big launch).
const SEEN_KEY = 'dgv_store_launch_v1'
// Suppresses re-showing on reload / in-tab navigation without silencing a real return visit.
const SESSION_KEY = 'dgv_store_launch_session'
const SLIDE_MS = 3200
const MAX_SLIDES = 6

const MINUTE = 60 * 1000
const ARROW =
  'w-9 h-9 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-primary-fixed hover:bg-primary-fixed hover:border-primary-fixed transition-colors flex items-center justify-center flex-shrink-0'

const DAY = 24 * 60 * 60 * 1000
// How long a visitor is left alone, by how they left the popup. Someone who opened
// the store has seen it and is left alone far longer than someone who waved it away;
// someone who did neither is not recorded at all, so they get one more nudge.
const COOLDOWN = {
  dismissed: 15 * MINUTE,
  shopped: 30 * DAY,
}

// Shown until real products exist, so the announcement never looks empty.
const FALLBACK_SLIDES = [
  { id: 'f-console', title: 'Consoles', subtitle: 'PS5, PS4 & Xbox', icon: 'videogame_asset' },
  { id: 'f-games', title: 'Games', subtitle: 'Latest PS5, PS4 & Xbox titles', icon: 'sports_esports' },
  { id: 'f-acc', title: 'Accessories', subtitle: 'Controllers, stands & more', icon: 'stadia_controller' },
  { id: 'f-bundle', title: 'Bundles', subtitle: 'Console + games, one price', icon: 'package_2' },
]

// Still inside the quiet period for whatever the visitor did last time?
function readRecord() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {}
  } catch {
    return {} // blocked storage or bad JSON - treat as never seen
  }
}

// Has a product gone live since the visitor was last shown the popup?
function hasNewStock(latest, record) {
  if (!latest) return false
  if (!record.lastProductAt) return true
  return new Date(latest) > new Date(record.lastProductAt)
}

function isSnoozed(record) {
  try {
    // The tab flag only stops a reload re-opening it moments later; the timed
    // cooldown below is what actually decides when it comes back.
    const shownAt = Number(sessionStorage.getItem(SESSION_KEY) || 0)
    if (shownAt && Date.now() - shownAt < 15 * MINUTE) return true
    const { action, at } = record
    const quietFor = COOLDOWN[action]
    if (!quietFor || !at) return false
    return Date.now() - at < quietFor
  } catch {
    return false // private window / blocked storage - just show it
  }
}

function markShownThisSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, String(Date.now()))
  } catch {
    /* worst case it reappears on reload */
  }
}

// Only called when the visitor actually acts. Leaving without a choice records
// nothing, so the announcement gets another chance on their next visit.
function recordChoice(action, lastProductAt) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify({ action, at: Date.now(), lastProductAt }))
  } catch {
    /* nothing to do */
  }
}

export default function StoreLaunchModal() {
  const navigate = useNavigate()
  const shopEnabled = useShopEnabled()

  const [open, setOpen] = useState(false)
  const [slides, setSlides] = useState(FALLBACK_SLIDES)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [isRestock, setIsRestock] = useState(false)
  const timerRef = useRef(null)
  const resumeRef = useRef(null)
  const latestRef = useRef(null) // newest product this visitor has now been shown

  // Manual control pauses the rotation briefly, then hands it back. Hovering must
  // not pause, or a centred popup never advances while it is being read.
  const pauseBriefly = useCallback(() => {
    setPaused(true)
    clearTimeout(resumeRef.current)
    resumeRef.current = setTimeout(() => setPaused(false), 6000)
  }, [])

  const selectSlide = useCallback(
    (i) => {
      setIndex(i)
      pauseBriefly()
    },
    [pauseBriefly]
  )

  const step = useCallback(
    (delta) => {
      setIndex((i) => (i + delta + slides.length) % slides.length)
      pauseBriefly()
    },
    [slides.length, pauseBriefly]
  )

  useEffect(() => () => clearTimeout(resumeRef.current), [])

  const close = useCallback(() => {
    setOpen(false)
    recordChoice('dismissed', latestRef.current)
  }, [])

  const goShop = useCallback(() => {
    recordChoice('shopped', latestRef.current)
    setOpen(false)
    navigate('/apparels')
  }, [navigate])

  // Announce once the quiet period has passed - or straight away when a product
  // has gone live since this visitor was last told, so new stock always gets seen.
  useEffect(() => {
    if (!shopEnabled) return
    let cancelled = false
    let timer

    ;(async () => {
      let latest = null
      try {
        latest = await latestProductTimestamp()
      } catch {
        /* offline or query failed - fall back to the plain cooldown */
      }
      if (cancelled) return

      const record = readRecord()
      const restock = hasNewStock(latest, record)
      if (isSnoozed(record) && !restock) return

      latestRef.current = latest
      setIsRestock(restock && !!record.at) // only "new arrivals" for a repeat viewer
      timer = setTimeout(() => {
        setOpen(true)
        markShownThisSession()
      }, 1400)
    })()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [shopEnabled])

  // Real products make the announcement concrete; fallback slides cover an empty catalog.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    listActiveProducts()
      .then((rows) => {
        if (cancelled || !rows.length) return
        const productSlides = rows.slice(0, MAX_SLIDES).map((r) => ({
          id: r.id,
          title: r.name,
          subtitle: formatRupees(Number(r.price) || 0),
          image: r.primary_image_url || null,
          slug: r.slug,
        }))
        // A single-product catalog would otherwise sit on one static slide.
        const topUp =
          productSlides.length < 2 ? FALLBACK_SLIDES.slice(0, 2 - productSlides.length) : []
        setSlides([...productSlides, ...topUp])
      })
      .catch(() => {
        /* keep the fallback slides */
      })
    return () => {
      cancelled = true
    }
  }, [open])

  // Auto-advance
  useEffect(() => {
    if (!open || paused || slides.length < 2) return
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(timerRef.current)
  }, [open, paused, slides.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') return close()
      if (e.key === 'ArrowRight') return step(1)
      if (e.key === 'ArrowLeft') return step(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, close, step])

  if (!open) return null

  const safeIndex = index % slides.length

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-md p-0 sm:p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Dhanshri's Store is now live"
    >
      <div
        className="relative w-full sm:max-w-md bg-surface-container-high rounded-t-3xl sm:rounded-3xl border border-primary-fixed/25 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/70 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface flex items-center justify-center"
        >
          <Icon name="close" className="!text-lg" />
        </button>

        <div className="px-6 pt-7 pb-4 text-center">
          <span className="inline-flex items-center gap-1.5 bg-primary-fixed/15 text-primary-fixed font-label-mono text-label-mono uppercase px-3 py-1 rounded-full">
            <Icon name={isRestock ? 'new_releases' : 'celebration'} className="!text-sm" filled />
            {isRestock ? 'Just added' : 'Now live'}
          </span>
          <h2 className="font-display-lg text-headline-sm text-on-surface mt-3">
            {isRestock ? 'New in the store' : "Dhanshri's Store is open"}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1.5">
            {isRestock
              ? 'Fresh stock just landed — take a look before it goes.'
              : 'Buy consoles, games, controllers and bundles — delivered across Nagpur.'}
          </p>
        </div>

        {/* SLIDER */}
        <div className="px-6">
          <div className="relative h-36 rounded-2xl bg-surface-container border border-outline-variant/20 overflow-hidden">
            {slides.map((s, i) => (
              <div
                key={s.id}
                className={`absolute inset-0 flex items-center gap-4 px-4 transition-opacity duration-500 ${
                  i === safeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                aria-hidden={i !== safeIndex}
              >
                {s.image ? (
                  <img
                    src={s.image}
                    alt=""
                    loading="lazy"
                    className="w-24 h-28 object-cover rounded-xl flex-shrink-0 bg-surface-container-low"
                  />
                ) : (
                  <div className="w-24 h-28 rounded-xl flex-shrink-0 bg-primary-fixed/10 flex items-center justify-center">
                    <Icon name={s.icon || 'inventory_2'} className="!text-4xl text-primary-fixed" />
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <p className="font-headline-sm text-body-lg font-bold text-on-surface line-clamp-2">
                    {s.title}
                  </p>
                  <p className="font-body-md text-body-md text-primary-fixed mt-1">{s.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous"
                className={ARROW}
              >
                <Icon name="chevron_left" className="!text-xl" />
              </button>

              <div className="flex items-center gap-1.5">
                {slides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSlide(i)}
                    aria-label={`Show ${s.title}`}
                    aria-current={i === safeIndex}
                    className={`h-1.5 rounded-full transition-all ${
                      i === safeIndex ? 'w-6 bg-primary-fixed' : 'w-1.5 bg-outline-variant/50'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next"
                className={ARROW}
              >
                <Icon name="chevron_right" className="!text-xl" />
              </button>
            </div>
          )}
        </div>

        <div className="p-6 pt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={close}
            className="sm:flex-1 border-2 border-outline-variant/40 text-on-surface-variant px-5 py-3 rounded-xl font-bold hover:border-primary-fixed/50 hover:text-on-surface transition-all"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={goShop}
            className="sm:flex-1 bg-primary-fixed text-on-primary-fixed px-5 py-3 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow"
          >
            <Icon name="shopping_bag" className="!text-base" /> Shop now
          </button>
        </div>
      </div>
    </div>
  )
}
