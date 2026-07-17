import { createContext, useCallback, useContext, useState } from 'react'

/**
 * A single "refresh everything on this page" mechanism shared across the
 * whole app. Bumping the tick remounts the current routed page, which
 * re-runs its data-loading effects — giving a real refetch without any
 * navigation or full page reload.
 */
const RefreshContext = createContext(null)

export function RefreshProvider({ children }) {
  const [tick, setTick] = useState(0)
  const [spinning, setSpinning] = useState(false)

  const refresh = useCallback(() => {
    setSpinning(true)
    setTick((t) => t + 1)
    setTimeout(() => setSpinning(false), 700)
  }, [])

  return (
    <RefreshContext.Provider value={{ tick, spinning, refresh }}>
      {children}
    </RefreshContext.Provider>
  )
}

export const useRefresh = () => useContext(RefreshContext)
