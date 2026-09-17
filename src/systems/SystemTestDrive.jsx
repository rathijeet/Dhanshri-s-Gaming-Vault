import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { SCREEN_SCENES } from './screenContent'
import { formatRupees } from './publicSystemHelpers'
import Icon from '../components/Icon'
import ViewerBoundary from './ViewerBoundary'

const SystemViewer3D = lazy(() => import('./SystemViewer3D'))

// Full-screen "test drive": the machine on a desk, the camera square on the
// monitor, and the customer swiping through what it actually does. The point is
// to answer "what do I get" with a demonstration rather than a spec sheet.

// Each scene explains itself in terms of the parts that were actually chosen,
// so the claim is tied to the build rather than being marketing copy.
function narrate(sceneId, build) {
  const gpu = build.gpu
  const cpu = build.cpu
  const ram = build.ram
  const vram = gpu?.vram_gb || 0

  switch (sceneId) {
    case 'gaming':
      return {
        title: 'Gaming',
        line: gpu
          ? `${gpu.brand} ${gpu.name} driving 1440p at Ultra.`
          : 'Add a graphics card to see gaming performance.',
        detail: gpu
          ? `${vram}GB of video memory — comfortable headroom for high textures and ray tracing at this resolution.`
          : null,
      }
    case 'creator':
      return {
        title: 'Video editing',
        line: cpu
          ? `${cpu.brand} ${cpu.name} handling a 4K timeline.`
          : 'Add a processor to see editing performance.',
        detail: ram
          ? `${ram.capacity_gb}GB of memory keeps long timelines and effects stacks responsive while scrubbing.`
          : null,
      }
    case 'ai':
      return {
        title: 'AI & model training',
        line: vram
          ? `Training and inference on ${vram}GB of VRAM.`
          : 'Add an NVIDIA card to run local models.',
        detail: vram
          ? vram >= 48 ? 'Enough to run 70B-class models locally.'
          : vram >= 24 ? 'The sweet spot — 30B models at Q4, and real fine-tuning work.'
          : vram >= 16 ? 'Comfortable with 14B models at Q4.'
          : 'Suited to 7B–13B models at Q4.'
          : null,
      }
    default:
      return {
        title: 'Office & study',
        line: cpu ? `${cpu.brand} ${cpu.name} for everyday work.` : 'Everyday productivity.',
        detail: 'Documents, spreadsheets, browser tabs and video calls without waiting.',
      }
  }
}

// A cabinet is about as big as a 24" panel, so no single frame can make both
// large. Rather than compromise either, the customer picks the shot. A lab gets
// a middle one: standing between the rows, which is the thing a lab is for.
const ROOM_VIEWS = [
  { id: 'monitor', label: 'Whole setup', icon: 'desk' },
  { id: 'screen',  label: 'Screen',      icon: 'fullscreen' },
]
const LAB_VIEWS = [
  { id: 'monitor', label: 'Whole lab', icon: 'meeting_room' },
  { id: 'station', label: 'A desk',    icon: 'desk' },
  { id: 'screen',  label: 'Screen',    icon: 'fullscreen' },
]

export default function SystemTestDrive({ open, onClose, build, rgbColor, result, seats = 1, initialScene = 'gaming' }) {
  const [idx, setIdx] = useState(() => Math.max(0, SCREEN_SCENES.findIndex((s) => s.id === initialScene)))
  const [view, setView] = useState('monitor')
  const swipe = useRef({ x: 0, active: false })

  const go = (delta) =>
    setIdx((i) => (i + delta + SCREEN_SCENES.length) % SCREEN_SCENES.length)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const scene = SCREEN_SCENES[idx]
  const copy = narrate(scene.id, build)
  // Derived, not stored: a lab-only view must not survive a switch back to a
  // single system, and deriving it beats an effect that resets state.
  const views = seats > 1 ? LAB_VIEWS : ROOM_VIEWS
  const activeView = views.some((v) => v.id === view) ? view : 'monitor'

  // Swipe lives on the caption bar, not the canvas — dragging the canvas is how
  // you orbit the machine, and one gesture cannot mean two things.
  const onDown = (e) => { swipe.current = { x: e.clientX, active: true } }
  const onUp = (e) => {
    if (!swipe.current.active) return
    const dx = e.clientX - swipe.current.x
    swipe.current.active = false
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1)
  }

  return (
    <div className="fixed inset-0 z-[150] bg-background flex flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4 border-b border-outline-variant/20 flex-shrink-0">
        <div>
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase">Test this system</p>
          <p className="font-body-md text-sm text-on-surface-variant">
            {result?.workload?.label}
            {result ? ` · ${formatRupees(result.total)} incl. GST` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-primary-fixed/60 transition-colors flex items-center justify-center"
          aria-label="Close"
        >
          <Icon name="close" />
        </button>
      </div>

      {/* the machine */}
      <div className="flex-1 relative min-h-0">
        <ViewerBoundary>
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="progress_activity" className="!text-3xl text-primary-fixed animate-spin" />
            </div>
          }>
            <SystemViewer3D
              build={build}
              rgbColor={rgbColor}
              seats={seats}
              screenScene={scene.id}
              focus={activeView}
            />
          </Suspense>
        </ViewerBoundary>

        <button
          type="button"
          onClick={() => go(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface-container/80 backdrop-blur border border-outline-variant/30 text-on-surface hover:border-primary-fixed/60 flex items-center justify-center"
          aria-label="Previous"
        >
          <Icon name="chevron_left" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-surface-container/80 backdrop-blur border border-outline-variant/30 text-on-surface hover:border-primary-fixed/60 flex items-center justify-center"
          aria-label="Next"
        >
          <Icon name="chevron_right" />
        </button>

        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1 bg-background/80 backdrop-blur border border-outline-variant/30 rounded-xl p-1">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeView === v.id
                  ? 'bg-primary-fixed text-on-primary-fixed'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon name={v.icon} className="!text-base" />
              {v.label}
            </button>
          ))}
        </div>

        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 font-label-mono text-xs uppercase text-on-surface-variant bg-background/70 border border-outline-variant/30 rounded px-2 py-1 pointer-events-none">
          {seats > 1 ? 'Drag to walk the lab · pinch to zoom' : 'Drag to look around the room · pinch to zoom'}
        </span>
      </div>

      {/* caption + swipe strip */}
      <div
        className="flex-shrink-0 border-t border-outline-variant/20 bg-surface-container-high px-margin-mobile md:px-margin-desktop py-5 select-none touch-pan-y"
        onPointerDown={onDown}
        onPointerUp={onUp}
      >
        <div className="max-w-container-max mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Icon name={scene.icon} className="!text-2xl text-primary-fixed" />
            <h2 className="font-display-lg text-headline-sm text-on-surface">{copy.title}</h2>
          </div>
          <p className="font-body-md text-body-lg text-on-surface mb-1">{copy.line}</p>
          {copy.detail && (
            <p className="font-body-md text-sm text-on-surface-variant">{copy.detail}</p>
          )}

          <div className="flex items-center justify-between mt-4 gap-4">
            <div className="flex gap-2 overflow-x-auto">
              {SCREEN_SCENES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    i === idx
                      ? 'border-primary-fixed bg-primary-fixed/10 text-primary-fixed'
                      : 'border-outline-variant/30 text-on-surface-variant hover:border-primary-fixed/50'
                  }`}
                >
                  <Icon name={s.icon} className="!text-base" />
                  {s.label}
                </button>
              ))}
            </div>
            <span className="font-body-md text-xs text-on-surface-variant whitespace-nowrap hidden sm:inline">
              Swipe or use ← →
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
