import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fullName } from '../lib/format'
import { Empty, HowThisWorks } from '../components/Ui'
import { DOCUMENTS } from '../documents/registry'
import { MODULES } from '../documents/modules'
import { openPrintable } from '../documents/print'
import DocumentFillModal from '../components/DocumentFillModal'

const PT = 'America/Los_Angeles'
const stamp = (d) => new Date(d).toLocaleString('en-US', { timeZone: PT, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

const ICON = {
  admission: 'M9 2h6a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V3a1 1 0 0 1 1-1zm0 2v2h6V4H9zm-1 7h8v2H8v-2zm0 4h6v2H8v-2z',
  policy: 'M5 3h11l3 3v15H5V3zm2 2v14h10V7h-3V5H7zm2 5h6v2H9v-2zm0 4h6v2H9v-2z',
  default: 'M6 2h9l5 5v15H6V2zm2 2v16h10V8h-4V4H8zm2 8h6v2h-6v-2zm0 4h6v2h-6v-2z',
}

export default function Documents() {
  const [fill, setFill] = useState(null)       // { doc, record }
  const [records, setRecords] = useState([])
  const [tableMissing, setTableMissing] = useState(false)
  const [filter, setFilter] = useState('')

  const load = async () => {
    const { data, error } = await supabase.from('document_records')
      .select('id,doc_key,title,status,client_id,updated_at,clients(first_name,last_name)')
      .order('updated_at', { ascending: false }).limit(200)
    if (error) { setTableMissing(/document_records/.test(error.message)); return }
    setRecords(data || [])
  }
  useEffect(() => { load() }, [])

  const printBlank = (doc) => openPrintable({
    title: doc.blankLabel ? `${doc.title} — Worksheets` : doc.title, short: doc.short,
    body: (logo) => MODULES[doc.key].render({}, { logo, blank: true }),
  })

  const openRecord = async (r) => {
    const { data } = await supabase.from('document_records').select('*').eq('id', r.id).single()
    if (data) setFill({ doc: DOCUMENTS.find((d) => d.key === data.doc_key), record: data })
  }
  const remove = async (r) => {
    if (!confirm(`Delete this saved ${r.title || 'form'}? This cannot be undone.`)) return
    await supabase.from('document_records').delete().eq('id', r.id)
    load()
  }

  const shown = records.filter((r) => {
    const q = filter.trim().toLowerCase()
    if (!q) return true
    return `${r.title} ${r.clients ? fullName(r.clients) : ''}`.toLowerCase().includes(q)
  })

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="thread">Essential Documentation</h1>
          <div className="sub">The agency's policy manual and patient forms — download, print blank, or fill in and print.</div>
        </div>
      </div>
      <HowThisWorks>
        <b>Download PDF</b> gives you the ready-made document with the current logo, address (614 Harrison St, Suite C, Sumner) and phone (253) 487-7217.
        <b> Print blank</b> opens a fresh copy to print by hand. For the policy manual, <b>Fill worksheets</b> covers its review log, emergency information, risk, preparedness, business recovery and hazard worksheets. <b>Fill in</b> opens a form where you type the answers — pick a client to fill their name,
        date of birth, address and contacts automatically — then save it and print a clean, filled copy. Saved forms are listed below so you can reopen and reprint them.
      </HowThisWorks>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {DOCUMENTS.map((d) => (
          <div key={d.key} className="card card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '.8rem', alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10, background: 'var(--gold-soft)', display: 'grid', placeItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#8a6d12"><path d={ICON[d.key] || ICON.default} /></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: '0 0 .2rem', fontSize: '1.02rem' }}>{d.title}</h3>
                <p className="muted" style={{ margin: 0, fontSize: '.84rem', lineHeight: 1.45 }}>{d.blurb}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '1rem' }}>
              <a className="btn btn-primary" href={`/documents/${d.file}`} download>Download PDF</a>
              {MODULES[d.key] && <button className="btn btn-outline" onClick={() => printBlank(d)}>{d.blankLabel || 'Print blank'}</button>}
              {MODULES[d.key] && <button className="btn btn-gold" onClick={() => setFill({ doc: d, record: null })}>{d.fillLabel || 'Fill in'}</button>}
            </div>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginTop: '1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h3 className="thread" style={{ margin: 0 }}>Saved forms</h3>
          {records.length > 0 && <input placeholder="Search by client or form…" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '.45rem .7rem', border: '1px solid var(--line)', borderRadius: 8, minWidth: 240 }} />}
        </div>
        {tableMissing ? (
          <p className="notice notice-warn" style={{ marginTop: '1rem' }}>Saving filled forms needs a one-time database update: run <b>supabase/28_document_records.sql</b> in the Supabase SQL Editor. Until then you can still fill in and print forms.</p>
        ) : shown.length === 0 ? (
          <Empty title="No saved forms yet" hint="Forms you fill in and save will appear here." />
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '.8rem' }}>
            <table className="data">
              <thead><tr><th>Form</th><th>Client</th><th>Status</th><th>Last saved</th><th></th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="click" onClick={() => openRecord(r)}>
                    <td><b>{DOCUMENTS.find((d) => d.key === r.doc_key)?.title || r.doc_key}</b></td>
                    <td>{r.clients ? fullName(r.clients) : (r.title || '—')}</td>
                    <td><span className={`pill ${r.status === 'completed' ? 'pill-ok' : 'pill-warn'}`}>{r.status === 'completed' ? 'Completed' : 'Draft'}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{stamp(r.updated_at)}</td>
                    <td style={{ textAlign: 'right' }}><button className="btn btn-quiet" style={{ color: 'var(--bad)' }} onClick={(e) => { e.stopPropagation(); remove(r) }}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {fill && (
        <DocumentFillModal doc={fill.doc} record={fill.record}
          onClose={() => setFill(null)} onSaved={() => load()} />
      )}
    </>
  )
}
