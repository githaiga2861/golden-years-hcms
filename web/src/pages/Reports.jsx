import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fmtDate, fullName } from '../lib/format'
import { Modal, Field, Empty, Pill } from '../components/Ui'

const csvDownload = (filename, head, rows) => {
  const blob = new Blob([head + rows.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

export default function Reports() {
  const [tab, setTab] = useState('summary')

  return (
    <>
      <div className="page-head">
        <div><h1 className="thread">Reports</h1><div className="sub">Performance, utilization, incidents, and exportable summaries.</div></div>
      </div>
      <div className="toolbar mb">
        {['summary', 'performance', 'authorization', 'incidents'].map((t) => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '.4rem .9rem' }} onClick={() => setTab(t)}>
            {{ summary: 'Scheduling / Billing / Payroll', performance: 'Caregiver Performance', authorization: 'Authorization Utilization', incidents: 'Incident Log' }[t]}
          </button>
        ))}
      </div>
      {tab === 'summary' && <SummaryReports />}
      {tab === 'performance' && <PerformanceReport />}
      {tab === 'authorization' && <AuthorizationReport />}
      {tab === 'incidents' && <IncidentLog />}
    </>
  )
}

/* ================= Scheduling / Billing / Payroll summary ================= */

function SummaryReports() {
  const [range, setRange] = useState(() => {
    const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 30)
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
  })
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    const startISO = new Date(range.start + 'T00:00').toISOString()
    const endISO = new Date(range.end + 'T23:59:59').toISOString()

    const [shiftsRes, visitsRes, invoicesRes] = await Promise.all([
      supabase.from('shifts').select('status').gte('starts_at', startISO).lte('starts_at', endISO),
      supabase.from('v_visit_ledger').select('*').gte('clock_in_at', startISO).lte('clock_in_at', endISO),
      supabase.from('invoices').select('total, created_at').gte('created_at', startISO).lte('created_at', endISO),
    ])

    const shifts = shiftsRes.data || []
    const visits = (visitsRes.data || []).filter((v) => v.clock_out_at)
    const invoices = invoicesRes.data || []

    const totalHours = visits.reduce((sum, v) => sum + (v.worked_hours || 0), 0)
    const totalPayroll = visits.reduce((sum, v) => sum + (v.worked_hours || 0) * (v.pay_rate || 0), 0)
    const totalBilled = invoices.reduce((sum, i) => sum + Number(i.total || 0), 0)

    setStats({
      shiftsTotal: shifts.length,
      shiftsCompleted: shifts.filter((s) => s.status === 'completed').length,
      shiftsMissed: shifts.filter((s) => s.status === 'missed').length,
      shiftsCancelled: shifts.filter((s) => s.status === 'cancelled').length,
      visitsCount: visits.length,
      totalHours, totalPayroll, totalBilled, invoiceCount: invoices.length,
      visits,
    })
    setLoading(false)
  }
  useEffect(() => { run() }, []) // eslint-disable-line

  const exportVisitsCsv = () => {
    if (!stats) return
    const head = 'Client,Caregiver,Date,Hours,Pay rate,Pay amount\n'
    const rows = stats.visits.map((v) => [
      v.client_name, v.caregiver_name, fmtDate(v.clock_in_at), v.worked_hours, v.pay_rate, ((v.worked_hours || 0) * (v.pay_rate || 0)).toFixed(2),
    ].join(','))
    csvDownload(`gy-visits-${range.start}-to-${range.end}.csv`, head, rows)
  }

  return (
    <>
      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <Field label="From"><input type="date" value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} /></Field>
        <Field label="To"><input type="date" value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} /></Field>
        <button className="btn btn-primary" onClick={run} disabled={loading}>{loading ? 'Running…' : 'Run report'}</button>
      </div>

      {stats && (
        <>
          <h3 className="thread mt">Scheduling</h3>
          <div className="grid grid-4 mb">
            <div className="card card-pad stat"><div className="label">Total shifts</div><div className="value">{stats.shiftsTotal}</div></div>
            <div className="card card-pad stat"><div className="label">Completed</div><div className="value">{stats.shiftsCompleted}</div></div>
            <div className="card card-pad stat"><div className="label">Missed</div><div className="value">{stats.shiftsMissed}</div></div>
            <div className="card card-pad stat"><div className="label">Cancelled</div><div className="value">{stats.shiftsCancelled}</div></div>
          </div>

          <h3 className="thread mt">Payroll</h3>
          <div className="grid grid-4 mb">
            <div className="card card-pad stat"><div className="label">Visits completed</div><div className="value">{stats.visitsCount}</div></div>
            <div className="card card-pad stat"><div className="label">Total hours</div><div className="value">{stats.totalHours.toFixed(1)}</div></div>
            <div className="card card-pad stat"><div className="label">Estimated payroll</div><div className="value">${stats.totalPayroll.toFixed(2)}</div></div>
            <div className="card card-pad stat"><div className="label">&nbsp;</div><button className="btn btn-outline" onClick={exportVisitsCsv}>Export visits CSV</button></div>
          </div>

          <h3 className="thread mt">Billing</h3>
          <div className="grid grid-4 mb">
            <div className="card card-pad stat"><div className="label">Invoices generated</div><div className="value">{stats.invoiceCount}</div></div>
            <div className="card card-pad stat"><div className="label">Total billed</div><div className="value">${stats.totalBilled.toFixed(2)}</div></div>
          </div>
        </>
      )}
    </>
  )
}

/* ================= Caregiver performance ================= */

function PerformanceReport() {
  const [rows, setRows] = useState([])
  useEffect(() => {
    supabase.from('v_caregiver_performance').select('*').order('shifts_30d', { ascending: false })
      .then(({ data }) => setRows(data || []))
  }, [])

  const exportCsv = () => {
    const head = 'Caregiver,Shifts (30d),Late clock-ins,Missed clock-ins,ADL completion %\n'
    const body = rows.map((r) => [fullName(r), r.shifts_30d, r.late_clock_ins_30d, r.missed_clock_ins_30d, r.adl_completion_pct_30d].join(','))
    csvDownload(`gy-caregiver-performance-${new Date().toISOString().slice(0, 10)}.csv`, head, body)
  }

  return (
    <>
      <p className="muted">Trailing 30 days.</p>
      <button className="btn btn-outline mb" onClick={exportCsv}>Export CSV</button>
      <div className="card">
        {rows.length === 0 ? <Empty title="No data yet" /> : (
          <table className="data">
            <thead><tr><th>Caregiver</th><th className="num">Shifts</th><th className="num">Late clock-ins</th><th className="num">Missed clock-ins</th><th className="num">ADL completion</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.caregiver_id}>
                  <td><b>{fullName(r)}</b></td>
                  <td className="num">{r.shifts_30d}</td>
                  <td className="num">{r.late_clock_ins_30d > 0 ? <Pill kind="warn">{r.late_clock_ins_30d}</Pill> : 0}</td>
                  <td className="num">{r.missed_clock_ins_30d > 0 ? <Pill kind="bad">{r.missed_clock_ins_30d}</Pill> : 0}</td>
                  <td className="num">{r.adl_completion_pct_30d}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

/* ================= Authorization utilization ================= */

function AuthorizationReport() {
  const [rows, setRows] = useState([])
  useEffect(() => {
    supabase.from('v_authorization_utilization').select('*').order('last_name')
      .then(({ data }) => setRows(data || []))
  }, [])

  return (
    <>
      <p className="muted">This week's scheduled hours against each client's weekly authorization. Daily/monthly patterns show as N/A here — review those in the client's Operational tab.</p>
      <div className="card">
        {rows.length === 0 ? <Empty title="No clients with detailed authorization set up yet" /> : (
          <table className="data">
            <thead><tr><th>Client</th><th className="num">Authorized/week</th><th className="num">Scheduled this week</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const isWeekly = r.pattern === 'weekly'
                const over = isWeekly && r.scheduled_hours_this_week > r.authorized_hours_per_week
                return (
                  <tr key={r.client_id}>
                    <td><b>{fullName(r)}</b></td>
                    <td className="num">{isWeekly ? r.authorized_hours_per_week : 'N/A'}</td>
                    <td className="num">{r.scheduled_hours_this_week}</td>
                    <td>{!isWeekly ? <Pill kind="muted">{r.pattern}</Pill> : over ? <Pill kind="bad">Over</Pill> : <Pill kind="ok">Within limit</Pill>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

/* ================= Incident log ================= */

function IncidentLog() {
  const [rows, setRows] = useState([])
  const [clients, setClients] = useState([])
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ client_id: '', incident_type: 'other', description: '', occurred_at: '' })
  const [err, setErr] = useState('')

  const load = () => {
    supabase.from('incident_log').select('*, clients(first_name,last_name), caregivers(first_name,last_name)')
      .order('occurred_at', { ascending: false }).limit(100).then(({ data }) => setRows(data || []))
  }
  useEffect(() => {
    load()
    supabase.from('clients').select('id,first_name,last_name').eq('is_active', true).order('last_name').then(({ data }) => setClients(data || []))
  }, [])

  const save = async () => {
    setErr('')
    if (!f.client_id || !f.description.trim()) return setErr('Client and description are required.')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('incident_log').insert({
      client_id: f.client_id, incident_type: f.incident_type, description: f.description,
      occurred_at: f.occurred_at ? new Date(f.occurred_at).toISOString() : new Date().toISOString(),
      reported_by: user.id,
    })
    if (error) return setErr(error.message)
    setAdding(false); setF({ client_id: '', incident_type: 'other', description: '', occurred_at: '' }); load()
  }

  const resolve = async (id) => {
    await supabase.from('incident_log').update({ resolved: true }).eq('id', id)
    load()
  }

  const TYPE_KIND = { hospitalization: 'bad', fall: 'bad', medication_error: 'bad', injury: 'warn', behavioral: 'warn', other: 'muted' }

  return (
    <>
      <button className="btn btn-primary mb" onClick={() => setAdding(true)}>+ Log incident</button>
      <div className="card">
        {rows.length === 0 ? <Empty title="No incidents logged" /> : rows.map((r) => (
          <div key={r.id} className="alert-row">
            <div className={`alert-dot sev-${r.resolved ? 'info' : 'critical'}`} />
            <div style={{ flex: 1 }}>
              <Pill kind={TYPE_KIND[r.incident_type]}>{r.incident_type.replaceAll('_', ' ')}</Pill>
              <span className="muted"> · {fullName(r.clients)}</span>
              {r.caregivers && <span className="muted"> · reported by {fullName(r.caregivers)}</span>}
              <div style={{ fontSize: '.9rem' }}>{r.description}</div>
              <div className="muted" style={{ fontSize: '.76rem' }}>{fmtDate(r.occurred_at)}</div>
            </div>
            {r.resolved ? <Pill kind="ok">Resolved</Pill> : <button className="btn btn-outline" onClick={() => resolve(r.id)}>Mark resolved</button>}
          </div>
        ))}
      </div>

      {adding && (
        <Modal title="Log an incident" onClose={() => setAdding(false)} footer={
          <><button className="btn btn-quiet" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button></>
        }>
          {err && <p className="notice notice-bad">{err}</p>}
          <div className="form-row">
            <Field label="Client">
              <select value={f.client_id} onChange={(e) => setF({ ...f, client_id: e.target.value })}>
                <option value="">Select client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{fullName(c)}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select value={f.incident_type} onChange={(e) => setF({ ...f, incident_type: e.target.value })}>
                {['hospitalization', 'fall', 'medication_error', 'injury', 'behavioral', 'other'].map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}
              </select>
            </Field>
          </div>
          <Field label="When (leave blank for now)"><input type="datetime-local" value={f.occurred_at} onChange={(e) => setF({ ...f, occurred_at: e.target.value })} /></Field>
          <Field label="Description"><textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        </Modal>
      )}
    </>
  )
}
