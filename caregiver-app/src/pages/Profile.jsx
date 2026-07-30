import { useAuth } from '../context/AuthContext'
import { useUpdate } from '../context/UpdateContext'
import { useTutorial } from '../context/TutorialContext'
import { DEMO_CREDENTIALS } from '../lib/tutorialDemoData'
import { pendingCount, syncQueue } from '../lib/offline'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const statusPill = (expiry) => {
  if (!expiry) return null
  const days = Math.floor((new Date(expiry) - new Date()) / 86400000)
  if (days < 0) return <span className="pill pill-bad">Expired</span>
  if (days <= 30) return <span className="pill pill-warn">Expires in {days}d</span>
  return <span className="pill pill-ok">Valid</span>
}

export default function Profile() {
  const { caregiver, session, signOut } = useAuth()
  const updateInfo = useUpdate()
  const tutorial = useTutorial()
  const [pending, setPending] = useState(pendingCount())
  const [credentials, setCredentials] = useState([])
  const [timeOff, setTimeOff] = useState([])
  const [showRequest, setShowRequest] = useState(false)
  const [req, setReq] = useState({ starts_at: '', ends_at: '', reason: '' })
  const [reqErr, setReqErr] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => {
    if (tutorial?.running) { setCredentials(DEMO_CREDENTIALS); setTimeOff([]); return }
    if (!caregiver) return
    supabase.from('caregiver_credentials').select('*').eq('caregiver_id', caregiver.id)
      .order('expiry_date', { nullsFirst: false }).then(({ data }) => setCredentials(data || []))
    loadTimeOff()
  }, [caregiver, tutorial?.running]) // eslint-disable-line

  const loadTimeOff = () => {
    if (!caregiver) return
    supabase.from('caregiver_time_off').select('*').eq('caregiver_id', caregiver.id)
      .order('starts_at', { ascending: false }).then(({ data }) => setTimeOff(data || []))
  }

  const submitRequest = async () => {
    setReqErr('')
    if (!req.starts_at || !req.ends_at) return setReqErr('Start and end are required.')
    const { error } = await supabase.from('caregiver_time_off').insert({
      caregiver_id: caregiver.id, starts_at: req.starts_at, ends_at: req.ends_at, reason: req.reason, status: 'pending',
    })
    if (error) return setReqErr(error.message)
    setReq({ starts_at: '', ends_at: '', reason: '' }); setShowRequest(false)
    loadTimeOff()
  }

  const STATUS_KIND = { pending: 'warn', approved: 'ok', denied: 'bad' }

  return (
    <>
      <h1>Profile</h1>
      <div className="card" data-tutorial="profile-header-card">
        <h3>{caregiver ? `${caregiver.first_name} ${caregiver.last_name}` : session?.user?.email}</h3>
        <p className="muted" style={{ fontSize: '.9rem' }}>{session?.user?.email}</p>
        {caregiver?.mileage_rate && (
          <p className="muted" style={{ fontSize: '.86rem' }}>Mileage reimbursed at ${Number(caregiver.mileage_rate).toFixed(2)}/mile between clients.</p>
        )}
        <button className="btn btn-outline" data-tutorial="profile-change-password" style={{ marginTop: '.6rem' }} onClick={() => setShowPwd(true)}>Change password</button>
        <button className="btn btn-outline" style={{ marginTop: '.5rem' }} onClick={() => tutorial?.start()}>Retake the app tour</button>
      </div>

      {showPwd && <ChangePasswordModal email={session?.user?.email} onClose={() => setShowPwd(false)} />}

      {credentials.length > 0 && (
        <div className="card" data-tutorial="profile-credentials">
          <h3>My credentials</h3>
          {credentials.map((c) => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem 0', borderBottom: '1px solid var(--line)' }}>
              <div>
                <b>{c.credential_type}</b>
                <div className="muted" style={{ fontSize: '.82rem' }}>
                  {c.expiry_date ? `Expires ${c.expiry_date}` : 'No expiry'}
                </div>
              </div>
              {statusPill(c.expiry_date)}
            </div>
          ))}
        </div>
      )}

      <div className="card" data-tutorial="profile-timeoff">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Time off</h3>
          <button className="btn btn-outline" onClick={() => setShowRequest((v) => !v)}>
            {showRequest ? 'Cancel' : '+ Request'}
          </button>
        </div>
        {showRequest && (
          <div style={{ marginTop: '.7rem' }}>
            {reqErr && <p className="notice notice-bad">{reqErr}</p>}
            <label style={{ fontSize: '.85rem', fontWeight: 600 }}>Starts</label>
            <input type="datetime-local" value={req.starts_at} onChange={(e) => setReq({ ...req, starts_at: e.target.value })} style={{ width: '100%', marginBottom: '.5rem' }} />
            <label style={{ fontSize: '.85rem', fontWeight: 600 }}>Ends</label>
            <input type="datetime-local" value={req.ends_at} onChange={(e) => setReq({ ...req, ends_at: e.target.value })} style={{ width: '100%', marginBottom: '.5rem' }} />
            <label style={{ fontSize: '.85rem', fontWeight: 600 }}>Reason (optional)</label>
            <input value={req.reason} onChange={(e) => setReq({ ...req, reason: e.target.value })} style={{ width: '100%', marginBottom: '.6rem' }} />
            <button className="btn btn-primary" onClick={submitRequest}>Submit request</button>
          </div>
        )}
        {timeOff.length === 0 && !showRequest && <p className="muted" style={{ fontSize: '.9rem', marginTop: '.4rem' }}>No time off requested yet.</p>}
        {timeOff.map((t) => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.5rem 0', borderTop: '1px solid var(--line)', marginTop: '.5rem' }}>
            <div>
              <b style={{ fontSize: '.9rem' }}>{new Date(t.starts_at).toLocaleDateString()} → {new Date(t.ends_at).toLocaleDateString()}</b>
              {t.reason && <div className="muted" style={{ fontSize: '.8rem' }}>{t.reason}</div>}
            </div>
            <span className={`pill pill-${STATUS_KIND[t.status] || 'muted'}`}>{t.status}</span>
          </div>
        ))}
      </div>

      <div className="card" data-tutorial="profile-offline">
        <h3>Offline uploads</h3>
        <p className="muted" style={{ fontSize: '.9rem' }}>
          {pending === 0 ? 'Everything is synced. ✓' : `${pending} action${pending > 1 ? 's' : ''} waiting to upload.`}
        </p>
        {pending > 0 && (
          <button className="btn btn-outline" onClick={async () => { await syncQueue(setPending); setPending(pendingCount()) }}>
            Try syncing now
          </button>
        )}
      </div>
      <div className="card">
        <h3>Need help?</h3>
        <p className="muted" style={{ fontSize: '.9rem' }}>Call the Golden Years office: <a href="tel:+12067171234">(206) 717-1234</a></p>
      </div>
      <div className="card" data-tutorial="profile-updates-card">
        <h3>App updates</h3>
        {updateInfo.checking && <p className="muted" style={{ fontSize: '.9rem' }}>Checking for updates…</p>}
        {!updateInfo.checking && updateInfo.error && (
          <p className="muted" style={{ fontSize: '.9rem' }}>Couldn't check for updates right now — try again later.</p>
        )}
        {!updateInfo.checking && !updateInfo.error && !updateInfo.available && (
          <p style={{ fontSize: '.9rem' }}><span className="pill pill-ok">Up to date</span></p>
        )}
        {!updateInfo.checking && !updateInfo.error && updateInfo.available && (
          <>
            <p style={{ fontSize: '.9rem', marginBottom: '.6rem' }}><span className="pill pill-gold">Update available</span></p>
            <a className="btn btn-primary" href={updateInfo.apkUrl} download style={{ display: 'inline-block' }}>
              Download update
            </a>
            <p className="muted" style={{ fontSize: '.78rem', marginTop: '.5rem' }}>
              Open the downloaded file and tap Install. This updates the app in place — your login and data stay exactly as they are, as long as you don't uninstall first.
            </p>
          </>
        )}
      </div>

      <button className="btn btn-outline" data-tutorial="profile-signout" onClick={signOut}>Sign out</button>
    </>
  )
}

function ChangePasswordModal({ email, onClose }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const save = async () => {
    setErr('')
    if (!current) return setErr('Enter your current password.')
    if (!next || next.length < 8) return setErr('New password must be at least 8 characters.')
    if (next !== confirmPwd) return setErr('New passwords do not match.')
    setBusy(true)
    // Routed through a server-side function (not a direct client call)
    // so the office's encrypted login-secret copy stays in sync too.
    const { data, error } = await supabase.functions.invoke('caregiver-change-own-password', {
      body: { current_password: current, new_password: next },
    })
    setBusy(false)
    const problem = error ? (data?.error || error.message) : data?.error
    if (problem) return setErr(problem)
    setDone(true)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,37,64,.45)', display: 'grid', placeItems: 'center', zIndex: 60, padding: '1rem' }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 400, padding: '1.2rem' }}>
        <h3 style={{ marginTop: 0 }}>Change password</h3>
        {done ? (
          <>
            <p className="notice notice-ok">Your password has been changed.</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>Done</button>
          </>
        ) : (
          <>
            {err && <p className="notice notice-bad">{err}</p>}
            <div className="field">
              <label>Current password</label>
              <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div className="field">
              <label>New password</label>
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.8rem' }}>
              <button className="btn btn-quiet" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
