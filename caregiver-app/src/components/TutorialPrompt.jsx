import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTutorial } from '../context/TutorialContext'
import { supabase } from '../lib/supabase'

export default function TutorialPrompt() {
  const { caregiver } = useAuth()
  const tutorial = useTutorial()
  const [show, setShow] = useState(false)
  const [handled, setHandled] = useState(false)

  useEffect(() => {
    if (!caregiver || handled) return
    if (caregiver.login_count >= 5) return
    const t = setTimeout(() => setShow(true), 5000)
    return () => clearTimeout(t)
  }, [caregiver, handled])

  const dismiss = async (startTour) => {
    setShow(false)
    setHandled(true)
    if (caregiver) {
      await supabase.from('caregivers').update({ login_count: (caregiver.login_count || 0) + 1 }).eq('id', caregiver.id)
    }
    if (startTour) tutorial?.start()
  }

  if (!show || tutorial?.running) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,37,64,.5)', display: 'grid', placeItems: 'center', zIndex: 9995, padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 360, padding: '1.4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.2rem', marginBottom: '.4rem' }}>👋</div>
        <h3 style={{ margin: '0 0 .5rem' }}>New here? Take a quick tour</h3>
        <p className="muted" style={{ fontSize: '.88rem', margin: '0 0 1.1rem' }}>
          A 3-minute walkthrough of every feature — clocking in, messages, updates, and more.
        </p>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button className="btn btn-quiet" style={{ flex: 1 }} onClick={() => dismiss(false)}>Skip</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => dismiss(true)}>Start tour</button>
        </div>
      </div>
    </div>
  )
}
