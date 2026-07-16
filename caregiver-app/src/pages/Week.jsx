import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const fmtT = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const fmtHrs = (h) => `${h.toFixed(2)} h`

export default function Week() {
  const { caregiver } = useAuth()
  const [tab, setTab] = useState('upcoming')
  const [shifts, setShifts] = useState([])
  const [pastVisits, setPastVisits] = useState([])

  useEffect(() => {
    if (!caregiver) return
    const d0 = new Date(); d0.setHours(0, 0, 0, 0)
    const d1 = new Date(d0); d1.setDate(d1.getDate() + 14)
    supabase.from('shifts')
      .select('*, clients(first_name,last_name,city)')
      .eq('caregiver_id', caregiver.id)
      .gte('starts_at', d0.toISOString()).lt('starts_at', d1.toISOString())
      .order('starts_at')
      .then(({ data }) => setShifts(data || []))
  }, [caregiver])

  useEffect(() => {
    if (!caregiver || tab !== 'past') return
    supabase.from('v_visit_ledger').select('*')
      .eq('caregiver_id', caregiver.id).not('clock_out_at', 'is', null)
      .order('clock_in_at', { ascending: false }).limit(60)
      .then(({ data }) => setPastVisits(data || []))
  }, [caregiver, tab])

  const groups = shifts.reduce((acc, s) => {
    const k = new Date(s.starts_at).toDateString()
    ;(acc[k] = acc[k] || []).push(s)
    return acc
  }, {})

  const weekStart = new Date(); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const thisWeek = pastVisits.filter((v) => new Date(v.clock_in_at) >= weekStart)
  const weekTotal = thisWeek.reduce((sum, v) => sum + (v.worked_hours || 0), 0)
  const weekVerified = thisWeek.filter((v) => v.verified).length

  return (
    <>
      <h1>Your schedule</h1>
      <div className="toolbar mb" style={{ display: 'flex', gap: '.5rem' }}>
        <button className={`btn ${tab === 'upcoming' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setTab('upcoming')}>Upcoming</button>
        <button className={`btn ${tab === 'past' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }} onClick={() => setTab('past')}>Past visits & hours</button>
      </div>

      {tab === 'upcoming' && (
        <>
          <p className="muted" style={{ marginTop: 0 }}>Next two weeks, exactly as the office set it up.</p>
          {Object.keys(groups).length === 0 && (
            <div className="empty"><h3>No upcoming visits</h3><p>New shifts will appear here when the office schedules you.</p></div>
          )}
          {Object.entries(groups).map(([day, list]) => (
            <div key={day} className="card">
              <h3>{new Date(day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
              {list.map((s) => (
                <Link key={s.id} to={`/visit/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="shift-line">
                    <div className="timebox"><b>{fmtT(s.starts_at)}</b><span>to {fmtT(s.ends_at)}</span></div>
                    <div style={{ flex: 1 }}>
                      <b>{s.clients.first_name} {s.clients.last_name}</b>
                      <div className="muted" style={{ fontSize: '.82rem' }}>{s.service_type}{s.clients.city ? ` · ${s.clients.city}` : ''}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </>
      )}

      {tab === 'past' && (
        <>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="muted" style={{ fontSize: '.8rem' }}>This week so far</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{fmtHrs(weekTotal)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="pill pill-ok">{weekVerified} verified</span>{' '}
              {thisWeek.length - weekVerified > 0 && <span className="pill pill-warn">{thisWeek.length - weekVerified} pending</span>}
            </div>
          </div>
          <p className="muted" style={{ fontSize: '.82rem' }}>
            "Verified" means the office has confirmed this visit and it's ready for payroll. Actual pay timing depends on the office's payroll schedule.
          </p>
          {pastVisits.length === 0 && (
            <div className="empty"><h3>No past visits yet</h3><p>Completed visits will appear here with your hours.</p></div>
          )}
          {pastVisits.map((v) => (
            <div key={v.visit_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b>{v.client_name}</b>
                <div className="muted" style={{ fontSize: '.82rem' }}>
                  {new Date(v.clock_in_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {fmtT(v.clock_in_at)}–{fmtT(v.clock_out_at)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>{fmtHrs(v.worked_hours || 0)}</div>
                {v.verified ? <span className="pill pill-ok">Verified</span> : <span className="pill pill-warn">Pending</span>}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  )
}
