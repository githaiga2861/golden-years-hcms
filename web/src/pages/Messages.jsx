import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fullName } from '../lib/format'
import { Empty, Modal, Field } from '../components/Ui'

const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const fmtShort = (d) => {
  const diffH = (Date.now() - new Date(d)) / 3600000
  if (diffH < 24) return fmtTime(d)
  if (diffH < 24 * 7) return new Date(d).toLocaleDateString('en-US', { weekday: 'short' })
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const PAGES = ['conversations', 'group', 'templates']
const PAGE_LABELS = { conversations: 'Conversations', group: 'Message a Group', templates: 'Templates' }

export default function Messages() {
  const [page, setPage] = useState('conversations')

  return (
    <>
      <div className="page-head">
        <div><h1 className="thread">Messages</h1><div className="sub">Chat with caregivers, message groups, and save reusable templates.</div></div>
      </div>
      <div className="toolbar mb">
        {PAGES.map((p) => (
          <button key={p} className={`btn ${page === p ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPage(p)}>
            {PAGE_LABELS[p]}
          </button>
        ))}
      </div>
      {page === 'conversations' && <ConversationsPage />}
      {page === 'group' && <MessageGroupPage />}
      {page === 'templates' && <TemplatesPage />}
    </>
  )
}

// ============================================================
// Conversations
// ============================================================
function ConversationsPage() {
  const [threads, setThreads] = useState([])
  const [lastMsg, setLastMsg] = useState({})
  const [unread, setUnread] = useState({})
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState([])
  const bottomRef = useRef(null)
  const textRef = useRef(null)

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
    supabase.from('message_templates').select('*').order('title').then(({ data }) => setTemplates(data || []))
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

  const autoGrow = (el) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 240) + 'px'
  }
  useEffect(() => { autoGrow(textRef.current) }, [body])

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

  const useTemplate = (tpl) => {
    setBody(tpl.body)
    setShowTemplates(false)
    setTimeout(() => textRef.current?.focus(), 50)
  }

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: '300px 1fr', gap: '1rem', alignItems: 'start' }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '.7rem 1rem', borderBottom: '1px solid var(--line)' }}>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowNew(true)}>+ New conversation</button>
          </div>
          <div style={{ maxHeight: '64vh', overflowY: 'auto' }}>
            {threads.length === 0 ? <div style={{ padding: '1rem' }}><Empty title="No conversations yet" hint="Start one above." /></div> : threads.map((t) => {
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
        </div>

        <div className="card" style={{ minHeight: '68vh', display: 'flex', flexDirection: 'column', padding: 0, background: 'var(--paper)' }}>
          {!selected ? (
            <div style={{ padding: '1.2rem' }}><Empty title="Select a conversation" hint="Choose one on the left, or start a new one." /></div>
          ) : (
            <>
              <div style={{ padding: '.9rem 1.1rem', borderBottom: '1px solid var(--line)', background: '#fff' }}>
                <h3 style={{ margin: 0 }}>{fullName(selected.caregivers)}</h3>
                <p className="muted" style={{ margin: 0, fontSize: '.84rem' }}>{selected.subject}</p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {messages.map((m) => {
                  const mine = m.sender_id === userId
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: '.7rem' }}>
                      <div style={{
                        maxWidth: '68%', padding: '.6rem .85rem', borderRadius: mine ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                        background: mine ? 'var(--blue)' : '#fff', color: mine ? '#fff' : 'var(--ink)',
                        boxShadow: '0 1px 2px rgba(10,37,64,.08)',
                      }}>
                        <div style={{ fontSize: '.92rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
                        <div style={{ fontSize: '.68rem', marginTop: '.3rem', opacity: .8, textAlign: 'right' }}>
                          {mine ? (
                            <>Sent {fmtTime(m.created_at)}{m.read_at && ` · Read ${fmtTime(m.read_at)}`}</>
                          ) : (
                            <>{m.profiles?.full_name || fullName(selected.caregivers)} · {fmtTime(m.created_at)}</>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: '.8rem 1rem', borderTop: '1px solid var(--line)', background: '#fff', position: 'relative' }}>
                {showTemplates && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: '1rem', right: '1rem', marginBottom: '.5rem',
                    background: '#fff', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 -8px 24px rgba(10,37,64,.15)',
                    maxHeight: 320, overflowY: 'auto', padding: '.7rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                      <b style={{ fontSize: '.88rem' }}>Choose a template</b>
                      <button className="btn btn-quiet" style={{ padding: '.1rem .5rem' }} onClick={() => setShowTemplates(false)}>✕</button>
                    </div>
                    {templates.length === 0 && <p className="muted" style={{ fontSize: '.86rem' }}>No templates saved yet. Add one from the Templates tab.</p>}
                    <div style={{ display: 'grid', gap: '.5rem' }}>
                      {templates.map((tpl) => (
                        <button key={tpl.id} onClick={() => useTemplate(tpl)}
                          style={{ textAlign: 'left', border: '1px solid var(--line)', borderRadius: 8, padding: '.6rem .7rem', background: 'var(--paper)', cursor: 'pointer' }}>
                          <b style={{ fontSize: '.86rem' }}>{tpl.title}</b>
                          <div className="muted" style={{ fontSize: '.8rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {tpl.body}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end' }}>
                  <button className="btn btn-outline" style={{ flexShrink: 0, padding: '.6rem .7rem' }} onClick={() => setShowTemplates((s) => !s)} title="Use a saved template">
                    📋
                  </button>
                  <textarea ref={textRef} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Reply…" rows={1}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                    style={{ flex: 1, padding: '.6rem .8rem', border: '1px solid var(--line)', borderRadius: 10, resize: 'none', maxHeight: 240, fontFamily: 'inherit', fontSize: '.92rem' }} />
                  <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={send} disabled={sending || !body.trim()}>Send</button>
                </div>
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

// ============================================================
// Message a Group
// ============================================================
function MessageGroupPage() {
  const [caregivers, setCaregivers] = useState([])
  const [selected, setSelected] = useState([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [templates, setTemplates] = useState([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    supabase.from('caregivers').select('id,first_name,last_name').eq('is_active', true).order('last_name')
      .then(({ data }) => setCaregivers(data || []))
    supabase.from('message_templates').select('*').order('title').then(({ data }) => setTemplates(data || []))
  }, [])

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  const selectAll = () => setSelected(caregivers.map((c) => c.id))
  const clearAll = () => setSelected([])

  const send = async () => {
    setMsg(null)
    if (selected.length === 0) return setMsg({ kind: 'bad', text: 'Select at least one caregiver.' })
    if (!subject.trim()) return setMsg({ kind: 'bad', text: 'Enter a subject.' })
    if (!body.trim()) return setMsg({ kind: 'bad', text: 'Enter a message.' })
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    let sent = 0
    for (const cid of selected) {
      const { data: th, error } = await supabase.from('message_threads')
        .insert({ caregiver_id: cid, subject: subject.trim() }).select().single()
      if (!error && th) {
        await supabase.from('messages').insert({ thread_id: th.id, sender_id: user.id, body: body.trim() })
        sent++
      }
    }
    setBusy(false)
    setMsg({ kind: 'ok', text: `Sent to ${sent} caregiver${sent === 1 ? '' : 's'} as individual conversations.` })
    setSelected([]); setSubject(''); setBody('')
  }

  return (
    <div className="card card-pad">
      <p className="muted" style={{ fontSize: '.88rem' }}>
        This sends the same message as a new, separate conversation to each caregiver you select — each can reply privately.
      </p>
      {msg && <p className={`notice ${msg.kind === 'ok' ? 'notice-ok' : 'notice-bad'}`}>{msg.text}</p>}

      <h3 className="thread mt">Recipients</h3>
      <div className="toolbar mb">
        <button className="btn btn-outline" onClick={selectAll}>Select all</button>
        <button className="btn btn-outline" onClick={clearAll}>Clear</button>
        <span className="muted" style={{ alignSelf: 'center' }}>{selected.length} selected</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.4rem', maxHeight: 260, overflowY: 'auto', marginBottom: '1rem' }}>
        {caregivers.map((c) => (
          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', border: '1px solid var(--line)', borderRadius: 8, padding: '.5rem .7rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
            <span style={{ fontSize: '.9rem' }}>{fullName(c)}</span>
          </label>
        ))}
      </div>

      <h3 className="thread mt">Message</h3>
      <Field label="Subject"><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Holiday schedule reminder" /></Field>
      <div style={{ position: 'relative' }}>
        <Field label="Message"><textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your message…" /></Field>
        <button className="btn btn-outline" style={{ marginBottom: '.8rem' }} onClick={() => setShowTemplates((s) => !s)}>📋 Use a saved template</button>
        {showTemplates && (
          <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '.7rem', marginBottom: '.8rem', display: 'grid', gap: '.5rem' }}>
            {templates.length === 0 && <p className="muted" style={{ fontSize: '.86rem' }}>No templates saved yet.</p>}
            {templates.map((tpl) => (
              <button key={tpl.id} onClick={() => { setBody(tpl.body); setShowTemplates(false) }}
                style={{ textAlign: 'left', border: '1px solid var(--line)', borderRadius: 8, padding: '.6rem .7rem', background: 'var(--paper)', cursor: 'pointer' }}>
                <b style={{ fontSize: '.86rem' }}>{tpl.title}</b>
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="btn btn-primary" onClick={send} disabled={busy}>{busy ? 'Sending…' : `Send to ${selected.length || ''} caregiver${selected.length === 1 ? '' : 's'}`}</button>
    </div>
  )
}

// ============================================================
// Templates
// ============================================================
function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [editing, setEditing] = useState(null) // null = not editing, {} = new, {...} = existing
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = () => supabase.from('message_templates').select('*').order('title').then(({ data }) => setTemplates(data || []))
  useEffect(() => { load() }, [])

  const startNew = () => { setEditing({}); setTitle(''); setBody('') }
  const startEdit = (tpl) => { setEditing(tpl); setTitle(tpl.title); setBody(tpl.body) }

  const save = async () => {
    setErr('')
    if (!title.trim() || !body.trim()) return setErr('Enter both a title and message body.')
    setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (editing.id) {
      await supabase.from('message_templates').update({ title: title.trim(), body: body.trim() }).eq('id', editing.id)
    } else {
      await supabase.from('message_templates').insert({ title: title.trim(), body: body.trim(), created_by: user.id })
    }
    setBusy(false)
    setEditing(null)
    load()
  }

  const remove = async (tpl) => {
    if (!confirm(`Delete template "${tpl.title}"?`)) return
    await supabase.from('message_templates').delete().eq('id', tpl.id)
    load()
  }

  return (
    <div className="card card-pad">
      <div className="page-head" style={{ marginBottom: '1rem' }}>
        <p className="muted" style={{ margin: 0 }}>Save frequently-sent messages here to reuse them from the template picker in Conversations or Message a Group.</p>
        <button className="btn btn-primary" onClick={startNew}>+ New template</button>
      </div>

      {editing && (
        <div className="card" style={{ background: 'var(--paper)', marginBottom: '1rem' }}>
          {err && <p className="notice notice-bad">{err}</p>}
          <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Shift reminder" /></Field>
          <Field label="Message"><textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type the reusable message…" /></Field>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-quiet" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save template'}</button>
          </div>
        </div>
      )}

      {templates.length === 0 && !editing && <Empty title="No templates yet" hint="Create one to reuse in future messages." />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '.8rem' }}>
        {templates.map((tpl) => (
          <div key={tpl.id} className="card" style={{ margin: 0 }}>
            <b>{tpl.title}</b>
            <p className="muted" style={{ fontSize: '.86rem', whiteSpace: 'pre-wrap' }}>{tpl.body}</p>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button className="btn btn-outline" onClick={() => startEdit(tpl)}>Edit</button>
              <button className="btn btn-outline" style={{ borderColor: 'var(--bad)', color: 'var(--bad)' }} onClick={() => remove(tpl)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
