import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Modal, Field } from './Ui'
import { generateReportPdf } from '../lib/pdf'

const TYPES = [
  { id: 'full', label: 'Full report', help: 'Every client with per-client detail, plus statistics for every caregiver.' },
  { id: 'client', label: 'Specific client', help: 'Every visit with its caregiver, hours, billing, invoices, notes and attendance for one client.' },
  { id: 'caregiver', label: 'Specific caregiver', help: 'Every visit with its client, hours, pay, mileage and attendance for one caregiver.' },
]
const clean = (r) => `${r.first_name || ''} ${r.last_name || ''}`.replace(/\s+/g, ' ').trim() + (r.is_active === false ? ' (inactive)' : '')

export default function ReportDownloadButton({ range }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('full')
  const [id, setId] = useState('')
  const [dates, setDates] = useState({ start: range.start, end: range.end })
  const [clients, setClients] = useState([])
  const [caregivers, setCaregivers] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) return
    setDates({ start: range.start, end: range.end }); setErr('')
    supabase.from('clients').select('id,first_name,last_name,is_active').order('last_name').then(({ data }) => setClients(data || []))
    supabase.from('caregivers').select('id,first_name,last_name,is_active').order('last_name').then(({ data }) => setCaregivers(data || []))
  }, [open]) // eslint-disable-line

  const pick = (t) => { setType(t); setId(''); setErr('') }
  const list = type === 'client' ? clients : caregivers

  const generate = async () => {
    setErr('')
    if (type !== 'full' && !id) return setErr(`Choose a ${type} from the list.`)
    setBusy(true)
    try {
      await generateReportPdf({ type, id: id || null, start: dates.start, end: dates.end })
      setOpen(false)
    } catch (e) {
      console.error(e)
      setErr(e.message || 'Could not create the report.')
    } finally { setBusy(false) }
  }

  return (
    <>
      <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={() => setOpen(true)}>Download PDF report</button>
      {open && (
        <Modal title="Download PDF report" onClose={() => setOpen(false)} footer={
          <>
            <button className="btn btn-quiet" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={generate} disabled={busy}>{busy ? 'Building report…' : 'Generate report'}</button>
          </>
        }>
          {err && <p className="notice notice-bad">{err}</p>}
          <p className="muted" style={{ fontSize: '.88rem', marginTop: 0 }}>What kind of report do you want?</p>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
            {TYPES.map((t) => (
              <button key={t.id} type="button" className={`btn ${type === t.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => pick(t.id)}>{t.label}</button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: '.84rem', marginTop: 0 }}>{TYPES.find((t) => t.id === type).help}</p>
          {type !== 'full' && (
            <Field label={type === 'client' ? 'Client' : 'Caregiver'}>
              <select value={id} onChange={(e) => setId(e.target.value)}>
                <option value="">{type === 'client' ? 'Select a client…' : 'Select a caregiver…'}</option>
                {list.map((r) => <option key={r.id} value={r.id}>{clean(r)}</option>)}
              </select>
            </Field>
          )}
          <div className="form-row">
            <Field label="From"><input type="date" value={dates.start} onChange={(e) => setDates({ ...dates, start: e.target.value })} /></Field>
            <Field label="To"><input type="date" value={dates.end} onChange={(e) => setDates({ ...dates, end: e.target.value })} /></Field>
          </div>
          <p className="muted" style={{ fontSize: '.8rem' }}>All times are shown in Pacific Time. The file name includes the report type, the person (if any), the period and today's date.</p>
        </Modal>
      )}
    </>
  )
}
