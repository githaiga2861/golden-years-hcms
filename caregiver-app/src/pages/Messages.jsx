import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useUnread } from '../context/UnreadContext'

const fmtWhen = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const fmtShort = (d) => {
  const diffH = (Date.now() - new Date(d)) / 3600000
  if (diffH < 24) return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diffH < 24 * 7) return new Date(d).toLocaleDateString('en-US', { weekday: 'short' })
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Messages() {
  const { caregiver, session } = useAuth()
  const { recheckMsg } = useUnread()
  const [threads, setThreads] = useState([])
  const [lastMsg, setLastMsg] = useState({})
  const [unread, setUnread] = useState({})
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const bottomRef = useRef(null)

  const loadThreads = async () => {
    if (!caregiver) return
    const { data: t } = await supabase.from('message_threads').select('*').eq('caregiver_id', caregiver.id)
      .order('created_at', { ascending: false })
    setThreads(t || [])

    const { data: lastRows } = await supabase.from('v_thread_last_message').select('*')
    const lastMap = {}
    for (const r of lastRows || []) lastMap[r.thread_id] = r
    setLastMsg(lastMap)

    const { data: unreadRows } = await supabase.from('messages').select('thread_id')
      .is('read_at', null).neq('sender_id', session.user.id)
    const counts = {}
    for (const r of unreadRows || []) counts[r.thread_id] = (counts[r.thread_id] || 0) + 1
    setUnread(counts)
  }
  useEffect(() => { loadThreads() }, [caregiver?.id]) // eslint-disable-line

  const openThread = async (th) => {
    setSelected(th)
    const { data: m } = await supabase.from('messages').select('*, profiles(full_name)')
      .eq('thread_id', th.id).order('created_at')
    setMessages(m || [])
    const toMark = (m || []).filter((x) => x.sender_id !== session.user.id && !x.read_at)
    if (toMark.length) {
      await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', toMark.map((x) => x.id))
      setUnread((u) => ({ ...u, [th.id]: 0 }))
      recheckMsg()
    }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const send = async () => {
    const text = body.trim()
    if (!text || !selected) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      thread_id: selected.id, sender_id: session.user.id, body: text,
    })
    setSending(false)
    if (!error) { setBody(''); openThread(selected); loadThreads() }
  }

  if (!caregiver) {
    return (
      <>
        <h1 style={{ marginBottom: 0 }}>Messages</h1>
        <p className="muted" style={{ marginTop: 0 }}>Loading…</p>
      </>
    )
  }

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
        <button className="btn btn-quiet" style={{ alignSelf: 'flex-start', marginBottom: '.3rem' }} onClick={() => setSelected(null)}>← All conversations</button>
        <h1 style={{ marginBottom: '.1rem', fontSize: '1.2rem' }}>{selected.subject}</h1>
        <p className="muted" style={{ marginTop: 0, marginBottom: '.6rem' }}>Chat with the Golden Years office.</p>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '.8rem' }}>
          {messages.length === 0 && (
            <div className="empty"><h3>No messages yet</h3><p>Send a note to the office below — they'll see it right away.</p></div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === session.user.id
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: '.6rem' }}>
                <div style={{
                  maxWidth: '78%', padding: '.6rem .8rem', borderRadius: 12,
                  background: mine ? 'var(--blue)' : '#fff', color: mine ? '#fff' : 'var(--ink)',
                  border: mine ? 'none' : '1px solid var(--line)',
                }}>
                  <div style={{ fontSize: '.95rem' }}>{m.body}</div>
                  <div style={{ fontSize: '.7rem', marginTop: '.25rem', opacity: .75 }}>
                    {mine ? 'You' : (m.profiles?.full_name || 'Office')} · {fmtWhen(m.created_at)}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: 'flex', gap: '.5rem' }}>
          <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), send())}
            style={{ flex: 1, padding: '.7rem .8rem', border: '1px solid var(--line)', borderRadius: 10 }} />
          <button className="btn btn-primary" style={{ width: 'auto', padding: '.7rem 1.1rem' }} onClick={send} disabled={sending || !body.trim()}>
            Send
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ marginBottom: 0 }}>Messages</h1>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '.5rem .9rem', fontSize: '.86rem' }} onClick={() => setShowNew(true)}>+ New</button>
      </div>
      <p className="muted" style={{ marginTop: 0, marginBottom: '.8rem' }}>Chat directly with the Golden Years office.</p>

      {threads.length === 0 && (
        <div className="empty"><h3>No conversations yet</h3><p>Tap "+ New" above to message the office.</p></div>
      )}
      {threads.map((t) => {
        const last = lastMsg[t.id]
        const unreadCount = unread[t.id] || 0
        return (
          <button key={t.id} onClick={() => openThread(t)}
            style={{ display: 'block', width: '100%', textAlign: 'left', background: '#fff', marginBottom: '.5rem',
              border: '1px solid var(--line)', borderRadius: 10, padding: '.75rem .9rem', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <b style={{ fontSize: '.94rem' }}>{t.subject}</b>
              {last && <span className="muted" style={{ fontSize: '.72rem', flexShrink: 0, marginLeft: '.4rem' }}>{fmtShort(last.last_at)}</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.2rem' }}>
              <span className="muted" style={{ fontSize: '.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {last?.last_body || 'No messages yet'}
              </span>
              {unreadCount > 0 && <span className="badge" style={{ flexShrink: 0, marginLeft: '.4rem' }}>{unreadCount}</span>}
            </div>
          </button>
        )
      })}

      {showNew && (
        <NewConversationModal
          caregiverId={caregiver.id}
          userId={session.user.id}
          onClose={() => setShowNew(false)}
          onCreated={(th) => { setShowNew(false); loadThreads(); openThread(th) }}
        />
      )}
    </>
  )
}

function NewConversationModal({ caregiverId, userId, onClose, onCreated }) {
  const [subject, setSubject] = useState('')
  const [firstMessage, setFirstMessage] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const create = async () => {
    setErr('')
    if (!subject.trim()) return setErr('Enter a subject for this conversation.')
    setBusy(true)
    const { data: th, error } = await supabase.from('message_threads')
      .insert({ caregiver_id: caregiverId, subject: subject.trim() }).select().single()
    if (error) { setErr(error.message); setBusy(false); return }

    if (firstMessage.trim()) {
      await supabase.from('messages').insert({ thread_id: th.id, sender_id: userId, body: firstMessage.trim() })
    }
    setBusy(false)
    onCreated(th)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,37,64,.45)', display: 'grid', placeItems: 'center', zIndex: 60, padding: '1rem' }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, padding: '1.2rem' }}>
        <h3 style={{ marginTop: 0 }}>New conversation</h3>
        {err && <p className="notice notice-bad">{err}</p>}
        <div className="field">
          <label>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Question about a client" />
        </div>
        <div className="field">
          <label>First message (optional)</label>
          <textarea rows={3} value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} placeholder="Type your message…" />
        </div>
        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.8rem' }}>
          <button className="btn btn-quiet" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={create} disabled={busy}>{busy ? 'Starting…' : 'Start conversation'}</button>
        </div>
      </div>
    </div>
  )
}
