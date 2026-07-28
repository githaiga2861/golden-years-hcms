import { useEffect, useState } from 'react'

/**
 * A bottom banner prompting office staff to install the main system as
 * an app, shown only on the web (not in an already-installed instance)
 * and only while the browser reports it's actually installable.
 * Dismissing it hides it for the rest of this browser session; it will
 * show again next time they sign in on the web, until installed.
 */
export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  )
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('gy-install-dismissed') === '1')

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed || !deferredPrompt || dismissed) return null

  const install = async () => {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    sessionStorage.setItem('gy-install-dismissed', '1')
    setDismissed(true)
  }

  return (
    <div style={{
      position: 'fixed', left: '50%', bottom: 20, transform: 'translateX(-50%)',
      zIndex: 300, background: 'var(--blue-ink)', color: '#fff', borderRadius: 14,
      padding: '.9rem 1.1rem', boxShadow: '0 10px 28px rgba(10,37,64,.4)',
      display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: 'calc(100% - 40px)',
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: '.92rem' }}>Install Golden Years HCMS</div>
        <div style={{ fontSize: '.8rem', opacity: .85 }}>Quick access from your desktop or home screen, no browser tabs needed.</div>
      </div>
      <button className="btn btn-gold" style={{ padding: '.5rem 1rem', fontSize: '.86rem', whiteSpace: 'nowrap' }} onClick={install}>
        Install
      </button>
      <button onClick={dismiss} aria-label="Dismiss" style={{
        background: 'none', border: 'none', color: '#fff', opacity: .6, cursor: 'pointer', fontSize: '1.1rem', padding: '0 .2rem',
      }}>×</button>
    </div>
  )
}
