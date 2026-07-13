import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

const OFFICE_ROLES = ['admin', 'scheduler', 'coordinator']

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setProfile(null); return }
    let live = true
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { if (live) { setProfile(data); setLoading(false) } })
    return () => { live = false }
  }, [session])

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  const isOffice = profile && OFFICE_ROLES.includes(profile.role)

  return (
    <AuthCtx.Provider value={{ session, profile, loading, signIn, signOut, isOffice, isConfigured }}>
      {children}
    </AuthCtx.Provider>
  )
}
