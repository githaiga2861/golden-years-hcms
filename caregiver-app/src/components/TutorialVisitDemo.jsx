import { useState } from 'react'
import { DEMO_CLIENT, DEMO_PLAN_TASKS } from '../lib/tutorialDemoData'

// A safe, static stand-in for the real Visit page, shown only while the
// tutorial is running. Nothing here touches the database or real GPS —
// it exists purely so every feature can be demonstrated without risk.
export default function TutorialVisitDemo() {
  const [journeyChoice] = useState('directions')
  const [journeyStarted, setJourneyStarted] = useState(true)
  const [tasks, setTasks] = useState(DEMO_PLAN_TASKS)
  const [notes, setNotes] = useState('')
  const [mileage, setMileage] = useState('4.2')

  const toggleTask = (id) => setTasks((t) => t.map((x) => x.id === id ? { ...x, completed: !x.completed } : x))

  return (
    <>
      <h1 style={{ marginBottom: 0 }}>{DEMO_CLIENT.first_name} {DEMO_CLIENT.last_name}</h1>
      <p className="muted" style={{ marginTop: 0 }}>{DEMO_CLIENT.address}, {DEMO_CLIENT.city}</p>

      {journeyChoice === 'directions' && !journeyStarted && (
        <div className="card" data-tutorial="today-directions-prompt" style={{ background: 'var(--paper)', marginBottom: '.8rem' }}>
          <p style={{ margin: '0 0 .6rem', fontWeight: 600 }}>Do you need directions to {DEMO_CLIENT.first_name}'s home, or are you already there?</p>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn btn-outline" style={{ flex: 1 }}>I need directions</button>
            <button className="btn btn-primary" style={{ flex: 1 }}>I'm already here</button>
          </div>
        </div>
      )}

      <div className="card" data-tutorial="today-start-journey" style={{ background: 'var(--paper)', marginBottom: '.8rem' }}>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setJourneyStarted(true)}>▶ Start journey</button>
        <p className="muted" style={{ fontSize: '.8rem', marginTop: '.5rem', marginBottom: 0 }}>
          This records your starting point so mileage can be calculated for compensation, then opens directions in your maps app.
        </p>
      </div>

      <div data-tutorial="today-geofence-note">
        <p className="notice notice-ok" style={{ marginBottom: '.8rem' }}>Journey started — directions opened in your maps app. Come back here and clock in once you arrive.</p>
      </div>

      <button className="btn btn-clockin" data-tutorial="today-clockin-btn">▶ Start visit (clock in)</button>
      <p className="gps-line muted">Your location is required and checked at clock-in to confirm you're at the client's home.</p>

      <div className="card" data-tutorial="visit-adl-list" style={{ marginTop: '1rem' }}>
        <h3>Care plan tasks</h3>
        {tasks.map((t) => (
          <div key={t.id} data-tutorial={t.id === 'demo-task-1' ? 'visit-adl-item' : undefined}
            className="shift-line" style={{ padding: '.5rem 0', cursor: 'pointer' }} onClick={() => toggleTask(t.id)}>
            <input type="checkbox" checked={t.completed} readOnly style={{ marginRight: '.6rem' }} />
            <div style={{ flex: 1 }}>
              <b>{t.label}</b>
              {t.instructions && <div className="muted" style={{ fontSize: '.82rem' }}>{t.instructions}</div>}
            </div>
            <span className="pill pill-muted">{t.category}</span>
          </div>
        ))}
      </div>

      <div className="card" data-tutorial="visit-notes" style={{ marginTop: '1rem' }}>
        <h3>Visit notes</h3>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth noting about this visit…" />
      </div>

      <div className="card" data-tutorial="visit-mileage-card" style={{ marginTop: '1rem' }}>
        <h3>Mileage</h3>
        <p className="notice notice-ok" style={{ fontSize: '.84rem' }}>Auto-calculated from your route: 4.2 mi</p>
        <div className="form-row">
          <div className="field"><label>Miles driven for this visit</label>
            <input type="number" step="0.1" value={mileage} onChange={(e) => setMileage(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card" data-tutorial="visit-signature-section" style={{ marginTop: '1rem' }}>
        <h3>Signatures</h3>
        <p className="muted" style={{ fontSize: '.86rem' }}>Both you and the client (or their family) sign here to confirm the visit.</p>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <div style={{ flex: 1, height: 80, border: '1px dashed var(--line)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
            <span className="muted" style={{ fontSize: '.8rem' }}>Caregiver signature</span>
          </div>
          <div style={{ flex: 1, height: 80, border: '1px dashed var(--line)', borderRadius: 8, display: 'grid', placeItems: 'center' }}>
            <span className="muted" style={{ fontSize: '.8rem' }}>Client signature</span>
          </div>
        </div>
      </div>

      <button className="btn btn-primary" data-tutorial="visit-clockout-btn" style={{ width: '100%', marginTop: '1rem' }}>■ Clock out</button>
    </>
  )
}
