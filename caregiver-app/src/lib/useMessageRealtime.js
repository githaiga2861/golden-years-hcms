import { useEffect, useRef } from 'react'
import { supabase } from './supabase'

/**
 * Subscribes to live message changes so both sides of a conversation stay
 * in sync without polling.
 *
 * `onInsert` fires for brand-new messages, `onUpdate` for edits, unsends,
 * and read/delivery receipt changes. Both apps use this same hook so the
 * behaviour can't drift between them.
 *
 * Delivery receipts are marked here rather than in the UI: the moment a
 * device actually receives a message over the socket, it calls back to
 * stamp delivered_at. That makes "Delivered" a true signal — it means the
 * recipient's device really had it — rather than a guess based on the
 * sender's own send succeeding.
 */
export function useMessageRealtime({ userId, onInsert, onUpdate, onThreadChange }) {
  // Keep the latest callbacks in refs so re-renders don't tear down and
  // rebuild the subscription on every keystroke.
  const insertRef = useRef(onInsert)
  const updateRef = useRef(onUpdate)
  const threadRef = useRef(onThreadChange)
  useEffect(() => { insertRef.current = onInsert }, [onInsert])
  useEffect(() => { updateRef.current = onUpdate }, [onUpdate])
  useEffect(() => { threadRef.current = onThreadChange }, [onThreadChange])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`messages-live-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const m = payload.new
        // Someone else's message just landed on this device — that is
        // exactly what "delivered" means, so stamp it.
        if (m.sender_id !== userId && !m.delivered_at) {
          try { await supabase.rpc('mark_message_delivered', { p_message_id: m.id }) } catch { /* best effort */ }
        }
        insertRef.current?.(m)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        updateRef.current?.(payload.new)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_threads' }, (payload) => {
        threadRef.current?.(payload)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])
}
