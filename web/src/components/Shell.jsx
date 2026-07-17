import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRefresh } from '../context/RefreshContext'
import logo from '../assets/logo.png'
import { supabase } from '../lib/supabase'

const NAV = [
  ['/app', 'Dashboard', '⌂', true],
  ['/app/schedule', 'Schedule', '▦'],
  ['/app/clients', 'Clients', '♥'],
  ['/app/caregivers', 'Caregivers', '✦'],
  ['/app/hours', 'Verified Hours', '✓'],
  ['/app/invoices', 'Invoices', '¤'],
  ['/app/alerts', 'Alerts', '!'],
  ['/app/reports', 'Reports', '▤'],
  ['/app/messages', 'Messages', '✉'],
  ['/app/team', 'Team & Roles', '⚑'],
  ['/app/settings', 'Settings', '⚙'],
]

export default function Shell() {
  const { profile, signOut } = useAuth()
  const nav = useNavigate()
  const { tick, spinning, refresh } = useRefresh()
  const [openAlerts, setOpenAlerts] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)

  useEffect(() => {
    let live = true
    const load = () =>
      supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('resolved', false)
        .then(({ count }) => live && setOpenAlerts(count || 0))
    load()
    const t = setInterval(load, 60000)
    return () => { live = false; clearInterval(t) }
  }, [])

  useEffect(() => {
    let live = true
    const load = () =>
      supabase.from('v_office_unread_messages').select('id', { count: 'exact', head: true })
        .then(({ count }) => live && setUnreadMsgs(count || 0))
    load()
    const t = setInterval(load, 30000)
    return () => { live = false; clearInterval(t) }
  }, [])

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-mark" src={logo} alt="Golden Years" />
          <div>Golden Years<br /><span style={{ fontWeight: 500, fontSize: '.72rem', opacity: .8 }}>Home Care Management</span></div>
        </div>
        <nav>
          {NAV.map(([to, label, icon, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span aria-hidden="true">{icon}</span> {label}
              {label === 'Alerts' && openAlerts > 0 && <span className="badge">{openAlerts}</span>}
              {label === 'Messages' && unreadMsgs > 0 && <span className="badge">{unreadMsgs}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="foot">
          <div style={{ color: '#fff', fontWeight: 600 }}>{profile?.full_name}</div>
          <div style={{ opacity: .75, textTransform: 'capitalize' }}>{profile?.role}</div>
          <button className="btn btn-quiet" style={{ padding: '.3rem .5rem', marginTop: '.4rem', color: '#b9cde2' }}
            onClick={async () => { await signOut(); nav('/') }}>Sign out</button>
        </div>
      </aside>
      <main className="main"><Outlet key={tick} /></main>
      <button
        onClick={refresh}
        aria-label="Refresh this page"
        title="Refresh this page"
        style={{
          position: 'fixed', bottom: '1.6rem', right: '1.6rem', zIndex: 200,
          width: 52, height: 52, borderRadius: '50%', border: 'none',
          background: 'var(--blue-ink)', color: '#fff', cursor: 'pointer',
          display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(10,37,64,.35)',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'transform .6s ease', transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)' }}>
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <polyline points="21 3 21 9 15 9" />
        </svg>
      </button>
    </div>
  )
}
