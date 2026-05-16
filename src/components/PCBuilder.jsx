import { useMemo, useState } from 'react'
import { PC_BUILD_FEE, PC_SECTIONS, formatPrice } from '../buildConfig'
import Icon from './Icon'
import BuildOrderModal from './BuildOrderModal'

// Selection state: { [sectionKey]: optionId | [optionId, ...] | null }
const buildInitialSelection = () => {
  const init = {}
  PC_SECTIONS.forEach((s) => {
    if (s.multi) init[s.key] = []
    else init[s.key] = null
  })
  return init
}

export default function PCBuilder() {
  const [selection, setSelection] = useState(buildInitialSelection)
  const [orderOpen, setOrderOpen] = useState(false)
  const [touched, setTouched] = useState(false)

  const selectOption = (sectionKey, optionId, multi) => {
    setSelection((curr) => {
      if (multi) {
        const list = curr[sectionKey] || []
        return {
          ...curr,
          [sectionKey]: list.includes(optionId)
            ? list.filter((x) => x !== optionId)
            : [...list, optionId],
        }
      }
      return { ...curr, [sectionKey]: curr[sectionKey] === optionId ? null : optionId }
    })
  }

  // Compute selected option(s) per section
  const selectedPerSection = useMemo(() => {
    return PC_SECTIONS.map((section) => {
      const sel = selection[section.key]
      let chosen = []
      if (section.multi) {
        chosen = section.options.filter((o) => sel?.includes(o.id))
      } else if (sel) {
        const found = section.options.find((o) => o.id === sel)
        if (found) chosen = [found]
      }
      return { section, chosen }
    })
  }, [selection])

  const partsTotal = selectedPerSection.reduce(
    (s, { chosen }) => s + chosen.reduce((a, b) => a + b.price, 0),
    0
  )
  const total = partsTotal > 0 ? partsTotal + PC_BUILD_FEE : 0

  // Required validation
  const missingRequired = useMemo(() => {
    return PC_SECTIONS.filter((section) => {
      if (!section.required) return false
      const sel = selection[section.key]
      return !sel
    })
  }, [selection])
  const isValid = missingRequired.length === 0

  const summaryLines = useMemo(() => {
    const lines = []
    selectedPerSection.forEach(({ section, chosen }) => {
      if (chosen.length === 0) return
      if (section.multi || chosen.length > 1) {
        lines.push(`*${section.label}:*`)
        chosen.forEach((c) => {
          lines.push(`  · ${c.name} — ${formatPrice(c.price)}`)
        })
      } else {
        lines.push(`*${section.label}:* ${chosen[0].name} — ${formatPrice(chosen[0].price)}`)
      }
    })
    lines.push(`*Assembly + OS Install Fee:* ${formatPrice(PC_BUILD_FEE)}`)
    return lines
  }, [selectedPerSection])

  const handlePlaceOrder = () => {
    if (!isValid) {
      setTouched(true)
      // scroll to first missing required section
      const first = missingRequired[0]
      const el = document.getElementById(`pc-section-${first.key}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setOrderOpen(true)
  }

  return (
    <div className="space-y-8">
      {touched && missingRequired.length > 0 && (
        <div className="bg-error-container/20 border border-error/40 rounded-xl p-4 flex gap-3 items-start sticky top-4 z-10 backdrop-blur-md">
          <Icon name="error" className="text-error flex-shrink-0 !text-2xl" filled />
          <div>
            <p className="font-headline-sm text-body-md font-bold text-error">
              Please pick: {missingRequired.map((s) => s.label).join(', ')}
            </p>
            <p className="font-body-md text-sm text-on-surface-variant mt-1">
              Required components are missing.
            </p>
          </div>
        </div>
      )}

      {PC_SECTIONS.map((section, idx) => {
        const sel = selection[section.key]
        const hasError =
          touched && section.required && !sel
        return (
          <div key={section.key} id={`pc-section-${section.key}`} className="scroll-mt-32">
            <h3 className="font-display-lg text-headline-sm text-on-surface mb-1 flex items-center gap-2">
              <Icon name={section.icon} className="text-primary-fixed !text-2xl" />
              {idx + 1}. {section.label}
              {section.required && <span className="text-error text-base">*</span>}
              {section.multi && (
                <span className="font-label-mono text-label-mono text-on-surface-variant ml-2">
                  (multi-select)
                </span>
              )}
            </h3>
            {hasError && (
              <p className="text-error font-body-md text-sm mb-2">Please select an option</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
              {section.options.map((opt) => {
                const isSelected = section.multi ? sel?.includes(opt.id) : sel === opt.id
                return (
                  <label
                    key={opt.id}
                    className={`cursor-pointer flex items-start justify-between gap-3 p-3 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? 'border-primary-fixed bg-primary-fixed/10'
                        : hasError
                          ? 'border-error/40 bg-error-container/5 hover:border-error/60'
                          : 'border-outline-variant/30 bg-surface-container hover:border-primary-fixed/50'
                    }`}
                  >
                    <input
                      type={section.multi ? 'checkbox' : 'radio'}
                      name={section.key}
                      checked={isSelected}
                      onChange={() => selectOption(section.key, opt.id, section.multi)}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-body-md text-sm font-bold text-on-surface line-clamp-1">
                        {opt.name}
                      </p>
                      {opt.tagline && (
                        <p className="font-body-md text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                          {opt.tagline}
                        </p>
                      )}
                      <p className="font-label-mono text-label-mono text-primary-fixed mt-1">
                        {opt.price === 0 ? 'Included' : formatPrice(opt.price)}
                      </p>
                    </div>
                    <span
                      className={`w-5 h-5 ${
                        section.multi ? 'rounded' : 'rounded-full'
                      } border-2 flex-shrink-0 flex items-center justify-center transition-colors mt-1 ${
                        isSelected
                          ? 'border-primary-fixed bg-primary-fixed'
                          : 'border-outline-variant'
                      }`}
                    >
                      {isSelected &&
                        (section.multi ? (
                          <Icon name="check" className="!text-sm text-on-primary-fixed" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-on-primary-fixed" />
                        ))}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Build fee note */}
      <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20">
        <p className="font-label-mono text-label-mono text-on-surface-variant uppercase mb-1">
          Assembly & OS Install
        </p>
        <p className="font-body-md text-sm text-on-surface">
          Flat {formatPrice(PC_BUILD_FEE)} fee includes assembly, cable management, BIOS update,
          stress test, and OS installation. Free pickup if collected from our Nagpur location.
        </p>
      </div>

      {/* Sticky total + CTA */}
      <div className="sticky bottom-4 bg-surface-container-high border border-primary-fixed/30 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <p className="font-label-mono text-label-mono text-on-surface-variant uppercase">
              Total estimate
            </p>
            <p className="font-display-lg text-headline-md font-extrabold text-primary-fixed">
              {formatPrice(total)}
            </p>
            {partsTotal > 0 && (
              <p className="font-body-md text-xs text-on-surface-variant mt-1">
                Parts: {formatPrice(partsTotal)} · Build fee: {formatPrice(PC_BUILD_FEE)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            className="bg-primary-fixed text-on-primary-fixed px-6 py-3 rounded-xl font-bold font-headline-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform neon-glow"
          >
            <Icon name="shopping_cart" />
            Place Order
          </button>
        </div>
      </div>

      <BuildOrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        title="Custom Gaming PC Build"
        summaryLines={summaryLines}
        total={total}
      />
    </div>
  )
}
