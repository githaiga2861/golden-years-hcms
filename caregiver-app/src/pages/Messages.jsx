import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useUnread } from '../context/UnreadContext'
import { useTutorial } from '../context/TutorialContext'
import { DEMO_THREADS, DEMO_LAST_MSG, DEMO_MESSAGES } from '../lib/tutorialDemoData'

const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const fmtShort = (d) => {
  const diffH = (Date.now() - new Date(d)) / 3600000
  if (diffH < 24) return fmtTime(d)
  if (diffH < 24 * 7) return new Date(d).toLocaleDateString('en-US', { weekday: 'short' })
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Messages() {
  const { caregiver, session } = useAuth()
  const { recheckMsg } = useUnread()
  const tutorial = useTutorial()
  const [threads, setThreads] = useState([])
  const [lastMsg, setLastMsg] = useState({})
  const [unread, setUnread] = useState({})
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const bottomRef = useRef(null)
  const textRef = useRef(null)

  const loadThreads = async () => {
    if (tutorial?.running) { setThreads(DEMO_THREADS); setLastMsg(DEMO_LAST_MSG); setUnread({}); return }
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
  useEffect(() => { loadThreads() }, [caregiver?.id, tutorial?.running]) // eslint-disable-line

  const openThread = async (th) => {
    if (tutorial?.running) { setSelected(th); setMessages(DEMO_MESSAGES[th.id] || []); return }
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

  const autoGrow = (el) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }
  useEffect(() => { autoGrow(textRef.current) }, [body])

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
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', margin: '0 -1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem 1rem', borderBottom: '1px solid var(--line)', background: '#fff' }}>
          <button className="btn btn-quiet" style={{ padding: '.2rem .4rem' }} onClick={() => setSelected(null)}>←</button>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.98rem' }}>{selected.subject}</div>
            <div className="muted" style={{ fontSize: '.76rem' }}>Golden Years office</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: 'var(--paper)' }}>
          {messages.length === 0 && (
            <div className="empty"><h3>No messages yet</h3><p>Send a note to the office below — they'll see it right away.</p></div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === session.user.id
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: '.7rem' }}>
                <div style={{
                  maxWidth: '78%', padding: '.6rem .85rem', borderRadius: mine ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                  background: mine ? 'var(--blue)' : '#fff', color: mine ? '#fff' : 'var(--ink)',
                  boxShadow: '0 1px 2px rgba(10,37,64,.08)',
                }}>
                  <div style={{ fontSize: '.95rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
                  <div data-tutorial="messages-read-receipt" style={{ fontSize: '.68rem', marginTop: '.3rem', opacity: .8, textAlign: 'right' }}>
                    {mine ? (
                      <>Sent {fmtTime(m.created_at)}{m.read_at && ` · Read ${fmtTime(m.read_at)}`}</>
                    ) : (
                      <>{m.profiles?.full_name || 'Office'} · {fmtTime(m.created_at)}</>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end', padding: '.7rem 1rem', borderTop: '1px solid var(--line)', background: '#fff' }}>
          <textarea ref={textRef} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…" rows={1}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            style={{ flex: 1, padding: '.65rem .85rem', border: '1px solid var(--line)', borderRadius: 18, resize: 'none', maxHeight: 200, fontFamily: 'inherit', fontSize: '.94rem' }} />
          <button className="btn btn-primary" style={{ width: 44, height: 44, borderRadius: '50%', padding: 0, flexShrink: 0 }} onClick={send} disabled={sending || !body.trim()}>
            ➤
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 160px)' }}>
      <h1 style={{ marginBottom: 0 }}>Messages</h1>
      <p className="muted" style={{ marginTop: 0, marginBottom: '.8rem' }}>Chat directly with the Golden Years office.</p>

      {threads.length === 0 && (
        <div className="empty"><h3>No conversations yet</h3><p>Tap the button below to message the office.</p></div>
      )}
      <div data-tutorial="messages-thread-list">
        {threads.map((t, i) => {
          const last = lastMsg[t.id]
          const unreadCount = unread[t.id] || 0
          return (
            <button key={t.id} data-tutorial={i === 0 ? 'messages-thread-item' : undefined} onClick={() => openThread(t)}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: '#fff', marginBottom: '.5rem',
                border: '1px solid var(--line)', borderRadius: 12, padding: '.8rem .9rem', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <b style={{ fontSize: '.95rem' }}>{t.subject}</b>
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
      </div>

      <button data-tutorial="messages-new-btn" onClick={() => setShowNew(true)}
        style={{
          position: 'fixed', bottom: 84, right: 20, width: 58, height: 58, borderRadius: '50%',
          background: 'var(--gold)', color: 'var(--blue-ink)', border: 'none', fontSize: '1.6rem',
          boxShadow: '0 6px 16px rgba(10,37,64,.35)', cursor: 'pointer', zIndex: 20,
        }} aria-label="Start a new conversation">
        +
      </button>

      {showNew && (
        <NewConversationModal
          caregiverId={caregiver.id}
          userId={session.user.id}
          onClose={() => setShowNew(false)}
          onCreated={(th) => { setShowNew(false); loadThreads(); openThread(th) }}
        />
      )}
    </div>
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
