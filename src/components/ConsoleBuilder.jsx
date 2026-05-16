import { useMemo, useState } from 'react'
import {
  CONSOLE_ACCESSORIES,
  CONSOLE_GAMES,
  REFURB_CONSOLES,
  formatPrice,
} from '../buildConfig'
import Icon from './Icon'
import BuildOrderModal from './BuildOrderModal'

export default function ConsoleBuilder() {
  const [consoleId, setConsoleId] = useState(REFURB_CONSOLES[0].id)
  const [controllerCount, setControllerCount] = useState(1)
  const [gameIds, setGameIds] = useState([])
  const [accessoryIds, setAccessoryIds] = useState([])
  const [orderOpen, setOrderOpen] = useState(false)

  const selectedConsole = useMemo(
    () => REFURB_CONSOLES.find((c) => c.id === consoleId),
    [consoleId]
  )
  const availableGames = CONSOLE_GAMES[consoleId] || []

  const toggleGame = (id) =>
    setGameIds((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]))
  const toggleAccessory = (id) =>
    setAccessoryIds((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]
    )

  const changeConsole = (id) => {
    setConsoleId(id)
    setGameIds([])
    const next = REFURB_CONSOLES.find((c) => c.id === id)
    setControllerCount(next?.controller ? 1 : 0)
  }

  // Pricing
  const consolePrice = selectedConsole?.basePrice || 0
  const controllerUnitPrice = selectedConsole?.controller?.price || 0
  const includedController = selectedConsole?.controller ? 1 : 0
  const extraControllers = Math.max(0, controllerCount - includedController)
  const controllersPrice = extraControllers * controllerUnitPrice
  const selectedGames = availableGames.filter((g) => gameIds.includes(g.id))
  const gamesPrice = selectedGames.reduce((s, g) => s + g.price, 0)
  const selectedAccessories = CONSOLE_ACCESSORIES.filter((a) => accessoryIds.includes(a.id))
  const accessoriesPrice = selectedAccessories.reduce((s, a) => s + a.price, 0)
  const total = consolePrice + controllersPrice + gamesPrice + accessoriesPrice

  const summaryLines = useMemo(() => {
    const lines = []
    lines.push(`*Console:* ${selectedConsole.name} — ${formatPrice(consolePrice)}`)
    if (selectedConsole.controller) {
      lines.push(`*Controllers:* ${controllerCount}× ${selectedConsole.controller.name}`)
      if (extraControllers > 0) {
        lines.push(
          `  · +${extraControllers} extra @ ${formatPrice(controllerUnitPrice)} = ${formatPrice(
            controllersPrice
          )}`
        )
      } else {
        lines.push(`  · 1 included with console`)
      }
    }
    if (selectedGames.length) {
      lines.push(`*Games (${selectedGames.length}):*`)
      selectedGames.forEach((g) => {
        lines.push(`  · ${g.name} — ${formatPrice(g.price)}`)
      })
      lines.push(`  · Games subtotal: ${formatPrice(gamesPrice)}`)
    }
    if (selectedAccessories.length) {
      lines.push(`*Accessories (${selectedAccessories.length}):*`)
      selectedAccessories.forEach((a) => {
        lines.push(`  · ${a.name} — ${formatPrice(a.price)}`)
      })
      lines.push(`  · Accessories subtotal: ${formatPrice(accessoriesPrice)}`)
    }
    return lines
  }, [
    selectedConsole,
    consolePrice,
    controllerCount,
    extraControllers,
    controllerUnitPrice,
    controllersPrice,
    selectedGames,
    gamesPrice,
    selectedAccessories,
    accessoriesPrice,
  ])

  return (
    <div className="space-y-8">
      {/* Console */}
      <Section title="1. Choose Console" icon="videogame_asset">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REFURB_CONSOLES.map((c) => {
            const active = consoleId === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => changeConsole(c.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  active
                    ? 'border-primary-fixed bg-primary-fixed/10'
                    : 'border-outline-variant/30 bg-surface-container hover:border-primary-fixed/50'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <p className="font-headline-sm text-body-md font-bold text-on-surface">
                    {c.name}
                  </p>
                  <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span
                      className={`w-3 h-3 rounded-full transition-colors ${
                        active ? 'bg-primary-fixed' : 'bg-transparent'
                      }`}
                    />
                  </span>
                </div>
                <p className="font-body-md text-xs text-on-surface-variant mb-2">{c.tagline}</p>
                <p className="font-label-mono text-label-mono text-primary-fixed">
                  {formatPrice(c.basePrice)}
                </p>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Controllers */}
      {selectedConsole.controller && (
        <Section title="2. Number of Controllers" icon="stadia_controller">
          <div className="bg-surface-container rounded-xl border border-outline-variant/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-headline-sm text-body-md font-bold text-on-surface">
                {selectedConsole.controller.name}
              </p>
              <p className="font-body-md text-sm text-on-surface-variant">
                1 included with console · extra at {formatPrice(controllerUnitPrice)} each
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setControllerCount((n) => Math.max(includedController, n - 1))
                }
                disabled={controllerCount <= includedController}
                className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/40 disabled:opacity-30 text-on-surface flex items-center justify-center"
                aria-label="Decrease controllers"
              >
                <Icon name="remove" />
              </button>
              <span className="font-display-lg font-extrabold text-headline-sm text-on-surface w-10 text-center">
                {controllerCount}
              </span>
              <button
                type="button"
                onClick={() =>
                  setControllerCount((n) => Math.min(selectedConsole.maxControllers, n + 1))
                }
                disabled={controllerCount >= selectedConsole.maxControllers}
                className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/40 disabled:opacity-30 text-on-surface flex items-center justify-center"
                aria-label="Increase controllers"
              >
                <Icon name="add" />
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* Games */}
      {availableGames.length > 0 && (
        <Section title={`${selectedConsole.controller ? '3' : '2'}. Choose Games`} icon="sports_esports">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {availableGames.map((g) => {
              const checked = gameIds.includes(g.id)
              return (
                <label
                  key={g.id}
                  className={`cursor-pointer flex items-start justify-between gap-3 p-3 rounded-lg border-2 transition-colors ${
                    checked
                      ? 'border-primary-fixed bg-primary-fixed/10'
                      : 'border-outline-variant/30 bg-surface-container hover:border-primary-fixed/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleGame(g.id)}
                    className="sr-only"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-body-md text-sm font-bold text-on-surface line-clamp-1">
                      {g.name}
                    </p>
                    <p className="font-label-mono text-label-mono text-primary-fixed mt-1">
                      {formatPrice(g.price)}
                    </p>
                  </div>
                  <span
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      checked ? 'border-primary-fixed bg-primary-fixed' : 'border-outline-variant'
                    }`}
                  >
                    {checked && <Icon name="check" className="!text-sm text-on-primary-fixed" />}
                  </span>
                </label>
              )
            })}
          </div>
        </Section>
      )}

      {/* Accessories */}
      <Section
        title={`${selectedConsole.controller ? (availableGames.length ? '4' : '3') : '3'}. Accessories (optional)`}
        icon="cable"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CONSOLE_ACCESSORIES.map((a) => {
            const checked = accessoryIds.includes(a.id)
            return (
              <label
                key={a.id}
                className={`cursor-pointer flex items-start justify-between gap-3 p-3 rounded-lg border-2 transition-colors ${
                  checked
                    ? 'border-primary-fixed bg-primary-fixed/10'
                    : 'border-outline-variant/30 bg-surface-container hover:border-primary-fixed/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAccessory(a.id)}
                  className="sr-only"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-body-md text-sm font-bold text-on-surface">{a.name}</p>
                  <p className="font-label-mono text-label-mono text-primary-fixed mt-1">
                    {formatPrice(a.price)}
                  </p>
                </div>
                <span
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    checked ? 'border-primary-fixed bg-primary-fixed' : 'border-outline-variant'
                  }`}
                >
                  {checked && <Icon name="check" className="!text-sm text-on-primary-fixed" />}
                </span>
              </label>
            )
          })}
        </div>
      </Section>

      {/* Total + CTA */}
      <div className="sticky bottom-4 bg-surface-container-high border border-primary-fixed/30 rounded-2xl p-5 shadow-2xl">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">
              Total estimate
            </p>
            <p className="font-display-lg text-headline-md font-extrabold text-primary-fixed">
              {formatPrice(total)}
            </p>
            <p className="font-body-md text-xs text-on-surface-variant mt-1">
              {selectedGames.length} game{selectedGames.length === 1 ? '' : 's'} ·{' '}
              {controllerCount} controller{controllerCount === 1 ? '' : 's'} ·{' '}
              {selectedAccessories.length} accessor
              {selectedAccessories.length === 1 ? 'y' : 'ies'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOrderOpen(true)}
            className="bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold font-headline-sm flex items-center gap-2 hover:scale-[1.02] transition-transform neon-glow"
          >
            <Icon name="shopping_cart" />
            Place Order
          </button>
        </div>
      </div>

      <BuildOrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        title={`Refurbished ${selectedConsole.name}`}
        summaryLines={summaryLines}
        total={total}
      />
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div>
      <h3 className="font-display-lg text-headline-sm text-on-surface mb-4 flex items-center gap-2">
        <Icon name={icon} className="text-primary-fixed !text-2xl" />
        {title}
      </h3>
      {children}
    </div>
  )
}
