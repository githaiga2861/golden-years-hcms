import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fullName } from '../lib/format'
import { Modal, HowThisWorks } from '../components/Ui'
import { buildEmailForExisting, buildEmailForNew } from '../lib/emailTemplates'


let rowIdSeq = 1
const newRow = () => ({
  _id: rowIdSeq++,
  step: null,          // null | 'existing' | 'new-choice' | 'new-manual'
  caregiverId: '',
  name: '',
  email: '',
  password: '',
  subject: '',
  body: '',
  loadingSecret: false,
})

export default function Emails() {
  const [showShare, setShowShare] = useState(false)

  return (
    <>
      <div className="page-head">
        <div><h1 className="thread">Emails</h1><div className="sub">Tools for emailing caregivers and other contacts.</div></div>
      </div>
      <HowThisWorks>
        "Send" opens a draft in your own email app (Gmail, Outlook, whatever you use) — it doesn't send anything
        automatically. You review it, make any edits, and hit send yourself, so you always know exactly what went
        out and when.
      </HowThisWorks>

      <div className="card card-pad" style={{ maxWidth: 420 }}>
        <h3 style={{ marginTop: 0 }}>Share download link</h3>
        <p className="muted" style={{ fontSize: '.88rem' }}>
          Send a caregiver the Care App download link, with their login details if they're already set up.
        </p>
        <button className="btn btn-primary" onClick={() => setShowShare(true)}>Share download link</button>
      </div>

      {showShare && <ShareDownloadLinkModal onClose={() => setShowShare(false)} />}
    </>
  )
}

function ShareDownloadLinkModal({ onClose }) {
  const navigate = useNavigate()
  const [caregivers, setCaregivers] = useState([])
  const [rows, setRows] = useState([newRow()])

  useEffect(() => {
    supabase.from('caregivers').select('id,first_name,last_name,email').eq('is_active', true).order('last_name')
      .then(({ data }) => setCaregivers(data || []))
  }, [])

  const updateRow = (id, patch) => setRows((prev) => prev.map((r) => r._id === id ? { ...r, ...patch } : r))
  const addRow = () => setRows((prev) => [...prev, newRow()])
  const removeRow = (id) => setRows((prev) => prev.length > 1 ? prev.filter((r) => r._id !== id) : prev)

  const chooseExisting = (id) => updateRow(id, { step: 'existing' })
  const chooseNewChoice = (id) => updateRow(id, { step: 'new-choice' })

  const selectCaregiver = async (rowId, caregiverId) => {
    const cg = caregivers.find((c) => c.id === caregiverId)
    if (!cg) return
    updateRow(rowId, { caregiverId, name: fullName(cg), email: cg.email || '', loadingSecret: true })

    const { data: { session } } = await supabase.auth.getSession()
    const { data, error } = await supabase.functions.invoke('get-caregiver-login-secret', {
      body: { caregiver_id: caregiverId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const password = !error && data?.password ? data.password : ''
    const loginEmail = !error && data?.email ? data.email : (cg.email || '')
    const changedByCaregiver = !error && data?.changedByCaregiver
    const { subject, body } = buildEmailForExisting(fullName(cg), password, loginEmail, changedByCaregiver)
    updateRow(rowId, { password, email: loginEmail, subject, body, loadingSecret: false, changedByCaregiver })
  }

  const wantToAddFirst = () => {
    navigate('/app/caregivers', { state: { highlightAdd: true } })
  }

  const continueWithoutAdding = (rowId) => {
    updateRow(rowId, { step: 'new-manual' })
  }

  const applyManualFields = (rowId, name, email) => {
    const { subject, body } = buildEmailForNew(name || 'there')
    updateRow(rowId, { name, email, subject, body })
  }

  const send = (row) => {
    const url = `mailto:${encodeURIComponent(row.email)}?subject=${encodeURIComponent(row.subject)}&body=${encodeURIComponent(row.body)}`
    window.location.href = url
  }

  return (
    <Modal title="Share download link" onClose={onClose} footer={
      <button className="btn btn-quiet" onClick={onClose}>Close</button>
    }>
      {rows.map((row, idx) => (
        <div key={row._id} className="card" style={{ background: 'var(--paper)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
            <b style={{ fontSize: '.9rem' }}>Recipient {idx + 1}</b>
            {rows.length > 1 && <button className="btn btn-quiet" style={{ fontSize: '.8rem' }} onClick={() => removeRow(row._id)}>Remove</button>}
          </div>

          {row.step === null && (
            <>
              <p style={{ margin: '0 0 .6rem', fontSize: '.9rem' }}>Is this caregiver already in the system?</p>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => chooseExisting(row._id)}>Yes, they're added</button>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => chooseNewChoice(row._id)}>No, not yet</button>
              </div>
            </>
          )}

          {row.step === 'existing' && (
            <>
              <div className="field">
                <label>Select caregiver</label>
                <select value={row.caregiverId} onChange={(e) => selectCaregiver(row._id, e.target.value)}>
                  <option value="">Choose…</option>
                  {caregivers.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
                </select>
              </div>
              {row.loadingSecret && <p className="muted" style={{ fontSize: '.84rem' }}>Loading their login details…</p>}
              {row.caregiverId && !row.loadingSecret && (
                <EmailFields row={row} onChange={(patch) => updateRow(row._id, patch)} onSend={() => send(row)} />
              )}
            </>
          )}

          {row.step === 'new-choice' && (
            <>
              <p style={{ margin: '0 0 .6rem', fontSize: '.9rem' }}>
                Adding them to the system first will auto-fill most fields. Do you want to add them now?
              </p>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={wantToAddFirst}>Yes, add them first</button>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => continueWithoutAdding(row._id)}>No, continue without</button>
              </div>
            </>
          )}

          {row.step === 'new-manual' && (
            <>
              <div className="form-row">
                <div className="field"><label>Name</label>
                  <input value={row.name} onChange={(e) => applyManualFields(row._id, e.target.value, row.email)} placeholder="Caregiver's name" />
                </div>
                <div className="field"><label>Email</label>
                  <input type="email" value={row.email} onChange={(e) => applyManualFields(row._id, row.name, e.target.value)} placeholder="their@email.com" />
                </div>
              </div>
              {row.email && <EmailFields row={row} onChange={(patch) => updateRow(row._id, patch)} onSend={() => send(row)} />}
            </>
          )}
        </div>
      ))}

      <button className="btn btn-outline" onClick={addRow}>+ Add another recipient</button>
    </Modal>
  )
}

function EmailFields({ row, onChange, onSend }) {
  return (
    <>
      <div className="field" style={{ marginTop: '.7rem' }}>
        <label>Subject</label>
        <input value={row.subject} onChange={(e) => onChange({ subject: e.target.value })} />
      </div>
      <div className="field">
        <label>Message</label>
        <textarea rows={8} value={row.body} onChange={(e) => onChange({ body: e.target.value })} />
      </div>
      <button className="btn btn-primary" disabled={!row.email} onClick={onSend}>
        Open email to {row.email || '…'}
      </button>
    </>
  )
}
