import { createContext, useCallback, useContext, useState } from 'react'
import { useAutoRefresh } from '../lib/useAutoRefresh'

const RefreshContext = createContext(null)

export function RefreshProvider({ children }) {
  const [tick, setTick] = useState(0)
  const [spinning, setSpinning] = useState(false)

  const refresh = useCallback(() => {
    setSpinning(true)
    setTick((t) => t + 1)
    setTimeout(() => setSpinning(false), 700)
  }, [])

  // Keep the open page in step with the database automatically.
  useAutoRefresh(refresh)

  return (
    <RefreshContext.Provider value={{ tick, spinning, refresh }}>
      {children}
    </RefreshContext.Provider>
  )
}

export const useRefresh = () => useContext(RefreshContext)
