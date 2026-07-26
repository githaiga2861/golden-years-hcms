import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const UpdateContext = createContext(null)

const VERSION_URL = 'https://hcms.goldenyearshomecarewa.com/downloads/version.json'
const APK_BASE_URL = 'https://hcms.goldenyearshomecarewa.com/downloads/golden-years-care.apk'
const POLL_MS = 3 * 60 * 1000 // 3 minutes

export function UpdateProvider({ children }) {
  const { caregiver } = useAuth()
  const [state, setState] = useState({ checking: true, available: false, error: false, apkUrl: APK_BASE_URL })
  const alreadyNotified = useRef(false)

  const recheck = useCallback(async () => {
    setState((s) => ({ ...s, checking: true }))
    const current = import.meta.env.VITE_APP_VERSION || 'dev'
    try {
      const r = await fetch(VERSION_URL, { cache: 'no-store' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      const available = data.version !== current
      setState({ checking: false, available, error: false, live: data, apkUrl: `${APK_BASE_URL}?v=${data.version}` })

      if (available && !alreadyNotified.current && caregiver?.id) {
        alreadyNotified.current = true
        await supabase.from('push_notifications_log').insert({
          caregiver_id: caregiver.id, kind: 'app_update',
          title: 'App update available', body: 'A new version of the Care App is ready to download.',
        })
      }
      if (!available) alreadyNotified.current = false
    } catch {
      // Keep the previous state's available/apkUrl on a failed check —
      // only flag the error so the UI can say "couldn't check", without
      // losing whatever we last knew. Background polling will retry.
      setState((s) => ({ ...s, checking: false, error: true }))
    }
  }, [caregiver?.id])

  useEffect(() => {
    recheck()
    const t = setInterval(recheck, POLL_MS)
    return () => clearInterval(t)
  }, [recheck])

  return (
    <UpdateContext.Provider value={{ ...state, recheck }}>
      {children}
    </UpdateContext.Provider>
  )
}

export const useUpdate = () => useContext(UpdateContext)
