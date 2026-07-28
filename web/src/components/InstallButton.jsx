import { useEffect, useState } from 'react'

/**
 * "Install App" button for the main (office) system. Shows up whenever
 * the browser reports the site is installable and it isn't installed
 * yet; disappears the moment it's installed (or if already running as
 * an installed app).
 */
export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  )

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

  if (installed || !deferredPrompt) return null

  const install = async () => {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
  }

  return (
    <button className="btn btn-gold" style={{ padding: '.45rem .9rem', fontSize: '.86rem' }} onClick={install}>
      + Install App
    </button>
  )
}
