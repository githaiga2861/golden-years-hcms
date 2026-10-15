import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fullName } from '../lib/format'
import { Empty, Field } from '../components/Ui'

const PT = 'America/Los_Angeles'

// Ready-made alerts. {shift} is replaced with " on Tue, Oct 20 at 7:30 AM with Steve Floyd"
// when a shift is picked, or removed when none is.
export const ALERT_PRESETS = {
  shift_changed: {
    label: 'Shift changed — refresh to apply', action: 'refresh',
    title: 'Your shift has been updated',
    body: 'Changes were made to your shift{shift}. Please tap Refresh to load the latest details before you go.',
  },
  shift_added: {
    label: 'New shift added', action: 'refresh',
    title: 'New shift on your schedule',
    body: 'A new shift has been added for you{shift}. Tap Refresh to see it on your schedule.',
  },
  shift_cancelled: {
    label: 'Shift cancelled', action: 'refresh',
    title: 'A shift was cancelled',
    body: 'Your shift{shift} has been cancelled. Tap Refresh to update your schedule.',
  },
  missing_notes: {
    label: 'Forgot to key in visit notes', action: 'open_visit', needsShift: true,
    title: 'Visit notes needed',
    body: 'Visit notes were not entered for your visit{shift}. Please open the visit and add your notes today.',
  },
  missing_clock_out: {
    label: 'Forgot to clock out', action: 'open_visit', needsShift: true,
    title: 'You are still clocked in',
    body: 'Your visit{shift} has no clock-out. Please open the visit and clock out, or call the office.',
  },
  tasks_incomplete: {
    label: 'Care tasks not checked off', action: 'open_visit', needsShift: true,
    title: 'Care tasks not completed',
    body: 'Some care tasks for your visit{shift} were not checked off. Please open the visit and update them.',
  },
  schedule_reminder: {
    label: 'Review your schedule', action: 'open_schedule',
    title: 'Please review your schedule',
    body: 'Your schedule has been updated. Open your schedule to review the coming days.',
  },
  credential_expiring: {
    label: 'Credential / document expiring', action: 'open_profile',
    title: 'A credential is expiring soon',
    body: 'One of your certifications or documents on file is expiring soon. Please send the office an updated copy.',
  },
  app_refresh: {
    label: 'General — refresh the app', action: 'refresh',
    title: 'Please refresh your app',
    body: 'The office has made changes that affect you. Tap Refresh to apply them.',
  },
  custom: { label: 'Custom alert', action: 'acknowledge', title: '', body: '' },
}

export const ACTION_LABEL = {
  refresh: 'Refresh app', open_visit: 'Open the visit', open_schedule: 'Open schedule',
  open_profile: 'Open profile', acknowledge: 'Got it',
}

const shiftWhen = (s) => new Date(s.starts_at).toLocaleString('en-US', {
  timeZone: PT, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
})
const shiftPhrase = (s) => {
  if (!s) return ''
  const client = s.clients ? fullName(s.clients) : (s.client_name || '')
  return ` on ${shiftWhen(s)}${client ? ` with ${client}` : ''}`
}
const fillShift = (text, s) => (text || '').replace('{shift}', shiftPhrase(s))
const stamp = (d) => new Date(d).toLocaleString('en-US', { timeZone: PT, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

// Insert the alerts, then ask the push function to ring each phone.
// If the function isn't reachable, fall back to the notification bell.
async function deliver(rows) {
  const { data, error } = await supabase.from('caregiver_alerts').insert(rows).select()
  if (error) throw error
  await Promise.all((data || []).map(async (a) => {
    const payload = { caregiver_id: a.caregiver_id, kind: 'alert', title: a.title, body: a.body || '', page: '/updates' }
    const { error: fnErr } = await supabase.functions.invoke('send-push-notification', { body: payload })
    if (fnErr) await supabase.from('push_notifications_log').insert({ caregiver_id: a.caregiver_id, kind: 'alert', title: a.title, body: a.body })
  }))
  return data || []
}

export default function AlertsPage() {
  const [caregivers, setCaregivers] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [type, setType] = useState('shift_changed')
  const [title, setTitle] = useState(ALERT_PRESETS.shift_changed.title)
  const [body, setBody] = useState(ALERT_PRESETS.shift_changed.body)
  const [action, setAction] = useState(ALERT_PRESETS.shift_changed.action)
  const [priority, setPriority] = useState('normal')
  const [shifts, setShifts] = useState([])
  const [shiftId, setShiftId] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [history, setHistory] = useState([])
  const [suggestions, setSuggestions] = useState(null)

  useEffect(() => {
    supabase.from('caregivers').select('id,first_name,last_name').eq('is_active', true).order('last_name')
      .then(({ data }) => setCaregivers(data || []))
  }, [])

  const loadHistory = () =>
    supabase.from('caregiver_alerts').select('*, caregivers(first_name,last_name)')
      .order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setHistory(data || []))

  useEffect(() => {
    loadHistory()
    const t = setInterval(loadHistory, 20000)
    return () => clearInterval(t)
  }, [])

  // ---- Suggestions: visits that look like they need a nudge ----------
  const loadSuggestions = async () => {
    const since = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: ledger } = await supabase.from('v_visit_ledger')
      .select('visit_id,shift_id,caregiver_id,caregiver_name,client_name,scheduled_start,scheduled_end,clock_in_at,clock_out_at')
      .gte('clock_in_at', since).order('clock_in_at', { ascending: false }).limit(300)
    const rows = ledger || []
    const done = rows.filter((r) => r.clock_out_at)
    const withNotes = new Set()
    for (let i = 0; i < done.length; i += 80) {
      const ids = done.slice(i, i + 80).map((r) => r.visit_id)
      const { data: n } = await supabase.from('visit_notes').select('visit_id').in('visit_id', ids)
      ;(n || []).forEach((x) => withNotes.add(x.visit_id))
    }
    const { data: recent } = await supabase.from('caregiver_alerts').select('shift_id,alert_type')
      .gte('created_at', since).not('shift_id', 'is', null)
    const alerted = new Set((recent || []).map((a) => `${a.alert_type}:${a.shift_id}`))
    const hourAgo = Date.now() - 3600000
    const list = []
    rows.forEach((r) => {
      const s = { starts_at: r.scheduled_start || r.clock_in_at, client_name: r.client_name }
      if (!r.clock_out_at && r.scheduled_end && new Date(r.scheduled_end).getTime() < hourAgo) {
        list.push({ key: `co-${r.visit_id}`, type: 'missing_clock_out', r, s, sent: alerted.has(`missing_clock_out:${r.shift_id}`) })
      }
      if (r.clock_out_at && !withNotes.has(r.visit_id)) {
        list.push({ key: `nt-${r.visit_id}`, type: 'missing_notes', r, s, sent: alerted.has(`missing_notes:${r.shift_id}`) })
      }
    })
    setSuggestions(list)
  }
  useEffect(() => { loadSuggestions() }, [])

  // ---- Shifts for the single selected caregiver ------------------------
  const oneCaregiver = selected.length === 1 ? selected[0] : null
  useEffect(() => {
    setShiftId('')
    if (!oneCaregiver) { setShifts([]); return }
    const from = new Date(Date.now() - 7 * 86400000).toISOString()
    const to = new Date(Date.now() + 21 * 86400000).toISOString()
    supabase.from('shifts').select('id,starts_at,ends_at,status,clients(first_name,last_name)')
      .eq('caregiver_id', oneCaregiver).gte('starts_at', from).lte('starts_at', to).order('starts_at')
      .then(({ data }) => setShifts(data || []))
  }, [oneCaregiver])

  const shift = shifts.find((s) => s.id === shiftId) || null
  const preset = ALERT_PRESETS[type]

  const pickType = (t) => {
    setType(t)
    const p = ALERT_PRESETS[t]
    setTitle(p.title); setBody(p.body); setAction(p.action)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? caregivers.filter((c) => fullName(c).toLowerCase().includes(q)) : caregivers
  }, [caregivers, search])
  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])

  const preview = { title: fillShift(title, shift), body: fillShift(body, shift) }

  const send = async () => {
    setMsg(null)
    if (selected.length === 0) return setMsg({ kind: 'bad', text: 'Choose at least one caregiver.' })
    if (!preview.title.trim()) return setMsg({ kind: 'bad', text: 'Enter a title for the alert.' })
    if (action === 'open_visit' && !shift) return setMsg({ kind: 'bad', text: '"Open the visit" needs a shift — choose one caregiver and pick the shift.' })
    setBusy(true)
    try {
      const rows = selected.map((cid) => ({
        caregiver_id: cid, alert_type: type, title: preview.title.trim(), body: preview.body.trim() || null,
        action, priority, shift_id: shift?.id || null,
      }))
      const sent = await deliver(rows)
      setMsg({ kind: 'ok', text: `Alert sent to ${sent.length} caregiver${sent.length === 1 ? '' : 's'}. It stays on their screen until they act on it.` })
      setSelected([])
      loadHistory(); loadSuggestions()
    } catch (e) {
      setMsg({ kind: 'bad', text: /caregiver_alerts/.test(e.message) ? 'The alerts table is missing — run supabase/27_caregiver_alerts.sql in the Supabase SQL Editor first.' : e.message })
    } finally { setBusy(false) }
  }

  const sendSuggestion = async (sg) => {
    const p = ALERT_PRESETS[sg.type]
    try {
      await deliver([{
        caregiver_id: sg.r.caregiver_id, alert_type: sg.type, action: p.action, priority: 'normal',
        shift_id: sg.r.shift_id, title: p.title, body: fillShift(p.body, sg.s),
      }])
      setSuggestions((list) => list.map((x) => x.key === sg.key ? { ...x, sent: true } : x))
      loadHistory()
    } catch (e) { setMsg({ kind: 'bad', text: e.message }) }
  }

  const withdraw = async (a) => {
    if (!confirm(`Withdraw this alert? It will disappear from ${fullName(a.caregivers)}'s app.`)) return
    await supabase.from('caregiver_alerts').delete().eq('id', a.id)
    loadHistory()
  }

  const statusOf = (a) => a.acknowledged_at ? ['ok', `Done ${stamp(a.acknowledged_at)}`]
    : a.seen_at ? ['info', `Seen ${stamp(a.seen_at)}`] : ['warn', 'Not seen yet']

  const openSuggestions = (suggestions || []).filter((s) => !s.sent)

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '1rem', alignItems: 'start' }}>
        <div className="card card-pad">
          <h3 className="thread" style={{ marginTop: 0 }}>Send an alert</h3>
          <p className="muted" style={{ fontSize: '.86rem', marginTop: '-.2rem' }}>
            Alerts pop up on the caregiver's phone as a notification and stay pinned at the top of their Care App —
            just like "update available" — until they tap the button.
          </p>
          {msg && <p className={`notice ${msg.kind === 'ok' ? 'notice-ok' : 'notice-bad'}`}>{msg.text}</p>}

          <Field label="What is the alert about?">
            <select value={type} onChange={(e) => pickType(e.target.value)}>
              {Object.entries(ALERT_PRESETS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
          </Field>

          <div className="field">
            <label>Caregivers ({selected.length} selected)</label>
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.4rem' }}>
              <input placeholder="Search caregivers…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-outline" onClick={() => setSelected(filtered.map((c) => c.id))}>All</button>
              <button className="btn btn-quiet" onClick={() => setSelected([])}>Clear</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '.35rem', maxHeight: 190, overflowY: 'auto' }}>
              {filtered.map((c) => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '.45rem', border: '1px solid var(--line)', borderRadius: 8, padding: '.4rem .6rem', cursor: 'pointer', fontSize: '.88rem', background: selected.includes(c.id) ? 'var(--blue-soft)' : '#fff' }}>
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                  {fullName(c)}
                </label>
              ))}
            </div>
          </div>

          <Field label="Which shift? (optional)" help={oneCaregiver ? 'Adds the date, time and client to the message, and lets "Open the visit" jump straight to it.' : 'Choose a single caregiver to link a shift.'}>
            <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} disabled={!oneCaregiver}>
              <option value="">{oneCaregiver ? (shifts.length ? 'No specific shift' : 'No shifts in the last 7 / next 21 days') : '—'}</option>
              {shifts.map((s) => <option key={s.id} value={s.id}>{shiftWhen(s)} · {fullName(s.clients)} · {s.status}</option>)}
            </select>
          </Field>

          <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short headline the caregiver sees first" /></Field>
          <Field label="Message" help={body.includes('{shift}') ? '{shift} is filled in with the shift you pick above.' : undefined}>
            <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <div className="form-row">
            <Field label="Button on their phone">
              <select value={action} onChange={(e) => setAction(e.target.value)}>
                {Object.entries(ACTION_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent (red banner)</option>
              </select>
            </Field>
          </div>

          <div className="mb">
            <div className="muted" style={{ fontSize: '.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: '.35rem' }}>Preview on the caregiver's phone</div>
            <AlertPreview title={preview.title} body={preview.body} action={action} priority={priority} />
            {preset.needsShift && !shift && <p className="muted" style={{ fontSize: '.8rem', margin: '.4rem 0 0' }}>Tip: pick the shift so the message names the visit.</p>}
          </div>

          <button className="btn btn-primary" onClick={send} disabled={busy}>
            {busy ? 'Sending…' : `Send alert${selected.length ? ` to ${selected.length}` : ''}`}
          </button>
        </div>

        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 className="thread" style={{ marginTop: 0 }}>Suggested alerts</h3>
            <button className="btn btn-quiet" style={{ fontSize: '.8rem' }} onClick={loadSuggestions}>Recheck</button>
          </div>
          <p className="muted" style={{ fontSize: '.84rem', marginTop: '-.2rem' }}>Visits from the last 7 days with no visit notes, or still not clocked out an hour after the shift ended.</p>
          {suggestions === null ? <p className="muted">Checking visits…</p>
            : openSuggestions.length === 0 ? <Empty icon="✓" title="Nothing to chase" hint="All recent visits have notes and clock-outs." />
            : (
              <div style={{ display: 'grid', gap: '.5rem', maxHeight: 520, overflowY: 'auto' }}>
                {openSuggestions.map((sg) => (
                  <div key={sg.key} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '.6rem .7rem', display: 'flex', gap: '.6rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className={`pill ${sg.type === 'missing_clock_out' ? 'pill-bad' : 'pill-warn'}`}>{sg.type === 'missing_clock_out' ? 'No clock-out' : 'No visit notes'}</span>
                      <div style={{ fontWeight: 600, fontSize: '.9rem', marginTop: '.25rem' }}>{sg.r.caregiver_name}</div>
                      <div className="muted" style={{ fontSize: '.8rem' }}>{sg.r.client_name} · {shiftWhen(sg.s)}</div>
                    </div>
                    <button className="btn btn-gold" style={{ flexShrink: 0, padding: '.35rem .7rem', fontSize: '.82rem' }} onClick={() => sendSuggestion(sg)}>Send alert</button>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: '1rem' }}>
        <h3 className="thread" style={{ marginTop: 0 }}>Sent alerts</h3>
        {history.length === 0 ? <Empty title="No alerts sent yet" hint="Alerts you send appear here with whether the caregiver has seen and acted on them." /> : (
          <div style={{ overflowX: "auto" }}>
            <table className="data">
              <thead><tr><th>Sent</th><th>Caregiver</th><th>Alert</th><th>Button</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {history.map((a) => {
                  const [kind, label] = statusOf(a)
                  return (
                    <tr key={a.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{stamp(a.created_at)}</td>
                      <td>{a.caregivers ? fullName(a.caregivers) : '—'}</td>
                      <td>
                        <b style={{ fontSize: '.88rem' }}>{a.priority === 'urgent' && <span className="pill pill-bad" style={{ marginRight: '.35rem' }}>Urgent</span>}{a.title}</b>
                        {a.body && <div className="muted" style={{ fontSize: '.8rem', maxWidth: 420 }}>{a.body}</div>}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '.84rem' }}>{ACTION_LABEL[a.action] || a.action}</td>
                      <td><span className={`pill pill-${kind}`}>{label}</span></td>
                      <td>{!a.acknowledged_at && <button className="btn btn-quiet" style={{ fontSize: '.8rem', color: 'var(--bad)' }} onClick={() => withdraw(a)}>Withdraw</button>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// Mirrors the banner the caregiver sees in the Care App.
function AlertPreview({ title, body, action, priority }) {
  const urgent = priority === 'urgent'
  return (
    <div style={{ maxWidth: 380, background: urgent ? '#fdf1ee' : '#fffaf0', border: `1.5px solid ${urgent ? 'var(--bad)' : 'var(--gold)'}`, borderRadius: 12, padding: '.75rem .85rem' }}>
      <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', marginBottom: '.25rem' }}>
        <span className={`pill ${urgent ? 'pill-bad' : 'pill-gold'}`}>{urgent ? 'Urgent alert' : 'Alert from the office'}</span>
      </div>
      <div style={{ fontWeight: 700 }}>{title || 'Alert title'}</div>
      {body && <div className="muted" style={{ fontSize: '.86rem', marginTop: '.15rem' }}>{body}</div>}
      <div style={{ display: 'flex', gap: '.4rem', marginTop: '.6rem' }}>
        <span className="btn btn-primary" style={{ padding: '.35rem .8rem', fontSize: '.84rem', pointerEvents: 'none' }}>{ACTION_LABEL[action]}</span>
        {action !== 'acknowledge' && <span className="btn btn-quiet" style={{ padding: '.35rem .6rem', fontSize: '.84rem', pointerEvents: 'none' }}>Later</span>}
      </div>
    </div>
  )
}

