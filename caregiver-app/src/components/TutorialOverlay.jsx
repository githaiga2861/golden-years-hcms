import { useEffect, useState } from 'react'
import { useTutorial } from '../context/TutorialContext'

export default function TutorialOverlay() {
  const tutorial = useTutorial()
  const [rect, setRect] = useState(null)

  const { running, currentStep, stepIndex, totalSteps, next, back, stop } = tutorial || {}

  useEffect(() => {
    if (!running) { setRect(null); return }
    let cancelled = false

    const locate = () => {
      if (cancelled) return
      if (!currentStep?.target) { setRect(null); return }
      const el = document.querySelector(`[data-tutorial="${currentStep.target}"]`)
      if (!el) { setRect(null); return }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('tutorial-shake')
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      return () => el.classList.remove('tutorial-shake')
    }

    // Give the page a beat to render/navigate before measuring
    const t = setTimeout(locate, 350)
    const onResize = () => locate()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      cancelled = true
      clearTimeout(t)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
      document.querySelectorAll('.tutorial-shake').forEach((el) => el.classList.remove('tutorial-shake'))
    }
  }, [running, currentStep, stepIndex])

  if (!running || !currentStep) return null

  const pad = 8

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9990 }}>
      {/* Dimmed backdrop, blocks interaction with the real app during the tour */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,37,64,.6)' }} />

      {/* Spotlight ring around the highlighted element */}
      {rect && (
        <div style={{
          position: 'absolute',
          top: rect.top - pad, left: rect.left - pad,
          width: rect.width + pad * 2, height: rect.height + pad * 2,
          borderRadius: 14, boxShadow: '0 0 0 4px var(--gold), 0 0 0 9999px rgba(10,37,64,.6)',
          background: 'transparent', pointerEvents: 'none', transition: 'all .3s ease',
        }} />
      )}

      {/* Caption card */}
      <div style={{
        position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)', maxWidth: 360, background: '#fff', borderRadius: 16,
        padding: '1rem 1.1rem', boxShadow: '0 12px 32px rgba(10,37,64,.35)',
      }}>
        <div className="muted" style={{ fontSize: '.72rem', fontWeight: 700, marginBottom: '.3rem' }}>
          STEP {stepIndex + 1} OF {totalSteps}
        </div>
        <h3 style={{ margin: '0 0 .4rem', fontSize: '1.02rem' }}>{currentStep.title}</h3>
        <p style={{ margin: '0 0 .9rem', fontSize: '.88rem', lineHeight: 1.4 }}>{currentStep.text}</p>
        <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
          <button className="btn btn-quiet" style={{ padding: '.4rem .6rem', fontSize: '.82rem' }} onClick={stop}>Skip tour</button>
          <div style={{ flex: 1 }} />
          {stepIndex > 0 && <button className="btn btn-outline" style={{ padding: '.4rem .8rem', fontSize: '.86rem' }} onClick={back}>Back</button>}
          <button className="btn btn-primary" style={{ padding: '.4rem .9rem', fontSize: '.86rem' }} onClick={next}>
            {stepIndex + 1 === totalSteps ? 'Finish' : 'Next'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 3, marginTop: '.7rem' }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIndex ? 'var(--blue)' : 'var(--line)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
