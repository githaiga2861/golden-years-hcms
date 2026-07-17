import { createContext, useCallback, useContext, useState } from 'react'

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
