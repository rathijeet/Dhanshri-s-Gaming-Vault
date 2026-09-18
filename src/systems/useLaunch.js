import { useEffect, useRef, useState } from 'react'

// Drives the staged launch for either flow. Returns the current stage index
// (-1 idle) and a `launch(run)` that plays the stages, runs the work, then
// scrolls the result into view — on a phone the payoff is below the fold and
// has to be brought to the customer rather than left for them to find.
export function useLaunch(stages, resultRef, { stageMs = 430, liftoffMs = 620 } = {}) {
  const [stage, setStage] = useState(-1)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  const launch = async (run) => {
    setStage(0)
    for (let i = 1; i < stages.length; i++) {
      await new Promise((r) => setTimeout(r, stageMs))
      if (!alive.current) return
      setStage(i)
    }
    try {
      run()
    } finally {
      if (alive.current) {
        setStage(stages.length)
        await new Promise((r) => setTimeout(r, liftoffMs))
        if (alive.current) setStage(-1)
      }
    }
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    )
  }

  return { stage, launch, alive }
}
