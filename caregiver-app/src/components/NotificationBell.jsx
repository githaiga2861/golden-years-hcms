import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useUnread } from '../context/UnreadContext'

const fmtWhen = (d) => {
  const diffMin = Math.round((Date.now() - new Date(d)) / 60000)
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffMin < 1440) return `${Math.round(diffMin / 60)}h ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const KIND_LABEL = { message: 'Message', update: 'Update', visit: 'Visit', app_update: 'App Update' }

// Where tapping each kind of notification should take you. The matching
// screen highlights what you were sent there for.
const DESTINATION = {
  message: { path: '/messages', state: { highlight: 'messages' } },
  update: { path: '/updates', state: { highlight: 'updates' } },
  app_update: { path: '/profile', state: { highlightUpdate: true } },
  visit: { path: '/', state: {} },
}

export default function NotificationBell() {
  const { caregiver } = useAuth()
  const { unreadNotifs, recheckNotifs } = useUnread()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)

  const load = () => {
    if (!caregiver) return
    supabase.from('push_notifications_log').select('*').eq('caregiver_id', caregiver.id)
      .order('created_at', { ascending: false }).limit(80)
      .then(({ data }) => setItems(data || []))
  }
  useEffect(() => { load() }, [caregiver?.id]) // eslint-disable-line

  // Keep the list itself live while it's open, so a notification arriving
  // mid-scroll appears without closing and reopening.
  useEffect(() => {
    if (!caregiver) return
    const ch = supabase.channel(`bell-${caregiver.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'push_notifications_log' }, load)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [caregiver?.id]) // eslint-disable-line

  const markRead = async (item) => {
    if (item.read_at) return
    await supabase.from('push_notifications_log').update({ read_at: new Date().toISOString() }).eq('id', item.id)
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, read_at: new Date().toISOString() } : i))
    recheckNotifs()
  }

  // Tapping a notification should both clear it and take you to the thing
  // it was about — not just sit there.
  const openItem = async (item) => {
    await markRead(item)
    const dest = DESTINATION[item.kind]
    setOpen(false)
    if (dest) navigate(dest.path, { state: dest.state })
  }

  const markAllRead = async () => {
    const unread = items.filter((i) => !i.read_at)
    if (!unread.length) return
    await supabase.from('push_notifications_log').update({ read_at: new Date().toISOString() }).in('id', unread.map((i) => i.id))
    setItems((prev) => prev.map((i) => ({ ...i, read_at: i.read_at || new Date().toISOString() })))
    recheckNotifs()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Notifications" title="Notifications"
        style={{
          position: 'relative', width: 34, height: 34, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,.5)',
          background: 'rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center', marginRight: '.4rem',
        }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadNotifs > 0 && (
          <span style={{
            position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, padding: '0 3px',
            display: 'grid', placeItems: 'center', fontSize: '.62rem', fontWeight: 700, lineHeight: 1,
            background: 'var(--gold)', color: 'var(--blue-ink)', borderRadius: '50%', border: '1.5px solid var(--blue-ink)',
          }}>{unreadNotifs}</span>
        )}
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 70, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.8rem 1rem', borderBottom: '1px solid var(--line)' }}>
            <button className="btn btn-quiet" style={{ padding: '.2rem .4rem' }} onClick={() => setOpen(false)}>←</button>
            <h2 style={{ margin: 0, flex: 1 }}>Notifications</h2>
            {unreadNotifs > 0 && <button className="btn btn-quiet" style={{ fontSize: '.82rem' }} onClick={markAllRead}>Mark all read</button>}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {items.length === 0 && (
              <div className="empty"><h3>No notifications yet</h3><p>New messages, updates, visits, and app updates will show up here.</p></div>
            )}
            {items.map((i) => (
              <div key={i.id} className="card" onClick={() => openItem(i)}
                style={{ borderLeft: i.read_at ? '4px solid transparent' : '4px solid var(--gold)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="pill pill-info">{KIND_LABEL[i.kind] || 'Notification'}</span>
                  {!i.read_at && <span className="pill pill-gold">New</span>}
                </div>
                <p style={{ margin: '.5rem 0 .2rem', fontWeight: 600 }}>{i.title}</p>
                {i.body && <p className="muted" style={{ margin: 0, fontSize: '.9rem' }}>{i.body}</p>}
                <p className="muted" style={{ margin: '.4rem 0 0', fontSize: '.78rem' }}>{fmtWhen(i.created_at)} · tap to open</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
