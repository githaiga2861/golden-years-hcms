import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fullName } from '../lib/format'
import { HowThisWorks } from '../components/Ui'
import { DOCUMENTS, docByKey } from '../documents/registry'
import { MODULES } from '../documents/modules'
import PAGES from '../documents/pageCounts'
import { openPrintable } from '../documents/print'
import DocumentFillModal from '../components/DocumentFillModal'

const PT = 'America/Los_Angeles'
const stamp = (d) => new Date(d).toLocaleString('en-US', { timeZone: PT, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const pagesLabel = (k) => (PAGES[k] ? `${PAGES[k]} page${PAGES[k] === 1 ? '' : 's'}` : '')

const I = {
  book: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5a1.5 1.5 0 0 0 0 3H20v-1.5M4 4.5v15',
  clip: 'M9 3h6v3H9zM8 4.5H6a1 1 0 0 0-1 1V21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-2M8.5 11h7M8.5 15h7M8.5 19h4',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  pulse: 'M3 12h4l2-5 4 10 2-5h6',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  alert: 'M12 3l9.5 17h-19zM12 10v4M12 17h.01',
  pen: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4M14 20h6',
  doc: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6',
}
const ICON = { policy: 'book', admission: 'clip', assessment: 'heart', safety: 'home', nurse: 'pulse', progress: 'pen', homecare: 'book', management: 'shield', ws_review: 'list', ws_emergency: 'alert', ws_risk: 'alert', ws_planeval: 'list', ws_hva: 'alert', ws_recovery: 'shield' }
const Icon = ({ name, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={I[name] || I.doc} /></svg>
)

export default function Documents() {
  const [fill, setFill] = useState(null)
  const [records, setRecords] = useState([])
  const [tableMissing, setTableMissing] = useState(false)
  const [filter, setFilter] = useState('')
  const [preparing, setPreparing] = useState('')

  const load = async () => {
    const { data, error } = await supabase.from('document_records')
      .select('id,doc_key,title,status,client_id,updated_at,clients(first_name,last_name)')
      .order('updated_at', { ascending: false }).limit(300)
    if (error) { setTableMissing(/document_records/.test(error.message)); return }
    setRecords(data || [])
  }
  useEffect(() => { load() }, [])

  const printBlank = async (doc) => {
    setPreparing(doc.key)
    await openPrintable({ title: doc.title, short: doc.short, body: (logo) => MODULES[doc.key].render({}, { logo, blank: true }) })
    setPreparing('')
  }
  const openRecord = async (r) => {
    const { data } = await supabase.from('document_records').select('*').eq('id', r.id).single()
    if (data) setFill({ doc: docByKey(data.doc_key), record: data })
  }
  const remove = async (r) => {
    if (!confirm(`Delete this saved ${docByKey(r.doc_key)?.title || 'form'}? This cannot be undone.`)) return
    await supabase.from('document_records').delete().eq('id', r.id)
    load()
  }

  const main = DOCUMENTS.find((d) => d.section === 'main')
  const homeCare = DOCUMENTS.find((d) => d.section === 'manual')
  const patient = DOCUMENTS.filter((d) => d.section === 'patient')
  const agency = DOCUMENTS.filter((d) => d.section === 'agency')
  const fromManual = DOCUMENTS.filter((d) => d.fromManual)
  const savedCount = (k) => records.filter((r) => r.doc_key === k).length

  const shown = useMemo(() => records.filter((r) => {
    const q = filter.trim().toLowerCase()
    if (!q) return true
    return `${docByKey(r.doc_key)?.title || ''} ${r.title || ''} ${r.clients ? fullName(r.clients) : ''}`.toLowerCase().includes(q)
  }), [records, filter])

  const actions = (d, variant) => (
    <div className={`doc-actions ${variant || ''}`}>
      <a className="btn doc-btn doc-btn-dl" href={`/documents/${d.file}`} download>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
        Download
      </a>
      <button className="btn doc-btn doc-btn-print" onClick={() => printBlank(d)} disabled={preparing === d.key}>
        {preparing === d.key ? 'Preparing…' : 'Print blank'}
      </button>
      <button className="btn doc-btn doc-btn-fill" onClick={() => setFill({ doc: d, record: null })}>{d.fillLabel || 'Fill in'}</button>
    </div>
  )

  const card = (d) => (
    <article key={d.key} className={`doc-card ${d.section === 'main' ? 'doc-card-main' : ''}`}>
      <div className="doc-card-top">
        <div className="doc-icon"><Icon name={ICON[d.key]} /></div>
        <div className="doc-meta">
          {d.section === 'main' && <span className="doc-chip doc-chip-main">Main document</span>}
          {PAGES[d.key] > 0 && <span className="doc-chip">{pagesLabel(d.key)}</span>}
          {d.fromManual && <span className="doc-chip doc-chip-gold">From the manual</span>}
        </div>
      </div>
      <h3 className="doc-title">{d.title}</h3>
      <p className="doc-blurb">{d.blurb}</p>
      {savedCount(d.key) > 0 && <div className="doc-saved">{savedCount(d.key)} saved</div>}
      {actions(d)}
    </article>
  )

  return (
    <div className="docs-page">
      <div className="page-head">
        <div>
          <h1 className="thread">Essential Documentation</h1>
          <div className="sub">The agency's policy manual and patient forms — download, print blank, or fill in, save and print.</div>
        </div>
        <div className="docs-stats">
          <div><b>{DOCUMENTS.length}</b><span>documents</span></div>
          <div><b>{Object.values(PAGES).reduce((a, b) => a + b, 0) || '—'}</b><span>pages</span></div>
          <div><b>{records.length}</b><span>saved</span></div>
        </div>
      </div>
      <HowThisWorks>
        <b>Download</b> gives the ready-made PDF with the current logo, address (614 Harrison St, Suite C, Sumner) and phone (253) 487-7217.
        <b> Print blank</b> opens a clean copy to fill by hand. <b>Fill in</b> opens a step-by-step form — pick a client to fill their name, date of birth,
        address and contacts automatically — then save it and print. <b>Fill full form</b> on the Skilled Nursing Medical Home Health manual completes every blank in it, including the worksheets
        listed under it, which can also be filled one at a time. The agency holds two licence categories, so there are two manuals: <b>Skilled Nursing Medical Home Health</b> and <b>Non-Medical Home Care</b>. Saved forms are listed at the bottom to reopen, edit and reprint.
      </HowThisWorks>

      <div className="doc-section-head">
        <h2>Policy &amp; procedure manuals</h2>
        <span>One manual per licence category — skilled nursing medical home health, and non-medical home care.</span>
      </div>
      <div className="doc-grid">{[main, homeCare].filter(Boolean).map(card)}</div>

      <div className="doc-section-head">
        <h2>Patient forms</h2>
        <span>Filled for a specific client — pick the client and their details fill in for you.</span>
      </div>
      <div className="doc-grid">{patient.map(card)}</div>

      <div className="doc-section-head">
        <h2>Agency plans &amp; worksheets</h2>
        <span>Agency-level records for compliance, emergency preparedness and annual review.</span>
      </div>
      <div className="doc-grid">{agency.map(card)}</div>

      <section className="doc-saved-panel">
        <div className="doc-saved-head">
          <div>
            <h2>Saved forms</h2>
            <span>{records.length ? `${records.length} saved — click one to open, edit or print it.` : 'Forms you fill in and save appear here.'}</span>
          </div>
          {records.length > 0 && <input className="doc-search" placeholder="Search by client or form…" value={filter} onChange={(e) => setFilter(e.target.value)} />}
        </div>
        {tableMissing ? (
          <p className="notice notice-warn" style={{ margin: '1rem 0 0' }}>Saving filled forms needs a one-time database update: run <b>supabase/28_document_records.sql</b> in the Supabase SQL Editor. Until then you can still fill in and print forms.</p>
        ) : shown.length === 0 ? (
          <div className="doc-empty">
            <Icon name="doc" size={28} />
            <b>{records.length ? 'No saved forms match your search' : 'No saved forms yet'}</b>
            <span>Use <i>Fill in</i> on any document, then <i>Save draft</i> or <i>Mark completed</i>.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data doc-table">
              <thead><tr><th>Document</th><th>Client / title</th><th>Status</th><th>Last saved</th><th></th></tr></thead>
              <tbody>
                {shown.map((r) => {
                  const d = docByKey(r.doc_key)
                  return (
                    <tr key={r.id} className="click" onClick={() => openRecord(r)}>
                      <td><div className="doc-row-title"><span className="doc-row-icon"><Icon name={ICON[r.doc_key]} size={16} /></span><b>{d?.title || r.doc_key}</b></div></td>
                      <td>{r.clients ? fullName(r.clients) : (r.title && r.title !== d?.title ? r.title : '—')}</td>
                      <td><span className={`pill ${r.status === 'completed' ? 'pill-ok' : 'pill-warn'}`}>{r.status === 'completed' ? 'Completed' : 'Draft'}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{stamp(r.updated_at)}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-quiet" onClick={(e) => { e.stopPropagation(); openRecord(r) }}>Open</button>
                        <button className="btn btn-quiet" style={{ color: 'var(--bad)' }} onClick={(e) => { e.stopPropagation(); remove(r) }}>Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {fill && <DocumentFillModal doc={fill.doc} record={fill.record} onClose={() => setFill(null)} onSaved={() => load()} />}
    </div>
  )
}
