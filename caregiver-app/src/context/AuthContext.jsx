import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [caregiver, setCaregiver] = useState(null)   // caregivers row linked to this login
  const [loading, setLoading] = useState(true)
  const [lookupError, setLookupError] = useState(null) // TEMP diagnostic

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
      .then(({ data, error }) => {
        setCaregiver(data)
        setLookupError(error ? `${error.code || ''} ${error.message || ''}`.trim() : (data ? null : `no row for profile_id=${session.user.id}`))
        setLoading(false)
      })
  }, [session])

  return (
    <Ctx.Provider value={{
      session, caregiver, loading, isConfigured, lookupError,
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signOut: () => supabase.auth.signOut(),
    }}>{children}</Ctx.Provider>
  )
}
