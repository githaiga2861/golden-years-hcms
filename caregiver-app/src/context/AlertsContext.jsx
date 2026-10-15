import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

// Alerts the office sends from Messages → Alerts ("your shift changed,
// refresh to apply", "visit notes missing", ...). They stay on screen,
// like "update available", until the caregiver acts on them.
const AlertsContext = createContext(null)

const isNative = () => Capacitor.getPlatform() !== 'web'

// On the installed web app (PWA) there is no FCM, so show a system
// notification through the service worker when an alert arrives.
async function showSystemNotification(alert) {
  try {
    if (isNative() || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const reg = await navigator.serviceWorker?.ready
    const opts = {
      body: alert.body || '', tag: `alert-${alert.id}`, renotify: true,
      icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
      requireInteraction: alert.priority === 'urgent', data: { url: '/updates' },
    }
    if (reg?.showNotification) await reg.showNotification(alert.title, opts)
    else new Notification(alert.title, opts)
  } catch { /* notifications are a nice-to-have; the banner is the source of truth */ }
}

export function AlertsProvider({ children }) {
  const { caregiver } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const known = useRef(new Set())
  const loadedOnce = useRef(false)

  const load = useCallback(async () => {
    if (!caregiver?.id) { setAlerts([]); return }
    const { data, error } = await supabase.from('caregiver_alerts').select('*')
      .eq('caregiver_id', caregiver.id).is('acknowledged_at', null)
      .order('created_at', { ascending: false }).limit(20)
    if (error) return // table not created yet — stay quiet
    const list = data || []
    // Anything we haven't seen in this session gets a system notification
    // (only after the first load, so opening the app doesn't replay old ones).
    if (loadedOnce.current) list.filter((a) => !known.current.has(a.id)).forEach(showSystemNotification)
    list.forEach((a) => known.current.add(a.id))
    loadedOnce.current = true
    setAlerts(list)
    const unseen = list.filter((a) => !a.seen_at).map((a) => a.id)
    if (unseen.length) await supabase.from('caregiver_alerts').update({ seen_at: new Date().toISOString() }).in('id', unseen)
  }, [caregiver?.id])

  useEffect(() => {
    known.current = new Set()
    loadedOnce.current = false
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  useEffect(() => {
    if (!caregiver?.id) return
    const ch = supabase.channel(`alerts-${caregiver.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caregiver_alerts', filter: `caregiver_id=eq.${caregiver.id}` }, load)
      .subscribe()
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { supabase.removeChannel(ch); document.removeEventListener('visibilitychange', onVisible) }
  }, [caregiver?.id, load])

  const acknowledge = useCallback(async (alert) => {
    setAlerts((xs) => xs.filter((a) => a.id !== alert.id))
    const now = new Date().toISOString()
    await supabase.from('caregiver_alerts').update({ acknowledged_at: now }).eq('id', alert.id)
    // Clear the matching bell entry too, so it doesn't linger as unread.
    await supabase.from('push_notifications_log').update({ read_at: now })
      .eq('caregiver_id', alert.caregiver_id).eq('kind', 'alert').eq('title', alert.title).is('read_at', null)
  }, [])

  const enableNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    const p = await Notification.requestPermission()
    setPermission(p)
  }, [])

  return (
    <AlertsContext.Provider value={{ alerts, acknowledge, reload: load, permission, enableNotifications, canAskPermission: !isNative() && permission === 'default' }}>
      {children}
    </AlertsContext.Provider>
  )
}

export const useAlerts = () => useContext(AlertsContext)
