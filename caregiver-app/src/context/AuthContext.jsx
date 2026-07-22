import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [caregiver, setCaregiver] = useState(null)   // caregivers row linked to this login
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
    if (!session) { setCaregiver(null); return }
    supabase.from('caregivers').select('*').eq('profile_id', session.user.id).maybeSingle()
      .then(({ data }) => { setCaregiver(data); setLoading(false) })
  }, [session])

  return (
    <Ctx.Provider value={{
      session, caregiver, loading, isConfigured,
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signOut: () => supabase.auth.signOut(),
    }}>{children}</Ctx.Provider>
  )
}
