import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Modal, Field, Pill } from './Ui'

const PT = 'America/Los_Angeles'
const parts = (d) => {
  const o = {}
  new Intl.DateTimeFormat('en-CA', { timeZone: PT, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(d)).forEach((x) => { o[x.type] = x.value })
  return o
}
const ptDate = (d) => { const o = parts(d); return `${o.year}-${o.month}-${o.day}` }
const ptTime = (d) => { const o = parts(d); return `${o.hour}:${o.minute}` }
const ptToISO = (date, time) => {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const target = Date.UTC(y, m - 1, d, hh, mm)
  let guess = target
  for (let i = 0; i < 2; i++) {
    const o = parts(guess)
    guess += target - Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute)
  }
  return new Date(guess).toISOString()
}
const stamp = (d) => (d ? new Date(d).toLocaleString('en-US', { timeZone: PT, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }) + ' PT' : '—')
const tOnly = (d) => (d ? new Date(d).toLocaleTimeString('en-US', { timeZone: PT, hour: 'numeric', minute: '2-digit' }) : '—')
const money = (n) => (n == null || n === '' ? '—' : Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' }))
const hrs = (n) => (n == null ? '—' : `${Number(n).toFixed(2)} h`)
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim()
const R = ({ k, children }) => <div><dt>{k}</dt><dd>{children ?? '—'}</dd></div>

/* ---------- Admin clock-out ---------- */
export function AdminClockOutModal({ row, onClose, onDone }) {
  const now = new Date()
  const [date, setDate] = useState(ptDate(now))
  const [time, setTime] = useState(ptTime(now))
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const iso = date && time ? ptToISO(date, time) : null
  const worked = iso ? (new Date(iso) - new Date(row.clock_in_at)) / 3600000 : null

  const submit = async () => {
    setErr('')
    if (!iso) return setErr('Enter the clock-out date and time.')
    if (worked <= 0) return setErr('Clock-out must be after the clock-in time.')
    if (new Date(iso) > new Date(Date.now() + 5 * 60000)) return setErr('Clock-out cannot be in the future.')
    setBusy(true)
    const { error } = await supabase.rpc('admin_clock_out', { p_visit_id: row.visit_id, p_at: iso, p_reason: reason || null })
    setBusy(false)
    if (error) return setErr(error.message)
    onDone()
  }

  return (
    <Modal title="Clock out caregiver" onClose={onClose} footer={
      <>
        <button className="btn btn-quiet" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Clock out at this time'}</button>
      </>
    }>
      {err && <p className="notice notice-bad">{err}</p>}
      <p style={{ marginTop: 0 }}><b>{clean(row.caregiver_name)}</b> with <b>{clean(row.client_name)}</b></p>
      <p className="muted" style={{ fontSize: '.88rem' }}>Clocked in: {stamp(row.clock_in_at)}</p>
      <div className="form-row">
        <Field label="Clock-out date (Pacific)"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Clock-out time (Pacific)"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
      </div>
      <Field label="Reason (optional)"><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. caregiver forgot to clock out" /></Field>
      {worked != null && (
        <p className={`notice ${worked > 0 ? 'notice-ok' : 'notice-bad'}`}>
          {worked > 0 ? `This will record ${worked.toFixed(2)} hours worked. The caregiver app updates immediately.` : 'Time is before the clock-in.'}
        </p>
      )}
    </Modal>
  )
}

/* ---------- Full visit detail (+ verify review) ---------- */
export function VisitDetailModal({ row, mode, onClose, onVerified }) {
  const [d, setD] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const { data: v } = await supabase.from('visits').select('*').eq('id', row.visit_id).maybeSingle()
        const none = Promise.resolve({ data: null })
        const [shiftR, tasksR, notesR, vitalsR, photosR, clientR, byR, adminR] = await Promise.all([
          v?.shift_id ? supabase.from('shifts').select('*').eq('id', v.shift_id).maybeSingle() : none,
          supabase.from('visit_tasks').select('*').eq('visit_id', row.visit_id),
          supabase.from('visit_notes').select('*, profiles(full_name)').eq('visit_id', row.visit_id).order('created_at'),
          supabase.from('visit_vitals').select('*').eq('visit_id', row.visit_id).order('recorded_at'),
          supabase.from('visit_photos').select('*').eq('visit_id', row.visit_id).order('created_at'),
          row.client_id ? supabase.from('clients').select('first_name,last_name,address,city,state,zip,phone,fall_risk,special_precautions').eq('id', row.client_id).maybeSingle() : none,
          v?.verified_by ? supabase.from('profiles').select('full_name').eq('id', v.verified_by).maybeSingle() : none,
          v?.admin_clock_out_by ? supabase.from('profiles').select('full_name').eq('id', v.admin_clock_out_by).maybeSingle() : none,
        ])
        const sign = async (bucket, path) => {
          if (!path) return null
          try { const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600); return data?.signedUrl || null } catch { return null }
        }
        const photos = photosR.data || []
        const [sigClient, sigCg, ...photoUrls] = await Promise.all([
          sign('visit-signatures', v?.client_signature_path), sign('visit-signatures', v?.caregiver_signature_path),
          ...photos.map((p) => sign('visit-photos', p.storage_path)),
        ])
        if (live) setD({
          v: v || {}, shift: shiftR.data, tasks: tasksR.data || [], notes: notesR.data || [], vitals: vitalsR.data || [],
          photos: photos.map((p, i) => ({ ...p, url: photoUrls[i] })), client: clientR.data,
          verifiedBy: byR.data?.full_name, adminBy: adminR.data?.full_name, sigClient, sigCg,
        })
      } catch (e) { if (live) setErr(e.message || 'Could not load all visit details.') }
    })()
    return () => { live = false }
  }, [row.visit_id])

  const v = d?.v || {}
  const sched = d?.shift ? (new Date(d.shift.ends_at) - new Date(d.shift.starts_at)) / 3600000 : null
  const worked = row.worked_hours != null ? Number(row.worked_hours) : null
  const undone = d ? d.tasks.filter((t) => !t.completed).length : 0

  const flags = []
  if (row.location_ok === false) flags.push('Clock-in/out location did not match the client address.')
  if (v.clocked_out_by_admin) flags.push('This visit was clocked out by the office, not by the caregiver.')
  if (d) {
    if (!d.tasks.length) flags.push('No care tasks (ADLs) were recorded.')
    else if (undone) flags.push(`${undone} of ${d.tasks.length} care tasks were not completed.`)
    if (!v.client_signature_path) flags.push('No client signature.')
    if (!v.caregiver_signature_path) flags.push('No caregiver signature.')
    if (!d.notes.length) flags.push('No visit note was written.')
    if (sched != null && worked != null && Math.abs(worked - sched) > 0.5) flags.push(`Worked ${worked.toFixed(2)} h but scheduled ${sched.toFixed(2)} h.`)
  }

  const status = !row.clock_out_at ? <Pill kind="gold">Still clocked in</Pill>
    : row.billed ? <Pill kind="gold">Billed</Pill> : row.verified ? <Pill kind="ok">Verified</Pill> : <Pill kind="warn">Pending verification</Pill>
  const canVerify = mode === 'verify' && !row.verified && !!row.clock_out_at

  const doVerify = async () => {
    setBusy(true); setErr('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('visits').update({ verified: true, verified_by: user.id, verified_at: new Date().toISOString() }).eq('id', row.visit_id)
    setBusy(false)
    if (error) return setErr(error.message)
    onVerified()
  }

  const footer = confirming ? (
    <>
      <button className="btn btn-quiet" onClick={() => setConfirming(false)} disabled={busy}>Go back and review</button>
      <button className="btn btn-primary" onClick={doVerify} disabled={busy}>{busy ? 'Verifying…' : 'Yes, verify this visit'}</button>
    </>
  ) : (
    <>
      <button className="btn btn-quiet" onClick={onClose}>Close</button>
      {canVerify && <button className="btn btn-primary" onClick={() => setConfirming(true)}>Verify this visit…</button>}
    </>
  )

  if (confirming) {
    return (
      <Modal title="Verify this visit?" onClose={onClose} wide footer={footer}>
        {err && <p className="notice notice-bad">{err}</p>}
        <p style={{ fontWeight: 700, marginTop: 0 }}>Are you sure you want to verify this visit after reviewing what the caregiver entered?</p>
        <p>{clean(row.client_name)} · {clean(row.caregiver_name)}<br />
          {stamp(row.clock_in_at)} to {tOnly(row.clock_out_at)} · <b>{hrs(worked)}</b><br />
          Billable {money(worked * row.bill_rate)} · Caregiver pay {money(worked * row.pay_rate)}</p>
        {flags.length ? (
          <div className="notice notice-warn"><b>Things to double-check:</b><ul style={{ margin: '.4rem 0 0', paddingLeft: '1.2rem' }}>{flags.map((f) => <li key={f}>{f}</li>)}</ul></div>
        ) : <p className="notice notice-ok">Nothing unusual was found in this visit.</p>}
        <p className="muted" style={{ fontSize: '.86rem' }}>Once verified, this visit can be invoiced and exported to payroll.</p>
      </Modal>
    )
  }

  const byCat = {}
  ;(d?.tasks || []).forEach((t) => { (byCat[t.category || 'Tasks'] = byCat[t.category || 'Tasks'] || []).push(t) })
  const sh = d?.shift

  return (
    <Modal title={`Visit — ${clean(row.client_name)}`} onClose={onClose} wide footer={footer}>
      {err && <p className="notice notice-bad">{err}</p>}
      {canVerify && <p className="notice notice-warn" style={{ marginTop: 0 }}>Review everything below, then click <b>Verify this visit…</b> at the bottom.</p>}

      <h3 className="thread">Summary</h3>
      <dl className="deflist">
        <R k="Status">{status}</R>
        <R k="Caregiver">{clean(row.caregiver_name)}</R>
        <R k="Client">{clean(row.client_name)}{d?.client?.fall_risk ? ' · fall risk' : ''}</R>
        <R k="Service">{row.service_type || sh?.service_type}</R>
        <R k="Clocked in">{stamp(row.clock_in_at)}</R>
        <R k="Clocked out">{row.clock_out_at ? stamp(row.clock_out_at) : 'Still clocked in'}</R>
        <R k="Hours worked">{hrs(worked)}</R>
        <R k="GPS check">{row.location_ok === true ? <Pill kind="ok">On site</Pill> : row.location_ok === false ? <Pill kind="bad">Mismatch</Pill> : <Pill kind="muted">No GPS check</Pill>}</R>
        <R k="Billable (bill rate)">{money(row.bill_rate)}/h → {money(worked * row.bill_rate)}</R>
        <R k="Caregiver pay (pay rate)">{money(row.pay_rate)}/h → {money(worked * row.pay_rate)}</R>
      </dl>
      {v.clocked_out_by_admin && (
        <p className="notice notice-warn">Clocked out by the office{d?.adminBy ? ` (${d.adminBy})` : ''} on {stamp(v.admin_clock_out_at)}.{v.admin_clock_out_reason ? ` Reason: ${v.admin_clock_out_reason}` : ''}</p>
      )}
      {!d && !err && <p className="muted">Loading the rest of the visit…</p>}

      {d && (
        <>
          <h3 className="thread mt">Scheduled (entered by the office)</h3>
          <dl className="deflist">
            <R k="Scheduled time">{sh ? `${stamp(sh.starts_at)} to ${tOnly(sh.ends_at)}` : '—'}</R>
            <R k="Scheduled hours">{sched != null ? hrs(sched) : '—'}</R>
            <R k="Shift status">{sh?.status}</R>
            <R k="Client address">{d.client ? [d.client.address, d.client.city, d.client.state, d.client.zip].filter(Boolean).join(', ') : '—'}</R>
            <div className="span2"><dt>Office shift notes</dt><dd>{sh?.notes || 'None'}</dd></div>
            {d.client?.special_precautions?.length > 0 && <div className="span2"><dt>Special precautions</dt><dd>{d.client.special_precautions.join(', ')}</dd></div>}
          </dl>

          <h3 className="thread mt">Travel and mileage</h3>
          <dl className="deflist">
            <R k="Directions used">{sh?.skipped_directions ? 'No (caregiver said already there)' : sh?.journey_start_at ? 'Yes' : 'Not recorded'}</R>
            <R k="Journey start">{sh?.journey_start_at ? stamp(sh.journey_start_at) : '—'}</R>
            <R k="Journey arrival">{sh?.journey_end_at ? stamp(sh.journey_end_at) : '—'}</R>
            <R k="Journey miles">{sh?.journey_miles != null ? `${sh.journey_miles} mi` : '—'}</R>
            <R k="Mileage on visit">{v.mileage_miles != null ? `${v.mileage_miles} mi` : '—'}</R>
            <R k="Mileage notes">{v.mileage_notes}</R>
          </dl>

          <h3 className="thread mt">Care tasks (ADLs) {d.tasks.length ? `· ${d.tasks.length - undone} of ${d.tasks.length} done` : ''}</h3>
          {d.tasks.length === 0 && <p className="muted">No tasks were recorded for this visit.</p>}
          {Object.entries(byCat).map(([cat, list]) => (
            <div key={cat} style={{ marginBottom: '.6rem' }}>
              <b style={{ fontSize: '.84rem' }}>{cat}</b>
              {list.map((t) => (
                <div key={t.id} style={{ padding: '.3rem 0', borderBottom: '1px solid var(--line)', fontSize: '.9rem' }}>
                  <span style={{ color: t.completed ? 'var(--ok, #1b7f4b)' : 'var(--bad, #b3261e)', fontWeight: 700 }}>{t.completed ? '✓' : '✗'}</span> {t.label}
                  {t.completed && t.completed_at && <span className="muted"> · done {tOnly(t.completed_at)}</span>}
                  {t.instructions && <div className="muted" style={{ fontSize: '.8rem' }}>{t.instructions}</div>}
                </div>
              ))}
            </div>
          ))}

          <h3 className="thread mt">Visit notes</h3>
          {d.notes.length === 0 && <p className="muted">No notes were written.</p>}
          {d.notes.map((n) => (
            <p key={n.id} style={{ background: 'var(--paper)', padding: '.6rem .8rem', borderRadius: 8, fontSize: '.9rem' }}>
              {n.body}<br /><span className="muted" style={{ fontSize: '.78rem' }}>{n.profiles?.full_name || 'Caregiver'} · {stamp(n.created_at)}</span>
            </p>
          ))}

          <h3 className="thread mt">Vitals</h3>
          {d.vitals.length === 0 && <p className="muted">No vitals were recorded.</p>}
          {d.vitals.map((x) => (
            <p key={x.id} style={{ fontSize: '.9rem', margin: '.25rem 0' }}>
              {tOnly(x.recorded_at)}: {[x.blood_pressure && `BP ${x.blood_pressure}`, x.pulse && `Pulse ${x.pulse}`, x.temperature && `Temp ${x.temperature}°F`, x.weight && `Weight ${x.weight} lb`, x.blood_glucose && `Glucose ${x.blood_glucose}`].filter(Boolean).join(' · ') || '—'}
              {x.notes && <span className="muted"> ({x.notes})</span>}
            </p>
          ))}

          <h3 className="thread mt">Photos</h3>
          {d.photos.length === 0 && <p className="muted">No photos.</p>}
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {d.photos.map((p) => p.url
              ? <a key={p.id} href={p.url} target="_blank" rel="noreferrer"><img src={p.url} alt="Visit" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }} /></a>
              : <span key={p.id} className="muted">Photo unavailable</span>)}
          </div>

          <h3 className="thread mt">Signatures</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <b style={{ fontSize: '.84rem' }}>Client / family{v.client_signature_name ? `: ${v.client_signature_name}` : ''}</b>
              {d.sigClient ? <img src={d.sigClient} alt="Client signature" style={{ display: 'block', maxWidth: 260, background: '#fff', border: '1px solid var(--line)', borderRadius: 6 }} /> : <p className="muted">{v.client_signature_path ? 'Could not load image' : 'Not signed'}</p>}
              {v.client_signature_at && <span className="muted" style={{ fontSize: '.78rem' }}>{stamp(v.client_signature_at)}</span>}
            </div>
            <div>
              <b style={{ fontSize: '.84rem' }}>Caregiver</b>
              {d.sigCg ? <img src={d.sigCg} alt="Caregiver signature" style={{ display: 'block', maxWidth: 260, background: '#fff', border: '1px solid var(--line)', borderRadius: 6 }} /> : <p className="muted">{v.caregiver_signature_path ? 'Could not load image' : 'Not signed'}</p>}
              {v.caregiver_signature_at && <span className="muted" style={{ fontSize: '.78rem' }}>{stamp(v.caregiver_signature_at)}</span>}
            </div>
          </div>

          <h3 className="thread mt">Verification</h3>
          <dl className="deflist">
            <R k="Verified">{v.verified ? 'Yes' : 'Not yet'}</R>
            <R k="Verified by">{d.verifiedBy}</R>
            <R k="Verified at">{v.verified_at ? stamp(v.verified_at) : '—'}</R>
            <R k="Billed">{v.billed ? 'Yes' : 'No'}</R>
          </dl>

          <details className="mt">
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>All recorded fields</summary>
            <table className="data" style={{ marginTop: '.5rem' }}>
              <tbody>
                {Object.entries(v).filter(([, val]) => val !== null && typeof val !== 'object').map(([k, val]) => (
                  <tr key={k}><td className="muted" style={{ width: '40%' }}>{k.replace(/_/g, ' ')}</td><td style={{ wordBreak: 'break-all' }}>{String(val)}</td></tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </Modal>
  )
}
