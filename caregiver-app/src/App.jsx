import { BrowserRouter, Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { startSyncLoop, pendingCount } from './lib/offline'
import { supabase } from './lib/supabase'
import logo from './assets/logo.png'
import Login from './pages/Login'
import Today from './pages/Today'
import Week from './pages/Week'
import Visit from './pages/Visit'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'

const SunIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
const GridIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
const BellIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
const UserIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>

function Frame() {
  const { caregiver } = useAuth()
  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(pendingCount())
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    startSyncLoop((left) => setPending(left))
    const on = () => { setOnline(true); setPending(pendingCount()) }
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    const t = setInterval(() => setPending(pendingCount()), 8000)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); clearInterval(t) }
  }, [])

  useEffect(() => {
    if (!caregiver) return
    let live = true
    const check = () =>
      supabase.from('v_caregiver_unread_updates').select('id', { count: 'exact', head: true })
        .eq('caregiver_id', caregiver.id).then(({ count }) => live && setUnread(count || 0))
    check()
    const t = setInterval(check, 60000)
    return () => { live = false; clearInterval(t) }
  }, [caregiver])

  return (
    <div className="app">
      <header className="topbar">
        <img className="brand-mark" src={logo} alt="Golden Years" />
        <b>Golden Years Care</b>
        {!online && <span className="offline-pill">Offline — saving on phone</span>}
        {online && pending > 0 && <span className="sync-pill">Syncing {pending}…</span>}
      </header>
      <main className="content"><Outlet /></main>
      <nav className="tabbar">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}><span className="ic">{SunIcon}</span>Today</NavLink>
        <NavLink to="/week" className={({ isActive }) => isActive ? 'active' : ''}><span className="ic">{GridIcon}</span>Schedule</NavLink>
        <NavLink to="/updates" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="ic">{BellIcon}</span>Updates{unread > 0 && <span className="badge" style={{ marginLeft: 4 }}>{unread}</span>}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}><span className="ic">{UserIcon}</span>Profile</NavLink>
      </nav>
    </div>
  )
}

function Gate({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="auth-wrap"><p style={{ color: '#fff' }}>Loading…</p></div>
  if (!session) return <Login />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Gate><Frame /></Gate>}>
            <Route path="/" element={<Today />} />
            <Route path="/week" element={<Week />} />
            <Route path="/visit/:shiftId" element={<Visit />} />
            <Route path="/updates" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
