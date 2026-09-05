import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

/**
 * Asks caregivers for the permissions the app genuinely needs, and keeps
 * asking on each sign-in until they're granted.
 *
 * A note on what's possible: Android requires the user to approve each
 * permission through its own system dialog — an app can't grant them on
 * someone's behalf. And if a permission is denied twice, Android stops
 * showing the dialog at all, so from that point the only route is the
 * phone's Settings screen. This screen handles both cases: it requests
 * normally where it can, and explains the Settings route where it can't.
 */
export default function PermissionsGate({ children }) {
  const [status, setStatus] = useState(null)   // { notifications, location }
  const [dismissed, setDismissed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState(false)

  const isNative = Capacitor.getPlatform() === 'android'

  const check = useCallback(async () => {
    if (!isNative) { setStatus({ notifications: 'granted', location: 'granted' }) ; return }
    let notifications = 'prompt'
    try {
      const p = await PushNotifications.checkPermissions()
      notifications = p.receive
    } catch { /* leave as prompt */ }

    let location = localStorage.getItem('gy-location-granted') === '1' ? 'granted' : 'prompt'
    if (location !== 'granted') {
      try {
        if (navigator.permissions?.query) {
          const p = await navigator.permissions.query({ name: 'geolocation' })
          location = p.state
          if (p.state === 'granted') localStorage.setItem('gy-location-granted', '1')
        }
      } catch { /* not supported in this WebView — rely on the fix below */ }
    }

    setStatus({ notifications, location })
  }, [isNative])

  useEffect(() => { check() }, [check])

  const requestAll = async () => {
    setBusy(true)
    setBlocked(false)

    // Notifications
    try {
      const before = await PushNotifications.checkPermissions()
      if (before.receive !== 'granted') {
        const after = await PushNotifications.requestPermissions()
        if (after.receive === 'denied') setBlocked(true)
      }
    } catch { /* ignore */ }

    // Location — asking the browser for a fix is what triggers Android's
    // location dialog inside the WebView.
    await new Promise((resolve) => {
      if (!navigator.geolocation) return resolve()
      navigator.geolocation.getCurrentPosition(
        () => { localStorage.setItem('gy-location-granted', '1'); resolve() },
        (err) => { if (err.code === err.PERMISSION_DENIED) setBlocked(true); resolve() },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })

    await check()
    setBusy(false)
  }

  const allGranted = status && status.notifications === 'granted' && status.location === 'granted'
  useEffect(() => {
    if (allGranted) localStorage.setItem('gy-permissions-done', '1')
  }, [allGranted])

  // Nothing to do on web, or once everything's granted.
  if (!status || allGranted || dismissed || localStorage.getItem('gy-permissions-done') === '1') return children

  const Row = ({ label, state, why }) => (
    <div style={{ display: 'flex', gap: '.7rem', alignItems: 'flex-start', marginBottom: '.9rem' }}>
      <div style={{ fontSize: '1.1rem', marginTop: '.1rem' }}>{state === 'granted' ? '✅' : '⚠️'}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{label}</div>
        <div className="muted" style={{ fontSize: '.84rem' }}>{why}</div>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,37,64,.55)', display: 'grid', placeItems: 'center', zIndex: 300, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, padding: '1.4rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>A few permissions are needed</h2>
        <p className="muted" style={{ fontSize: '.88rem', marginTop: 0 }}>
          The office needs these turned on for the app to work properly. You'll only be asked once.
        </p>

        <Row label="Notifications" state={status.notifications}
          why="So you're alerted right away about new messages, schedule changes, and care plan updates from the office — even when the app is closed." />
        <Row label="Location" state={status.location}
          why="So your clock in and clock out are GPS-verified at the client's home. This protects your hours — they can't be disputed." />

        {blocked && (
          <p className="notice notice-bad" style={{ fontSize: '.84rem' }}>
            Android won't show the prompt again after it's been declined. To finish, open your phone's
            <b> Settings → Apps → Golden Years Care → Permissions</b> and allow Notifications and Location there,
            then come back.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginTop: '1.1rem' }}>
          <button className="btn btn-primary" onClick={requestAll} disabled={busy}>
            {busy ? 'Requesting…' : 'Allow permissions'}
          </button>
          <button className="btn btn-quiet" onClick={() => setDismissed(true)} disabled={busy}>
            Not now
          </button>
        </div>
        <p className="muted" style={{ fontSize: '.76rem', textAlign: 'center', marginBottom: 0, marginTop: '.7rem' }}>
          If you skip, you'll be asked again next time you open the app.
        </p>
      </div>
    </div>
  )
}
