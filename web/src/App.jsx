import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Shell from './components/Shell'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Clients from './pages/Clients'
import Caregivers from './pages/Caregivers'
import Hours from './pages/Hours'
import Invoices from './pages/Invoices'
import Alerts from './pages/Alerts'
import Messages from './pages/Messages'
import Team from './pages/Team'
import Settings from './pages/Settings'

function Protected({ children }) {
  const { session, profile, loading, isOffice } = useAuth()
  if (loading) return <div className="auth-wrap"><p style={{ color: '#fff' }}>Loading…</p></div>
  if (!session) return <Navigate to="/login" replace />
  if (profile && !isOffice) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <h2>This is the office system</h2>
          <p className="muted">
            Your account is a caregiver account. Please use the <b>Golden Years Care App</b> instead —
            open the homepage and choose “Open &amp; install the Care App”.
          </p>
          <a className="btn btn-primary" href="/">Back to homepage</a>
        </div>
      </div>
    )
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<Protected><Shell /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="clients" element={<Clients />} />
            <Route path="caregivers" element={<Caregivers />} />
            <Route path="hours" element={<Hours />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="messages" element={<Messages />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
