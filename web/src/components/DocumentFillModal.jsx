import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fullName } from '../lib/format'
import { Modal } from './Ui'
import { MODULES } from '../documents/modules'
import { fieldsOf } from '../documents/formkit'
import { openPrintable } from '../documents/print'

const DAYS = new Set(['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'])
const strip = (h) => String(h ?? '').replace(/<br\s*\/?>/g, ' — ').replace(/<[^>]+>/g, '').replace(/\{\{[^}]+\}\}/g, '…').replace(/&amp;/g, '&').trim()

// Client record → shared form keys.
function fromClient(c) {
  const addr = [c.address, [c.city, c.state || 'WA'].filter(Boolean).join(', '), c.zip].filter(Boolean).join(' ')
  const ec = [c.emergency_contact_name, c.emergency_contact_phone].filter(Boolean).join(' · ')
  const out = {
    patient_name: `${c.last_name || ''}, ${c.first_name || ''}`.replace(/^, |, $/g, ''),
    dob: c.date_of_birth || '', address: addr, city: c.city || '', state: c.state || 'WA', zip: c.zip || '',
    phone: c.phone || '', emergency_name: c.emergency_contact_name || '', emergency_phone: c.emergency_contact_phone || '',
    emergency_contact: ec, language: c.preferred_language || '',
  }
  if (c.gender) out.sex = /^f/i.test(c.gender) ? 'Female' : /^m/i.test(c.gender) ? 'Male' : ''
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v))
}

export default function DocumentFillModal({ doc, record, onClose, onSaved }) {
  const mod = MODULES[doc.key]
  const sections = useMemo(() => fieldsOf(mod.schema), [mod])
  const [data, setData] = useState(() => ({ ...(mod.defaults || {}), ...(record?.data || {}) }))
  const [clientId, setClientId] = useState(record?.client_id || '')
  const [clients, setClients] = useState([])
  const [active, setActive] = useState(0)
  const [recId, setRecId] = useState(record?.id || null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const bodyRef = useRef(null)

  useEffect(() => {
    supabase.from('clients').select('id,first_name,last_name,address,city,state,zip,phone,date_of_birth,gender,preferred_language,emergency_contact_name,emergency_contact_phone')
      .order('last_name').then(({ data: rows }) => setClients(rows || []))
  }, [])
  useEffect(() => { bodyRef.current?.scrollTo?.(0, 0) }, [active])

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }))
  const toggle = (k, opt) => setData((d) => {
    const cur = Array.isArray(d[k]) ? d[k] : []
    return { ...d, [k]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] }
  })

  const pickClient = (id) => {
    setClientId(id)
    const c = clients.find((x) => x.id === id)
    if (!c) return
    const vals = fromClient(c)
    setData((d) => {
      const next = { ...d }
      Object.entries(vals).forEach(([k, v]) => { if (!next[k]) next[k] = v })
      return next
    })
  }

  const filledCount = (s) => s.fields.filter((f) => !f.heading && hasValue(data, f)).length
  const fieldCount = (s) => s.fields.filter((f) => !f.heading).length

  const save = async (status = 'draft') => {
    setSaving(true); setMsg(null)
    const row = { doc_key: doc.key, client_id: clientId || null, title: data.patient_name || doc.title, data, status }
    const q = recId
      ? supabase.from('document_records').update(row).eq('id', recId).select('id').single()
      : supabase.from('document_records').insert(row).select('id').single()
    const { data: saved, error } = await q
    setSaving(false)
    if (error) {
      setMsg({ kind: 'bad', text: /document_records/.test(error.message) ? 'Saving needs the one-time database update (supabase/28_document_records.sql). You can still print.' : error.message })
      return false
    }
    setRecId(saved.id)
    setMsg({ kind: 'ok', text: status === 'completed' ? 'Saved as completed.' : 'Draft saved.' })
    onSaved?.()
    return true
  }

  const print = () => openPrintable({
    title: `${doc.title}${data.patient_name ? ` — ${data.patient_name}` : ''}`, short: doc.short,
    body: (logo) => mod.render(data, { logo }),
  })

  const sec = sections[active]

  return (
    <Modal xwide onClose={onClose} title={doc.title}
      header={
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0 }}>{doc.title}</h2>
          <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', marginTop: '.5rem', flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: '.84rem' }}>Client:</span>
            <select value={clientId} onChange={(e) => pickClient(e.target.value)} style={{ padding: '.35rem .5rem', border: '1px solid var(--line)', borderRadius: 8, maxWidth: 260 }}>
              <option value="">— not linked —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
            </select>
            <span className="muted" style={{ fontSize: '.78rem' }}>Picking a client fills in their name, DOB, address and contacts.</span>
          </div>
        </div>
      }
      footer={
        <>
          {msg && <span className={msg.kind === 'ok' ? 'pill pill-ok' : 'pill pill-bad'} style={{ marginRight: 'auto', whiteSpace: 'normal' }}>{msg.text}</span>}
          <button className="btn btn-quiet" onClick={onClose}>Close</button>
          <button className="btn btn-outline" onClick={() => save('draft')} disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</button>
          <button className="btn btn-outline" onClick={() => save('completed')} disabled={saving}>Mark completed</button>
          <button className="btn btn-primary" onClick={print}>Print / Save PDF</button>
        </>
      }>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {sections.length > 1 && (
          <nav style={{ width: 210, flexShrink: 0, position: 'sticky', top: 0, maxHeight: '62vh', overflowY: 'auto', borderRight: '1px solid var(--line)', paddingRight: '.5rem' }}>
            {sections.map((s, i) => {
              const n = filledCount(s), t = fieldCount(s)
              return (
                <button key={i} onClick={() => setActive(i)} style={{
                  display: 'flex', width: '100%', justifyContent: 'space-between', gap: '.4rem', textAlign: 'left', border: 'none', cursor: 'pointer',
                  padding: '.45rem .55rem', borderRadius: 7, fontSize: '.82rem', marginBottom: 2,
                  background: i === active ? 'var(--blue-soft)' : 'transparent', color: i === active ? 'var(--blue-ink)' : 'var(--ink)', fontWeight: i === active ? 700 : 500,
                }}>
                  <span>{s.title}</span>
                  <span className="muted" style={{ fontSize: '.72rem', flexShrink: 0 }}>{n ? `${n}/${t}` : ''}</span>
                </button>
              )
            })}
          </nav>
        )}
        <div ref={bodyRef} style={{ flex: 1, minWidth: 0, maxHeight: '62vh', overflowY: 'auto', paddingRight: '.3rem' }}>
          <h3 className="thread" style={{ marginTop: 0 }}>{sec.title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: '1rem' }}>
            {sec.fields.map((f, i) => (
              <div key={f.k || `h${i}`} style={{ gridColumn: ['text', 'date'].includes(f.type) && !f.heading ? 'auto' : '1 / -1' }}>
                <FieldInput f={f} data={data} set={set} toggle={toggle} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button className="btn btn-quiet" disabled={active === 0} onClick={() => setActive((a) => a - 1)}>← Previous</button>
            {active < sections.length - 1
              ? <button className="btn btn-outline" onClick={() => setActive((a) => a + 1)}>Next: {sections[active + 1].title} →</button>
              : <button className="btn btn-primary" onClick={print}>Print / Save PDF</button>}
          </div>
        </div>
      </div>
    </Modal>
  )
}

function hasValue(data, f) {
  if (f.type === 'table' || f.type === 'ynTable') return Object.keys(data).some((k) => k.startsWith(`${f.k}.`) && data[k])
  const v = data[f.k]
  return Array.isArray(v) ? v.length > 0 : !!v
}

const inp = { width: '100%', padding: '.5rem .65rem', border: '1px solid var(--line)', borderRadius: 8, fontFamily: 'inherit', fontSize: '.9rem' }

function FieldInput({ f, data, set, toggle }) {
  if (f.heading) return <div style={{ fontWeight: 700, color: 'var(--blue)', fontSize: '.86rem', margin: '1rem 0 .4rem', borderBottom: '1px solid var(--gold-soft)', paddingBottom: '.2rem' }}>{f.heading}</div>
  const label = <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--blue-ink)', marginBottom: '.25rem' }}>{strip(f.label)}</label>
  const v = data[f.k] ?? ''
  switch (f.type) {
    case 'textarea':
      return <div className="field">{label}<textarea rows={3} style={inp} value={v} onChange={(e) => set(f.k, e.target.value)} /></div>
    case 'date':
      return <div className="field">{label}<input type={/^\d{4}-\d{2}-\d{2}$/.test(v) || !v ? 'date' : 'text'} style={{ ...inp, maxWidth: 220 }} value={v} onChange={(e) => set(f.k, e.target.value)} /></div>
    case 'checks':
    case 'radio':
      return (
        <div className="field">
          {f.label && label}
          <div style={{ display: 'grid', gridTemplateColumns: (f.opts || []).some((o) => o.length > 60) ? '1fr' : 'repeat(auto-fill, minmax(190px, 1fr))', gap: '.3rem .8rem' }}>
            {(f.opts || []).map((o) => {
              const ok = f.type === 'radio' ? v === o : Array.isArray(v) && v.includes(o)
              return (
                <label key={o} style={{ display: 'flex', gap: '.45rem', alignItems: 'flex-start', fontSize: '.86rem', cursor: 'pointer', lineHeight: 1.35 }}>
                  <input type={f.type === 'radio' ? 'radio' : 'checkbox'} checked={ok} style={{ marginTop: 3 }}
                    onChange={() => (f.type === 'radio' ? set(f.k, ok ? '' : o) : toggle(f.k, o))} />
                  <span>{strip(o)}</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    case 'ynTable':
      return <YnTableInput f={f} data={data} set={set} />
    case 'table':
      return <TableInput f={f} data={data} set={set} />
    default:
      return <div className="field">{label}<input style={inp} value={v} onChange={(e) => set(f.k, e.target.value)} /></div>
  }
}

function YnTableInput({ f, data, set }) {
  const it = f.item
  const opts = it.opts || ['Yes', 'No', 'NA']
  return (
    <div className="field">
      {f.label && <label style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--blue-ink)' }}>{strip(f.label)}</label>}
      <table className="data" style={{ fontSize: '.84rem' }}>
        <thead><tr><th>{it.descLabel || 'Item'}</th>{opts.map((o) => <th key={o} style={{ textAlign: 'center', width: 54 }}>{o}</th>)}</tr></thead>
        <tbody>
          {it.sections.map((s, si) => [
            s.title && <tr key={`h${si}`}><td colSpan={opts.length + 1} style={{ background: 'var(--paper)', fontWeight: 700 }}>{s.title}</td></tr>,
            ...s.items.map((q, qi) => {
              const key = `${it.k}.${si}.${qi}`
              return (
                <tr key={key}>
                  <td>{qi + 1}. {strip(q)}</td>
                  {opts.map((o) => <td key={o} style={{ textAlign: 'center' }}><input type="radio" name={key} checked={data[key] === o} onChange={() => set(key, o)} onClick={() => data[key] === o && set(key, '')} /></td>)}
                </tr>
              )
            }),
          ])}
        </tbody>
      </table>
      {it.sections.some((s) => s.items.some((q) => /\{\{/.test(q))) && <InlineTokens list={it.sections.flatMap((s) => s.items)} data={data} set={set} />}
    </div>
  )
}

function InlineTokens({ list, data, set }) {
  const toks = []
  list.forEach((x) => { for (const m of String(x).matchAll(/\{\{([\w.]+)\|([^|}]*)/g)) toks.push([m[1], m[2]]) })
  return toks.map(([k, l]) => (
    <div key={k} className="field" style={{ marginTop: '.5rem' }}><label style={{ fontSize: '.8rem', fontWeight: 600 }}>{l}</label><input style={inp} value={data[k] || ''} onChange={(e) => set(k, e.target.value)} /></div>
  ))
}

// Editable grid: static text stays text, null → text box, '[]' → checkbox.
function TableInput({ f, data, set }) {
  const it = f.item
  const isTask = /tasks/.test(it.cls || '')
  const inline = []
  return (
    <div className="field" style={{ overflowX: 'auto' }}>
      {it.label && <label style={{ fontSize: '.8rem', fontWeight: 600 }}>{strip(it.label)}</label>}
      <table className="data" style={{ fontSize: '.8rem', minWidth: isTask ? 760 : undefined }}>
        {it.head && <thead><tr>{it.head.map((h, i) => <th key={i} colSpan={h?.span || 1}>{strip(typeof h === 'object' && h ? h.h : h)}</th>)}</tr></thead>}
        <tbody>
          {it.rows.map((row, r) => (
            <tr key={r}>
              {row.map((c, ci) => {
                const key = `${it.k}.${r}.${ci}`
                if (c === null || (c && typeof c === 'object' && c.edit)) {
                  return <td key={ci} style={{ padding: '.2rem' }}><input style={{ ...inp, padding: '.3rem .4rem', fontSize: '.82rem', minWidth: isTask ? 30 : 70 }} value={data[key] || ''} onChange={(e) => set(key, e.target.value)} /></td>
                }
                if (c === '[]') return <td key={ci} style={{ textAlign: 'center', padding: '.2rem' }}><input type="checkbox" checked={!!data[key]} onChange={(e) => set(key, e.target.checked)} /></td>
                if (c && typeof c === 'object') {
                  const txt = c.h ?? c.s ?? ''
                  for (const m of String(txt).matchAll(/\{\{([\w.]+)\|([^|}]*)/g)) inline.push([m[1], m[2]])
                  const isDay = c.h != null && DAYS.has(c.h)
                  return c.h != null
                    ? <th key={ci} colSpan={c.span || 1} style={{ background: 'var(--blue)', color: '#fff', textAlign: isDay ? 'center' : 'left', padding: '.3rem .4rem' }}>{strip(txt)}</th>
                    : <td key={ci} colSpan={c.span || 1}>{strip(txt)}</td>
                }
                return <td key={ci}>{strip(c)}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {inline.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '.5rem', marginTop: '.6rem' }}>
          {inline.map(([k, l]) => <div key={k}><label style={{ fontSize: '.76rem', fontWeight: 600 }}>{l}</label><input style={inp} value={data[k] || ''} onChange={(e) => set(k, e.target.value)} /></div>)}
        </div>
      )}
    </div>
  )
}

