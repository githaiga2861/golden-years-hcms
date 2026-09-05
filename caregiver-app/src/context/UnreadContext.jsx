import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const UnreadContext = createContext(null)

export function UnreadProvider({ children }) {
  const { caregiver, session } = useAuth()
  const [unreadUpdates, setUnreadUpdates] = useState(0)
  const [unreadMsg, setUnreadMsg] = useState(0)
  const [unreadNotifs, setUnreadNotifs] = useState(0)

  const recheckUpdates = useCallback(async () => {
    if (!caregiver) return
    const [a, b] = await Promise.all([
      supabase.from('v_caregiver_unread_updates').select('id', { count: 'exact', head: true }).eq('caregiver_id', caregiver.id),
      supabase.from('caregiver_notifications').select('id', { count: 'exact', head: true }).eq('caregiver_id', caregiver.id).is('read_at', null),
    ])
    setUnreadUpdates((a.count || 0) + (b.count || 0))
  }, [caregiver])

  const recheckMsg = useCallback(async () => {
    // Use the signed-in user id directly. Falling back to an empty string
    // here (as this once did) makes Postgres compare a uuid against '',
    // which errors out and leaves the badge showing a stale count.
    const uid = session?.user?.id
    if (!caregiver || !uid) return
    const { data: threads } = await supabase.from('message_threads').select('id').eq('caregiver_id', caregiver.id)
    const ids = (threads || []).map((t) => t.id)
    if (ids.length === 0) { setUnreadMsg(0); return }
    const { count } = await supabase.from('messages').select('id', { count: 'exact', head: true })
      .in('thread_id', ids).is('read_at', null).is('deleted_at', null).neq('sender_id', uid)
    setUnreadMsg(count || 0)
  }, [caregiver, session?.user?.id])

  const recheckNotifs = useCallback(async () => {
    if (!caregiver) return
    const { count } = await supabase.from('push_notifications_log')
      .select('id', { count: 'exact', head: true }).eq('caregiver_id', caregiver.id).is('read_at', null)
    setUnreadNotifs(count || 0)
  }, [caregiver])

  const recheckAll = useCallback(() => {
    recheckUpdates(); recheckMsg(); recheckNotifs()
  }, [recheckUpdates, recheckMsg, recheckNotifs])

  // Initial load plus a slow safety poll. The realtime subscription below
  // does the real work; the poll only covers a dropped socket.
  useEffect(() => {
    if (!caregiver) return
    recheckAll()
    const t = setInterval(recheckAll, 60000)
    return () => clearInterval(t)
  }, [caregiver, recheckAll])

  // Recount the instant anything that feeds a badge changes, so reading a
  // message drops both counts straight away instead of on the next poll.
  useEffect(() => {
    if (!caregiver) return
    const ch = supabase.channel(`unread-${caregiver.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, recheckMsg)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'push_notifications_log' }, recheckNotifs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caregiver_notifications' }, recheckUpdates)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'update_reads' }, recheckUpdates)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_updates' }, recheckUpdates)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [caregiver, recheckMsg, recheckNotifs, recheckUpdates])

  // Coming back to the app from the background should show current numbers.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') recheckAll() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [recheckAll])

  return (
    <UnreadContext.Provider value={{ unreadUpdates, unreadMsg, unreadNotifs, recheckUpdates, recheckMsg, recheckNotifs, recheckAll }}>
      {children}
    </UnreadContext.Provider>
  )
}

export const useUnread = () => useContext(UnreadContext)
