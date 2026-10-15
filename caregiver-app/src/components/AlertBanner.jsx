import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAlerts } from '../context/AlertsContext'
import { syncQueue } from '../lib/offline'

const ACTION_LABEL = {
  refresh: 'Refresh app', open_visit: 'Open the visit', open_schedule: 'Open schedule',
  open_profile: 'Open profile', acknowledge: 'Got it',
}

const fmtWhen = (d) => {
  const diffMin = Math.round((Date.now() - new Date(d)) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Runs an alert's button: refresh the app, open the visit, etc. */
export function useAlertAction() {
  const { acknowledge } = useAlerts()
  const navigate = useNavigate()
  return async (alert) => {
    await acknowledge(alert)
    switch (alert.action) {
      case 'refresh':
        // Push anything waiting offline first, then reload so every screen
        // picks up the office's changes.
        if (navigator.onLine) { try { await syncQueue() } catch { /* reload anyway */ } }
        window.location.reload()
        break
      case 'open_visit':
        navigate(alert.shift_id ? `/visit/${alert.shift_id}` : '/')
        break
      case 'open_schedule': navigate('/week'); break
      case 'open_profile': navigate('/profile'); break
      default: break
    }
  }
}

/** One alert, styled like the "update available" card. */
export function AlertCard({ alert, onLater, compact }) {
  const run = useAlertAction()
  const { acknowledge } = useAlerts()
  const [busy, setBusy] = useState(false)
  const urgent = alert.priority === 'urgent'
  const go = async () => { setBusy(true); await run(alert); setBusy(false) }
  return (
    <div className="card" role="alert" style={{
      background: urgent ? '#fdf1ee' : 'var(--paper)', border: `1.5px solid ${urgent ? 'var(--bad, #b3402a)' : 'var(--gold)'}`,
      marginBottom: compact ? 0 : '.8rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem' }}>
        <span className={`pill ${urgent ? 'pill-bad' : 'pill-gold'}`}>{urgent ? 'Urgent alert' : 'Alert from the office'}</span>
        <span className="muted" style={{ fontSize: '.74rem' }}>{fmtWhen(alert.created_at)}</span>
      </div>
      <p style={{ margin: '.5rem 0 .2rem', fontWeight: 700 }}>{alert.title}</p>
      {alert.body && <p className="muted" style={{ fontSize: '.88rem', margin: '0 0 .7rem' }}>{alert.body}</p>}
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={go} disabled={busy}>{busy ? 'One moment…' : ACTION_LABEL[alert.action] || 'Got it'}</button>
        {alert.action !== 'acknowledge' && (
          onLater
            ? <button className="btn btn-quiet" onClick={onLater}>Later</button>
            : <button className="btn btn-quiet" onClick={() => acknowledge(alert)}>Dismiss</button>
        )}
      </div>
    </div>
  )
}

/** Pinned under the top bar on every screen except Updates (which lists them all). */
export default function AlertBanner() {
  const { alerts } = useAlerts() || { alerts: [] }
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [snoozed, setSnoozed] = useState(() => new Set())
  if (pathname.startsWith('/updates')) return null
  const visible = alerts.filter((a) => !snoozed.has(a.id))
    .sort((a, b) => (b.priority === 'urgent') - (a.priority === 'urgent'))
  if (!visible.length) return null
  const top = visible[0]
  return (
    <div style={{ padding: '.7rem .9rem 0' }}>
      <AlertCard alert={top} compact onLater={() => setSnoozed((s) => new Set(s).add(top.id))} />
      {visible.length > 1 && (
        <button className="btn btn-quiet" style={{ fontSize: '.8rem', padding: '.3rem 0' }} onClick={() => navigate('/updates')}>
          +{visible.length - 1} more alert{visible.length - 1 === 1 ? '' : 's'} — view all
        </button>
      )}
    </div>
  )
}
