import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTutorial } from '../context/TutorialContext'

const KEY = 'gy-tutorial-prompt-count'
const MAX_SHOWS = 5

function getCount() {
  const n = parseInt(localStorage.getItem(KEY) || '0', 10)
  return Number.isNaN(n) ? 0 : n
}
function bumpCount() {
  localStorage.setItem(KEY, String(getCount() + 1))
}

export default function TutorialPrompt() {
  const { session } = useAuth()
  const location = useLocation()
  const tutorial = useTutorial()
  const [show, setShow] = useState(false)
  const [handled, setHandled] = useState(false)

  useEffect(() => {
    if (!session || handled) return
    if (location.pathname !== '/') return
    if (getCount() >= MAX_SHOWS) return
    const t = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(t)
  }, [session, handled, location.pathname])

  const dismiss = (startTour) => {
    setShow(false)
    setHandled(true)
    bumpCount()
    if (startTour) tutorial?.start()
  }

  if (!show || tutorial?.running) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,37,64,.5)', display: 'grid', placeItems: 'center', zIndex: 9995, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 360, padding: '1.4rem', textAlign: 'center' }}>
        <svg className="tutorial-shake" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.6"
          style={{ margin: '0 auto .6rem' }}>
          <path d="M12 3v2M18.4 5.6l-1.4 1.4M21 12h-2M17 17l1.4 1.4M12 19v2M6.6 18.4l1.4-1.4M3 12h2M6.6 5.6L8 7" strokeLinecap="round" />
          <circle cx="12" cy="12" r="4" fill="var(--gold)" />
        </svg>
        <h3 style={{ margin: '0 0 .5rem' }}>New here? Take a quick tour</h3>
        <p className="muted" style={{ fontSize: '.88rem', margin: '0 0 1.1rem' }}>
          A guided walkthrough of every feature — clocking in, schedule, messages, updates, and more.
        </p>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button className="btn btn-quiet" style={{ flex: 1 }} onClick={() => dismiss(false)}>Skip</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => dismiss(true)}>Start tour</button>
        </div>
      </div>
    </div>
  )
}
