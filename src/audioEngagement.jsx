import { createContext, useContext, useEffect, useState } from 'react'

const AudioEngagementContext = createContext(false)

export function useAudioEngaged() {
  return useContext(AudioEngagementContext)
}

export function AudioEngagementProvider({ children }) {
  const [engaged, setEngaged] = useState(false)

  useEffect(() => {
    if (engaged) return
    const onInteract = () => setEngaged(true)
    const opts = { capture: true, once: true, passive: true }
    window.addEventListener('pointerdown', onInteract, opts)
    window.addEventListener('keydown', onInteract, opts)
    return () => {
      window.removeEventListener('pointerdown', onInteract, opts)
      window.removeEventListener('keydown', onInteract, opts)
    }
  }, [engaged])

  return (
    <AudioEngagementContext.Provider value={engaged}>
      {children}
    </AudioEngagementContext.Provider>
  )
}
