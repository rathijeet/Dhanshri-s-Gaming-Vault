import { iconForGenre } from '../games'
import Icon from './Icon'

function hueFor(text) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360
  return h
}

export default function StyledPoster({ title, genre, year, platform }) {
  const hue = hueFor(title)
  return (
    <div className="w-full h-full relative overflow-hidden bg-surface-container-low">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, hsla(${hue}, 80%, 35%, 0.55) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, hsla(${(hue + 120) % 360}, 70%, 30%, 0.4) 0%, transparent 60%), linear-gradient(180deg, #1a2520 0%, #0c150f 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(86,255,168,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(86,255,168,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <span className="font-label-mono text-label-mono text-primary-fixed uppercase text-[10px] px-2 py-0.5 bg-background/60 rounded">
          {year}
        </span>
        {platform && (
          <span className="font-label-mono text-label-mono text-primary-fixed uppercase text-[10px] px-2 py-0.5 bg-background/60 rounded">
            {platform === 'ps5' ? 'PS5' : 'XBOX'}
          </span>
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
        <Icon name={iconForGenre(genre)} className="text-primary-fixed !text-[120px]" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center bg-gradient-to-t from-background/95 via-background/70 to-transparent pt-12">
        <p className="font-display-lg font-extrabold text-on-surface uppercase leading-tight tracking-tight text-base sm:text-lg break-words">
          {title}
        </p>
        <div className="mt-2 inline-block px-3 py-1 rounded-full bg-primary-fixed/15 border border-primary-fixed/40">
          <p className="font-label-mono text-label-mono text-primary-fixed uppercase text-[10px]">
            {genre}
          </p>
        </div>
      </div>
    </div>
  )
}
