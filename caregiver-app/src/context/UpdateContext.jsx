import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const UpdateContext = createContext(null)

const VERSION_URL = 'https://hcms.goldenyearshomecarewa.com/downloads/version.json'
const APK_DOWNLOADS_BASE = 'https://hcms.goldenyearshomecarewa.com/downloads/'
const POLL_MS = 3 * 60 * 1000 // 3 minutes

// This app's own build version, baked in at build time. Unlike version.json
// (which can sit behind a CDN cache and go briefly stale), this value is
// always correct for the exact code currently running.
const MY_VERSION = import.meta.env.VITE_APP_VERSION || 'dev'

export function UpdateProvider({ children }) {
  const { caregiver } = useAuth()
  const [state, setState] = useState({
    checking: true, available: false, error: false,
    apkUrl: `${APK_DOWNLOADS_BASE}golden-years-care.apk`,
  })
  const alreadyNotified = useRef(false)

  const recheck = useCallback(async () => {
    setState((s) => ({ ...s, checking: true }))
    try {
      const r = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      const available = data.version !== MY_VERSION
      // Always point at the exact versioned file the manifest names —
      // a brand-new path every build, so no CDN can ever serve it stale.
      const apkUrl = data.apkFile ? `${APK_DOWNLOADS_BASE}${data.apkFile}` : `${APK_DOWNLOADS_BASE}golden-years-care.apk`
      setState({ checking: false, available, error: false, live: data, apkUrl })

      if (available && !alreadyNotified.current && caregiver?.id) {
        alreadyNotified.current = true
        await supabase.from('push_notifications_log').insert({
          caregiver_id: caregiver.id, kind: 'app_update',
          title: 'App update available', body: 'A new version of the Care App is ready to download.',
        })
      }
      if (!available) alreadyNotified.current = false
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
