import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const UpdateContext = createContext(null)

const VERSION_URL = 'https://care.goldenyearshomecarewa.com/downloads/version.json'
const POLL_MS = 3 * 60 * 1000 // 3 minutes

// This app's own build version, baked in at build time. Unlike version.json
// (which can sit behind a CDN cache and go briefly stale), this value is
// always correct for the exact code currently running.
const MY_VERSION = import.meta.env.VITE_APP_VERSION || 'dev'

export function UpdateProvider({ children }) {
  const { caregiver } = useAuth()
  const [state, setState] = useState({ checking: true, available: false, error: false, apkUrl: '' })
  const alreadyNotified = useRef(false)

  const recheck = useCallback(async () => {
    setState((s) => ({ ...s, checking: true }))
    try {
      const r = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      const available = data.version !== MY_VERSION
      // Always download through our own domain — the proxy there fetches
      // the real file server-side, so caregivers never see a GitHub URL.
      const apkUrl = 'https://hcms.goldenyearshomecarewa.com/api/download'
      setState({ checking: false, available, error: false, live: data, apkUrl })

      if (available && !alreadyNotified.current && caregiver?.id) {
        alreadyNotified.current = true
        await supabase.from('push_notifications_log').insert({
          caregiver_id: caregiver.id, kind: 'app_update',
          title: 'App update available', body: 'A new version of the Care App is ready to download.',
        })
      }
      if (!available) {
        alreadyNotified.current = false
        // They're on the newest build now, so any "update available"
        // notification is stale — clear it rather than make them tap it.
        if (caregiver?.id) {
          await supabase.from('push_notifications_log')
            .update({ read_at: new Date().toISOString() })
            .eq('caregiver_id', caregiver.id).eq('kind', 'app_update').is('read_at', null)
        }
      }
    } catch {
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
