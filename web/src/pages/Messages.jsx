import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fullName } from '../lib/format'
import { Empty, Modal, Field } from '../components/Ui'

const fmtWhen = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const fmtShort = (d) => {
  const diffH = (Date.now() - new Date(d)) / 3600000
  if (diffH < 24) return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diffH < 24 * 7) return new Date(d).toLocaleDateString('en-US', { weekday: 'short' })
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Messages() {
  const [threads, setThreads] = useState([])
  const [lastMsg, setLastMsg] = useState({})
  const [unread, setUnread] = useState({})
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const bottomRef = useRef(null)

  const loadThreads = async () => {
    const { data: t } = await supabase.from('message_threads').select('*, caregivers(first_name,last_name)')
      .order('created_at', { ascending: false })
    setThreads(t || [])

    const { data: lastRows } = await supabase.from('v_thread_last_message').select('*')
    const lastMap = {}
    for (const r of lastRows || []) lastMap[r.thread_id] = r
    setLastMsg(lastMap)

    if (userId) {
      const { data: unreadRows } = await supabase.from('messages').select('thread_id')
        .is('read_at', null).neq('sender_id', userId)
      const counts = {}
      for (const r of unreadRows || []) counts[r.thread_id] = (counts[r.thread_id] || 0) + 1
      setUnread(counts)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id))
  }, [])
  useEffect(() => {
    loadThreads()
    const t = setInterval(loadThreads, 20000)
    return () => clearInterval(t)
  }, [userId]) // eslint-disable-line

  const openThread = async (th) => {
    setSelected(th)
    const { data: m } = await supabase.from('messages').select('*, profiles(full_name)')
      .eq('thread_id', th.id).order('created_at')
    setMessages(m || [])
    const toMark = (m || []).filter((x) => x.sender_id !== userId && !x.read_at)
    if (toMark.length) {
      await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', toMark.map((x) => x.id))
      setUnread((u) => ({ ...u, [th.id]: 0 }))
    }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const send = async () => {
    const text = body.trim()
    if (!text || !selected || !userId) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      thread_id: selected.id, sender_id: userId, body: text,
    })
    setSending(false)
    if (!error) { setBody(''); openThread(selected); loadThreads() }
  }

  return (
    <>
      <div className="page-head">
        <div><h1 className="thread">Messages</h1><div className="sub">Two-way chat with each caregiver.</div></div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New conversation</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '300px 1fr', gap: '1rem', alignItems: 'start' }}>
        <div className="card" style={{ maxHeight: '70vh', overflowY: 'auto', padding: 0 }}>
          {threads.length === 0 ? <div style={{ padding: '1rem' }}><Empty title="No conversations yet" hint="Start one with the button above." /></div> : threads.map((t) => {
            const last = lastMsg[t.id]
            const unreadCount = unread[t.id] || 0
            return (
              <button key={t.id} onClick={() => openThread(t)}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: selected?.id === t.id ? 'var(--blue-soft)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--line)', padding: '.75rem 1rem', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <b style={{ fontSize: '.92rem' }}>{t.caregivers ? fullName(t.caregivers) : 'Caregiver'}</b>
                  {last && <span className="muted" style={{ fontSize: '.72rem', flexShrink: 0, marginLeft: '.4rem' }}>{fmtShort(last.last_at)}</span>}
                </div>
                <div className="muted" style={{ fontSize: '.78rem', fontWeight: 600 }}>{t.subject}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.15rem' }}>
                  <span className="muted" style={{ fontSize: '.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {last?.last_body || 'No messages yet'}
                  </span>
                  {unreadCount > 0 && <span className="badge" style={{ flexShrink: 0, marginLeft: '.4rem' }}>{unreadCount}</span>}
                </div>
              </button>
            )
          })}
        </div>

        <div className="card card-pad" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <Empty title="Select a conversation" hint="Choose one on the left, or start a new one." />
          ) : (
            <>
              <h3 style={{ marginBottom: '.2rem' }}>{fullName(selected.caregivers)}</h3>
              <p className="muted" style={{ margin: '0 0 .8rem', fontSize: '.86rem' }}>{selected.subject}</p>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '.8rem' }}>
                {messages.map((m) => {
                  const mine = m.sender_id === userId
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: '.6rem' }}>
                      <div style={{
                        maxWidth: '70%', padding: '.6rem .8rem', borderRadius: 12,
                        background: mine ? 'var(--blue)' : 'var(--paper)', color: mine ? '#fff' : 'var(--ink)',
                        border: mine ? 'none' : '1px solid var(--line)',
                      }}>
                        <div style={{ fontSize: '.92rem' }}>{m.body}</div>
                        <div style={{ fontSize: '.7rem', marginTop: '.25rem', opacity: .75 }}>
                          {mine ? 'You' : (m.profiles?.full_name || fullName(selected.caregivers))} · {fmtWhen(m.created_at)}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Reply…"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), send())}
                  style={{ flex: 1, padding: '.6rem .8rem', border: '1px solid var(--line)', borderRadius: 8 }} />
                <button className="btn btn-primary" onClick={send} disabled={sending || !body.trim()}>Send</button>
              </div>
            </>
          )}
        </div>
      </div>

      {showNew && (
        <NewConversationModal
          onClose={() => setShowNew(false)}
          onCreated={(th) => { setShowNew(false); loadThreads(); openThread(th) }}
        />
      )}
    </>
  )
}

function NewConversationModal({ onClose, onCreated }) {
  const [caregivers, setCaregivers] = useState([])
  const [caregiverId, setCaregiverId] = useState('')
  const [subject, setSubject] = useState('')
  const [firstMessage, setFirstMessage] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('caregivers').select('id,first_name,last_name').eq('is_active', true).order('last_name')
      .then(({ data }) => setCaregivers(data || []))
  }, [])

  const create = async () => {
    setErr('')
    if (!caregiverId) return setErr('Choose a caregiver.')
    if (!subject.trim()) return setErr('Enter a subject for this conversation.')
    setBusy(true)
    const { data: th, error } = await supabase.from('message_threads')
      .insert({ caregiver_id: caregiverId, subject: subject.trim() }).select().single()
    if (error) { setErr(error.message); setBusy(false); return }

    if (firstMessage.trim()) {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('messages').insert({ thread_id: th.id, sender_id: user.id, body: firstMessage.trim() })
    }
    setBusy(false)
    onCreated(th)
  }

  return (
    <Modal title="New conversation" onClose={onClose} footer={
      <>
        <button className="btn btn-quiet" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={create} disabled={busy}>{busy ? 'Starting…' : 'Start conversation'}</button>
      </>
    }>
      {err && <p className="notice notice-bad">{err}</p>}
      <Field label="Caregiver">
        <select value={caregiverId} onChange={(e) => setCaregiverId(e.target.value)}>
          <option value="">Select a caregiver…</option>
          {caregivers.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
        </select>
      </Field>
      <Field label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Schedule change this week" /></Field>
      <Field label="First message (optional)">
        <textarea rows={3} value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} placeholder="Type your message…" />
      </Field>
    </Modal>
  )
}
