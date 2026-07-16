import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fullName, fmtDate } from '../lib/format'
import { geocodeAddress } from '../lib/geocode'
import { Modal, Field, Empty, Pill } from '../components/Ui'
import EditableSelect from '../components/EditableSelect'
import AddressAutocomplete from '../components/AddressAutocomplete'

export default function Clients() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)

  const load = () =>
    supabase.from('clients').select('*, payer_types(label)').order('last_name').then(({ data }) => setRows(data || []))
  useEffect(() => { load() }, [])

  const filtered = rows.filter((r) =>
    fullName(r).toLowerCase().includes(q.toLowerCase()) || (r.city || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <div className="page-head">
        <div><h1 className="thread">Clients</h1><div className="sub">Private-pay clients, their care plans, and physician documents.</div></div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>+ Register client</button>
      </div>

      <div className="toolbar mb">
        <input className="searchbox" placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card">
        {filtered.length === 0 ? <Empty title="No clients yet" hint="Register your first client to begin scheduling care." /> : (
          <table className="data">
            <thead><tr><th>Client</th><th>Address</th><th>Payer</th><th className="num">Bill rate</th><th>Authorized hrs/wk</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="click" onClick={() => setSelected(r)}>
                  <td><b>{fullName(r)}</b></td>
                  <td className="muted">{r.address}{r.city ? `, ${r.city}` : ''}</td>
                  <td>{r.payer_types?.label ? <Pill kind="info">{r.payer_types.label}</Pill> : <Pill kind="muted">Not set</Pill>}</td>
                  <td className="num">{r.bill_rate ? `$${Number(r.bill_rate).toFixed(2)}/h` : '—'}</td>
                  <td className="num">{r.authorized_hours_per_week ?? '—'}</td>
                  <td>{r.is_active ? <Pill kind="ok">Active</Pill> : <Pill kind="muted">Inactive</Pill>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {adding && <ClientModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} />}
      {selected && <ClientDetail client={selected} onClose={() => { setSelected(null); load() }} />}
    </>
  )
}

/* ================= Register / Edit modal (tabbed) ================= */

function ClientModal({ client, onClose, onSaved }) {
  const isNew = !client
  const [tab, setTab] = useState('basic')
  const [f, setF] = useState(client || {
    first_name: '', last_name: '', phone: '', address: '', city: '', zip: '',
    latitude: '', longitude: '', geofence_radius_m: 150, formatted_address: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    bill_rate: '', billing_cycle: 'weekly', billing_email: '', service_notes: '',
    payer_type_id: null, mobility_level_id: null, cognitive_status_id: null,
    authorized_hours_per_week: '', is_active: true,
  })
  const [diagnosisIds, setDiagnosisIds] = useState([])
  const [allergyIds, setAllergyIds] = useState([])
  const [caregiverIds, setCaregiverIds] = useState([])
  const [allCaregivers, setAllCaregivers] = useState([])
  const [geoStatus, setGeoStatus] = useState(null) // {ok, msg}
  const [geocoding, setGeocoding] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    supabase.from('caregivers').select('id,first_name,last_name').eq('is_active', true).order('last_name')
      .then(({ data }) => setAllCaregivers(data || []))
    if (!isNew) {
      supabase.from('client_diagnoses').select('diagnosis_id').eq('client_id', client.id)
        .then(({ data }) => setDiagnosisIds((data || []).map((r) => r.diagnosis_id)))
      supabase.from('client_allergies').select('allergy_id').eq('client_id', client.id)
        .then(({ data }) => setAllergyIds((data || []).map((r) => r.allergy_id)))
      supabase.from('client_caregivers').select('caregiver_id').eq('client_id', client.id)
        .then(({ data }) => setCaregiverIds((data || []).map((r) => r.caregiver_id)))
    }
  }, [client?.id]) // eslint-disable-line

  const runGeocode = async () => {
    const full = `${f.address}, ${f.city || ''} ${f.state || 'WA'} ${f.zip || ''}`.trim()
    setGeocoding(true); setGeoStatus(null)
    const result = await geocodeAddress(full)
    setGeocoding(false)
    if (!result.ok) { setGeoStatus({ ok: false, msg: result.error }); return }
    setF((prev) => ({ ...prev, latitude: result.lat, longitude: result.lng, formatted_address: result.formatted }))
    setGeoStatus({
      ok: true,
      msg: result.precise
        ? `Located precisely: ${result.formatted}`
        : `Located approximately (not an exact street match): ${result.formatted}. Double-check the address.`,
    })
  }

  const save = async () => {
    setErr('')
    if (!f.first_name || !f.last_name || !f.address) return setErr('Name and address are required (Basic Info tab).')
    if (!f.latitude) return setErr('Please locate the address (Basic Info tab) before saving, so GPS clock-in checks work.')
    setBusy(true)
    const row = { ...f,
      bill_rate: f.bill_rate === '' ? null : f.bill_rate,
      authorized_hours_per_week: f.authorized_hours_per_week === '' ? null : f.authorized_hours_per_week,
      latitude: Number(f.latitude), longitude: Number(f.longitude),
      geofence_radius_m: Number(f.geofence_radius_m) || 150,
      payer_type_id: f.payer_type_id || null,
      mobility_level_id: f.mobility_level_id || null,
      cognitive_status_id: f.cognitive_status_id || null,
    }
    delete row.id; delete row.created_at; delete row.payer_types
    const q = isNew ? supabase.from('clients').insert(row).select().single()
                    : supabase.from('clients').update(row).eq('id', client.id).select().single()
    const { data: saved, error } = await q
    if (error) { setErr(error.message); setBusy(false); return }

    const cid = saved.id
    await supabase.from('client_diagnoses').delete().eq('client_id', cid)
    if (diagnosisIds.length) await supabase.from('client_diagnoses').insert(diagnosisIds.map((d) => ({ client_id: cid, diagnosis_id: d })))
    await supabase.from('client_allergies').delete().eq('client_id', cid)
    if (allergyIds.length) await supabase.from('client_allergies').insert(allergyIds.map((a) => ({ client_id: cid, allergy_id: a })))
    await supabase.from('client_caregivers').delete().eq('client_id', cid)
    if (caregiverIds.length) await supabase.from('client_caregivers').insert(caregiverIds.map((c) => ({ client_id: cid, caregiver_id: c })))

    setBusy(false)
    onSaved()
  }

  return (
    <Modal title={isNew ? 'Register client' : 'Edit client'} onClose={onClose} wide footer={
      <><button className="btn btn-quiet" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save client'}</button></>
    }>
      {err && <p className="notice notice-bad">{err}</p>}
      <div className="toolbar mb">
        {['basic', 'clinical', 'operational'].map((t) => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '.4rem .9rem' }} onClick={() => setTab(t)}>
            {{ basic: 'Basic Info', clinical: 'Clinical / Care Info', operational: 'Operational' }[t]}
          </button>
        ))}
      </div>

      {tab === 'basic' && (
        <>
          <div className="form-row">
            <Field label="First name"><input value={f.first_name} onChange={set('first_name')} /></Field>
            <Field label="Last name"><input value={f.last_name} onChange={set('last_name')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Phone"><input value={f.phone || ''} onChange={set('phone')} /></Field>
            <Field label="Billing email"><input type="email" value={f.billing_email || ''} onChange={set('billing_email')} /></Field>
          </div>
          <Field label="Street address" help="Start typing and pick the suggested address — city, state, ZIP, and GPS fill in automatically.">
            <AddressAutocomplete
              value={f.address}
              placeholder="123 Main St"
              onSelect={(r) => {
                setF((prev) => ({
                  ...prev, address: r.address, city: r.city, state: r.state, zip: r.zip,
                  latitude: r.lat, longitude: r.lng, formatted_address: r.formatted,
                }))
                setGeoStatus({ ok: true, msg: `Located precisely: ${r.formatted}` })
              }}
            />
          </Field>
          <div className="form-row-3">
            <Field label="City"><input value={f.city || ''} onChange={set('city')} /></Field>
            <Field label="State"><input value={f.state || 'WA'} onChange={set('state')} /></Field>
            <Field label="ZIP"><input value={f.zip || ''} onChange={set('zip')} /></Field>
          </div>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div>
              <button type="button" className="btn btn-outline" onClick={runGeocode} disabled={geocoding}>
                {geocoding ? 'Locating…' : '📍 Locate this address'}
              </button>
            </div>
            <Field label="Geofence radius (meters)" help="How far from the home a clock-in is still considered valid.">
              <input type="number" value={f.geofence_radius_m} onChange={set('geofence_radius_m')} />
            </Field>
          </div>
          {geoStatus && <p className={`notice ${geoStatus.ok ? 'notice-ok' : 'notice-bad'}`}>{geoStatus.msg}</p>}
          {f.latitude && !geoStatus && <p className="notice notice-ok">Already located: {f.formatted_address || `${f.latitude}, ${f.longitude}`}</p>}

          <div className="form-row mt">
            <Field label="Emergency contact"><input value={f.emergency_contact_name || ''} onChange={set('emergency_contact_name')} /></Field>
            <Field label="Emergency phone"><input value={f.emergency_contact_phone || ''} onChange={set('emergency_contact_phone')} /></Field>
          </div>
          <div className="form-row">
            <Field label="Bill rate ($/hour)"><input type="number" step="0.01" value={f.bill_rate ?? ''} onChange={set('bill_rate')} /></Field>
            <Field label="Billing cycle">
              <select value={f.billing_cycle} onChange={set('billing_cycle')}>
                <option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="monthly">Monthly</option>
              </select>
            </Field>
          </div>
          <Field label="Additional notes"><textarea rows={2} value={f.service_notes || ''} onChange={set('service_notes')} /></Field>
        </>
      )}

      {tab === 'clinical' && (
        <>
          <EditableSelect table="payer_types" label="Payer type" value={f.payer_type_id}
            onChange={(v) => setF({ ...f, payer_type_id: v })} placeholder="Select payer…" />
          <EditableSelect table="mobility_levels" label="Mobility level" value={f.mobility_level_id}
            onChange={(v) => setF({ ...f, mobility_level_id: v })} placeholder="Select mobility level…" />
          <EditableSelect table="cognitive_statuses" label="Cognitive status" value={f.cognitive_status_id}
            onChange={(v) => setF({ ...f, cognitive_status_id: v })} placeholder="Select cognitive status…" />
          <EditableSelect table="diagnoses_list" label="Diagnoses" value={diagnosisIds} onChange={setDiagnosisIds} multi />
          <EditableSelect table="allergies_list" label="Allergies" value={allergyIds} onChange={setAllergyIds} multi />
          <p className="muted" style={{ fontSize: '.84rem' }}>
            Physicians, medications, and care plan files are added from the client's profile after saving —
            open the client and use the Physicians / Medications / Care Plan tabs.
          </p>
        </>
      )}

      {tab === 'operational' && (
        <>
          <Field label="Authorized service hours per week" help="Scheduling will warn if shifts for this client exceed this in a given week.">
            <input type="number" step="0.25" value={f.authorized_hours_per_week ?? ''} onChange={set('authorized_hours_per_week')} />
          </Field>
          <div className="field">
            <label>Assigned caregivers (pool)</label>
            <div style={{ border: '1px solid var(--line)', borderRadius: 7, padding: '.5rem .6rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
                {allCaregivers.map((c) => (
                  <button key={c.id} type="button"
                    className={`btn ${caregiverIds.includes(c.id) ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '.25rem .6rem', fontSize: '.8rem' }}
                    onClick={() => setCaregiverIds((ids) => ids.includes(c.id) ? ids.filter((x) => x !== c.id) : [...ids, c.id])}>
                    {fullName(c)}
                  </button>
                ))}
                {allCaregivers.length === 0 && <span className="muted">Register caregivers first.</span>}
              </div>
            </div>
            <span className="help">Any caregiver in this pool can be freely assigned to this client's shifts.</span>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ================= Client detail / profile ================= */

function ClientDetail({ client, onClose }) {
  const [tab, setTab] = useState('plan')
  const [editing, setEditing] = useState(false)

  const tabs = ['plan', 'clinical', 'physicians', 'medications', 'documents', 'operational', 'details']
  const labels = { plan: 'Care plan', clinical: 'Clinical', physicians: 'Physicians', medications: 'Medications', documents: 'Documents', operational: 'Operational', details: 'Details' }

  return (
    <Modal title={fullName(client)} onClose={onClose} wide footer={
      <button className="btn btn-quiet" onClick={onClose}>Close</button>
    }>
      <div className="toolbar mb">
        {tabs.map((t) => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '.4rem .8rem', fontSize: '.86rem' }} onClick={() => setTab(t)}>
            {labels[t]}
          </button>
        ))}
      </div>
      {tab === 'plan' && <CarePlanEditor clientId={client.id} />}
      {tab === 'clinical' && <ClinicalTab clientId={client.id} />}
      {tab === 'physicians' && <PhysiciansTab clientId={client.id} />}
      {tab === 'medications' && <MedicationsTab clientId={client.id} />}
      {tab === 'documents' && <Documents clientId={client.id} />}
      {tab === 'operational' && <OperationalTab client={client} />}
      {tab === 'details' && (
        <>
          <p><b>Address:</b> {client.address}{client.city ? `, ${client.city}` : ''} {client.zip || ''}</p>
          <p><b>Phone:</b> {client.phone || '—'} · <b>Emergency:</b> {client.emergency_contact_name || '—'} {client.emergency_contact_phone || ''}</p>
          <p><b>Bill rate:</b> {client.bill_rate ? `$${Number(client.bill_rate).toFixed(2)}/h` : '—'} · <b>Cycle:</b> {client.billing_cycle}</p>
          <p><b>GPS:</b> {client.latitude ? `${client.formatted_address || `${client.latitude}, ${client.longitude}`} (±${client.geofence_radius_m} m)` : 'Not located yet.'}</p>
          <p className="muted">{client.service_notes}</p>
          {editing
            ? <ClientModal client={client} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); onClose() }} />
            : <button className="btn btn-outline" onClick={() => setEditing(true)}>Edit details</button>}
        </>
      )}
    </Modal>
  )
}

function ClinicalTab({ clientId }) {
  const [payer, setPayer] = useState(null)
  const [mobility, setMobility] = useState(null)
  const [cognitive, setCognitive] = useState(null)
  const [diagnoses, setDiagnoses] = useState([])
  const [allergies, setAllergies] = useState([])

  useEffect(() => {
    supabase.from('clients').select('*, payer_types(label), mobility_levels(label), cognitive_statuses(label)')
      .eq('id', clientId).single().then(({ data }) => {
        setPayer(data?.payer_types?.label); setMobility(data?.mobility_levels?.label); setCognitive(data?.cognitive_statuses?.label)
      })
    supabase.from('client_diagnoses').select('diagnoses_list(label)').eq('client_id', clientId)
      .then(({ data }) => setDiagnoses((data || []).map((r) => r.diagnoses_list?.label).filter(Boolean)))
    supabase.from('client_allergies').select('allergies_list(label)').eq('client_id', clientId)
      .then(({ data }) => setAllergies((data || []).map((r) => r.allergies_list?.label).filter(Boolean)))
  }, [clientId])

  return (
    <>
      <p><b>Payer type:</b> {payer || 'Not set'}</p>
      <p><b>Mobility level:</b> {mobility || 'Not set'}</p>
      <p><b>Cognitive status:</b> {cognitive || 'Not set'}</p>
      <p><b>Diagnoses:</b> {diagnoses.length ? diagnoses.join(', ') : 'None recorded'}</p>
      <p><b>Allergies:</b> {allergies.length ? allergies.join(', ') : 'None recorded'}</p>
      <p className="muted" style={{ fontSize: '.85rem' }}>To change any of these, use "Edit details" on the Details tab.</p>
    </>
  )
}

function PhysiciansTab({ clientId }) {
  const [list, setList] = useState([])
  const [f, setF] = useState({ name: '', phone: '', fax: '', agency_name: '', notes: '' })
  const [err, setErr] = useState('')

  const load = () => supabase.from('physicians').select('*').eq('client_id', clientId).order('created_at').then(({ data }) => setList(data || []))
  useEffect(() => { load() }, [clientId]) // eslint-disable-line

  const add = async () => {
    setErr('')
    if (!f.name.trim()) return setErr('Physician name is required.')
    const { error } = await supabase.from('physicians').insert({ client_id: clientId, ...f })
    if (error) return setErr(error.message)
    setF({ name: '', phone: '', fax: '', agency_name: '', notes: '' })
    load()
  }
  const remove = async (id) => { await supabase.from('physicians').delete().eq('id', id); load() }

  return (
    <>
      {list.map((p) => (
        <div key={p.id} className="card card-pad mb" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <b>{p.name}</b>{p.agency_name && <span className="muted"> · {p.agency_name}</span>}
            <div className="muted" style={{ fontSize: '.85rem' }}>{p.phone || 'No phone'} {p.fax ? `· Fax ${p.fax}` : ''}</div>
            {p.notes && <div className="muted" style={{ fontSize: '.85rem' }}>{p.notes}</div>}
          </div>
          <button className="btn btn-quiet" onClick={() => remove(p.id)}>Remove</button>
        </div>
      ))}
      {list.length === 0 && <p className="muted">No physicians added yet.</p>}
      <h3 className="thread mt">Add a physician</h3>
      {err && <p className="notice notice-bad">{err}</p>}
      <div className="form-row">
        <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Agency (if any)"><input value={f.agency_name} onChange={(e) => setF({ ...f, agency_name: e.target.value })} /></Field>
      </div>
      <div className="form-row">
        <Field label="Phone"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        <Field label="Fax"><input value={f.fax} onChange={(e) => setF({ ...f, fax: e.target.value })} /></Field>
      </div>
      <Field label="Notes"><textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      <button className="btn btn-primary" onClick={add}>Add physician</button>
      <p className="muted mt" style={{ fontSize: '.84rem' }}>Attach signed orders from a physician on the Documents tab.</p>
    </>
  )
}

function MedicationsTab({ clientId }) {
  const [list, setList] = useState([])
  const [f, setF] = useState({ name: '', dosage: '', times: '', instructions: '' })
  const [err, setErr] = useState('')

  const load = () => supabase.from('medications').select('*').eq('client_id', clientId).eq('is_active', true).order('created_at').then(({ data }) => setList(data || []))
  useEffect(() => { load() }, [clientId]) // eslint-disable-line

  const add = async () => {
    setErr('')
    if (!f.name.trim() || !f.dosage.trim()) return setErr('Name and dosage are required.')
    const times = f.times.split(',').map((t) => t.trim()).filter(Boolean)
    const { error } = await supabase.from('medications').insert({
      client_id: clientId, name: f.name, dosage: f.dosage, schedule_times: times, instructions: f.instructions,
    })
    if (error) return setErr(error.message)
    setF({ name: '', dosage: '', times: '', instructions: '' })
    load()
  }
  const remove = async (id) => { await supabase.from('medications').update({ is_active: false }).eq('id', id); load() }

  return (
    <>
      {list.map((m) => (
        <div key={m.id} className="card card-pad mb" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <b>{m.name}</b> — {m.dosage}
            <div className="muted" style={{ fontSize: '.85rem' }}>
              {m.schedule_times?.length ? `Times: ${m.schedule_times.join(', ')}` : 'No scheduled times'}
            </div>
            {m.instructions && <div className="muted" style={{ fontSize: '.85rem' }}>{m.instructions}</div>}
          </div>
          <button className="btn btn-quiet" onClick={() => remove(m.id)}>Remove</button>
        </div>
      ))}
      {list.length === 0 && <p className="muted">No medications recorded yet.</p>}
      <h3 className="thread mt">Add a medication</h3>
      {err && <p className="notice notice-bad">{err}</p>}
      <div className="form-row">
        <Field label="Medication name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Dosage"><input value={f.dosage} onChange={(e) => setF({ ...f, dosage: e.target.value })} placeholder="e.g. 10mg" /></Field>
      </div>
      <Field label="Reminder times" help="Comma-separated, 24-hour format, e.g. 09:00, 17:00">
        <input value={f.times} onChange={(e) => setF({ ...f, times: e.target.value })} placeholder="09:00, 17:00" />
      </Field>
      <Field label="Instructions"><input value={f.instructions} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></Field>
      <button className="btn btn-primary" onClick={add}>Add medication</button>
      <p className="muted mt" style={{ fontSize: '.84rem' }}>Caregivers see medication reminders as a checklist during the visit.</p>
    </>
  )
}

function OperationalTab({ client }) {
  const [scheduled, setScheduled] = useState(null)
  const [caregivers, setCaregivers] = useState([])

  useEffect(() => {
    const weekStart = new Date(); weekStart.setHours(0,0,0,0); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    supabase.from('v_client_weekly_scheduled_hours').select('*').eq('client_id', client.id)
      .eq('week_start', weekStart.toISOString()).maybeSingle().then(({ data }) => setScheduled(data?.scheduled_hours ?? 0))
    supabase.from('client_caregivers').select('caregivers(first_name,last_name)').eq('client_id', client.id)
      .then(({ data }) => setCaregivers((data || []).map((r) => r.caregivers).filter(Boolean)))
  }, [client.id])

  const authorized = client.authorized_hours_per_week
  const over = authorized && scheduled != null && scheduled > authorized

  return (
    <>
      <p><b>Authorized hours/week:</b> {authorized ?? 'Not set'}</p>
      <p><b>Scheduled this week:</b> {scheduled ?? '—'} {over && <span className="pill pill-bad" style={{ marginLeft: '.5rem' }}>Over authorized hours</span>}</p>
      <h3 className="thread mt">Assigned caregiver pool</h3>
      {caregivers.length === 0 ? <p className="muted">No caregivers assigned yet — set this on the Details tab (Edit details → Operational).</p> : (
        <ul style={{ paddingLeft: '1.2rem' }}>{caregivers.map((c, i) => <li key={i}>{fullName(c)}</li>)}</ul>
      )}
    </>
  )
}

function CarePlanEditor({ clientId }) {
  const [plan, setPlan] = useState(null)
  const [tasks, setTasks] = useState([])
  const [summary, setSummary] = useState('')
  const [goals, setGoals] = useState('')
  const [special, setSpecial] = useState('')
  const [newTask, setNewTask] = useState({ category: 'ADL', label: '', instructions: '', frequency: 'Every visit' })
  const [msg, setMsg] = useState('')

  const load = async () => {
    let { data: p } = await supabase.from('care_plans').select('*')
      .eq('client_id', clientId).eq('is_active', true).maybeSingle()
    if (!p) {
      const ins = await supabase.from('care_plans')
        .insert({ client_id: clientId, title: 'Care Plan' }).select().single()
      p = ins.data
    }
    setPlan(p); setSummary(p?.summary || ''); setGoals(p?.goals || ''); setSpecial(p?.special_instructions || '')
    const { data: t } = await supabase.from('care_plan_tasks').select('*')
      .eq('care_plan_id', p.id).eq('is_active', true).order('sort_order')
    setTasks(t || [])
  }
  useEffect(() => { load() }, [clientId]) // eslint-disable-line

  const saveSummary = async () => {
    await supabase.from('care_plans').update({
      summary, goals, special_instructions: special, updated_at: new Date().toISOString(),
    }).eq('id', plan.id)
    setMsg('Care plan saved. Caregivers will see it on their next visit.')
    setTimeout(() => setMsg(''), 3500)
  }

  const addTask = async () => {
    if (!newTask.label.trim()) return
    await supabase.from('care_plan_tasks').insert({
      care_plan_id: plan.id, ...newTask, sort_order: tasks.length + 1,
    })
    setNewTask({ category: 'ADL', label: '', instructions: '', frequency: 'Every visit' })
    load()
  }

  const removeTask = async (id) => {
    await supabase.from('care_plan_tasks').update({ is_active: false }).eq('id', id)
    load()
  }

  if (!plan) return <p className="muted">Loading care plan…</p>
  return (
    <>
      {msg && <p className="notice notice-ok">{msg}</p>}
      <Field label="Care summary / goals" help="The RN overview caregivers see at the top of every visit.">
        <textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <Field label="Goals"><textarea rows={2} value={goals} onChange={(e) => setGoals(e.target.value)} /></Field>
      <Field label="Special instructions"><textarea rows={2} value={special} onChange={(e) => setSpecial(e.target.value)} /></Field>
      <button className="btn btn-outline mb" onClick={saveSummary}>Save care plan</button>

      <h3 className="thread" style={{ marginTop: '.6rem' }}>ADLs & IADLs</h3>
      {tasks.length === 0 && <p className="muted">No tasks yet — add the first one below.</p>}
      <table className="data mb">
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td style={{ width: 100 }}><Pill kind="info">{t.category}</Pill></td>
              <td><b>{t.label}</b>{t.instructions && <div className="muted" style={{ fontSize: '.83rem' }}>{t.instructions}</div>}</td>
              <td className="muted" style={{ width: 110 }}>{t.frequency}</td>
              <td style={{ width: 40 }}><button className="btn btn-quiet" onClick={() => removeTask(t.id)} aria-label="Remove task">✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="form-row-3">
        <Field label="Category">
          <select value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}>
            {['ADL', 'IADL', 'Medication Reminder', 'Safety', 'Other'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Task"><input value={newTask.label} onChange={(e) => setNewTask({ ...newTask, label: e.target.value })} placeholder="Assist with bathing" /></Field>
        <Field label="Frequency">
          <select value={newTask.frequency} onChange={(e) => setNewTask({ ...newTask, frequency: e.target.value })}>
            {['Every visit', 'Daily', 'Weekly', 'As needed'].map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Instructions"><input value={newTask.instructions} onChange={(e) => setNewTask({ ...newTask, instructions: e.target.value })} placeholder="Optional details" /></Field>
      <button className="btn btn-primary" onClick={addTask}>Add task</button>
    </>
  )
}

function Documents({ clientId }) {
  const [docs, setDocs] = useState([])
  const [physicians, setPhysicians] = useState([])
  const [f, setF] = useState({ doc_type: 'physician_order', title: '', physician_id: '' })
  const [file, setFile] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    supabase.from('client_documents').select('*, physicians(name)').eq('client_id', clientId)
      .order('created_at', { ascending: false }).then(({ data }) => setDocs(data || []))
    supabase.from('physicians').select('id,name').eq('client_id', clientId).then(({ data }) => setPhysicians(data || []))
  }
  useEffect(() => { load() }, [clientId]) // eslint-disable-line

  const upload = async () => {
    setErr('')
    if (!file || !f.title.trim()) return setErr('Choose a file and give it a title.')
    setBusy(true)
    const path = `${clientId}/${Date.now()}_${file.name}`
    const { error: upErr } = await supabase.storage.from('client-documents').upload(path, file)
    if (upErr) { setErr(upErr.message); setBusy(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('client_documents').insert({
      client_id: clientId, doc_type: f.doc_type, title: f.title, storage_path: path, uploaded_by: user.id,
      physician_id: f.physician_id || null,
    })
    setF({ doc_type: 'physician_order', title: '', physician_id: '' }); setFile(null); setBusy(false)
    load()
  }

  const open = async (d) => {
    const { data } = await supabase.storage.from('client-documents').createSignedUrl(d.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <>
      <p className="muted" style={{ fontSize: '.88rem' }}>
        Physician orders, medication lists, and care plan files live here. Two-way messaging with
        physicians is planned for a later phase.
      </p>
      {err && <p className="notice notice-bad">{err}</p>}
      <div className="form-row-3">
        <Field label="Type">
          <select value={f.doc_type} onChange={(e) => setF({ ...f, doc_type: e.target.value })}>
            <option value="physician_order">Physician order</option>
            <option value="medication_list">Medication list</option>
            <option value="care_plan">Care plan file</option>
            <option value="assessment">Assessment</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Title"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="File"><input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field>
      </div>
      {f.doc_type === 'physician_order' && (
        <Field label="From which physician? (optional)">
          <select value={f.physician_id} onChange={(e) => setF({ ...f, physician_id: e.target.value })}>
            <option value="">— Not specified —</option>
            {physicians.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      )}
      <button className="btn btn-primary mb" onClick={upload} disabled={busy}>{busy ? 'Uploading…' : 'Upload document'}</button>

      <table className="data">
        <tbody>
          {docs.map((d) => (
            <tr key={d.id} className="click" onClick={() => open(d)}>
              <td><Pill kind="gold">{d.doc_type.replaceAll('_', ' ')}</Pill></td>
              <td><b>{d.title}</b>{d.physicians?.name && <span className="muted"> — Dr. {d.physicians.name}</span>}</td>
              <td className="muted">{fmtDate(d.created_at)}</td>
            </tr>
          ))}
          {docs.length === 0 && <tr><td className="muted">No documents uploaded yet.</td></tr>}
        </tbody>
      </table>
    </>
  )
}
