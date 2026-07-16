import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fullName } from '../lib/format'
import { Empty } from '../components/Ui'

const fmtWhen = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function Messages() {
  const [threads, setThreads] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [userId, setUserId] = useState(null)
  const bottomRef = useRef(null)

  const loadThreads = () =>
    supabase.from('message_threads').select('*, caregivers(first_name,last_name)')
      .order('created_at', { ascending: false }).then(({ data }) => setThreads(data || []))

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id))
    loadThreads()
    const t = setInterval(loadThreads, 20000)
    return () => clearInterval(t)
  }, [])

  const openThread = async (th) => {
    setSelected(th)
    const { data: m } = await supabase.from('messages').select('*, profiles(full_name)')
      .eq('thread_id', th.id).order('created_at')
    setMessages(m || [])
    const unread = (m || []).filter((x) => x.sender_id !== userId && !x.read_at)
    if (unread.length) {
      await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unread.map((x) => x.id))
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
    if (!error) { setBody(''); openThread(selected) }
  }

  return (
    <>
      <div className="page-head">
        <div><h1 className="thread">Messages</h1><div className="sub">Two-way chat with each caregiver.</div></div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '280px 1fr', gap: '1rem', alignItems: 'start' }}>
        <div className="card" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {threads.length === 0 ? <Empty title="No conversations yet" /> : threads.map((t) => (
            <button key={t.id} onClick={() => openThread(t)}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: selected?.id === t.id ? 'var(--blue-soft)' : 'transparent',
                border: 'none', borderBottom: '1px solid var(--line)', padding: '.8rem 1rem', cursor: 'pointer' }}>
              <b>{t.caregivers ? fullName(t.caregivers) : 'Caregiver'}</b>
              <div className="muted" style={{ fontSize: '.8rem' }}>{t.subject}</div>
            </button>
          ))}
        </div>

        <div className="card card-pad" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <Empty title="Select a conversation" hint="Choose a caregiver on the left to view and reply." />
          ) : (
            <>
              <h3 style={{ marginBottom: '.8rem' }}>{fullName(selected.caregivers)}</h3>
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
    </>
  )
}
