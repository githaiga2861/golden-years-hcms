/* ============================================================
   Offline action queue.
   Clock in/out, task toggles, and notes written without signal are
   stored in localStorage and replayed (in order) when connectivity
   returns. Database RPCs are idempotent, so replays are safe.
   ============================================================ */
import { supabase } from './supabase'

const KEY = 'gy-care-queue-v1'

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
const write = (q) => localStorage.setItem(KEY, JSON.stringify(q))

export const pendingCount = () => read().length

export function enqueue(action) {
  const q = read()
  q.push({ ...action, queued_at: new Date().toISOString() })
  write(q)
}

let syncing = false
export async function syncQueue(onProgress) {
  if (syncing || !navigator.onLine || !supabase) return
  syncing = true
  try {
    let q = read()
    let i = 0
    while (i < q.length) {
      const a = q[i]
      const ok = await run(a)
      if (ok) {
        q.splice(i, 1)
        write(q)
        onProgress?.(q.length)
        continue // re-check the new item now at this index
      }
      // Failed — count the retry. After 5 failed attempts (across sync
      // cycles), this item is permanently broken (e.g. references a
      // shift or account that no longer exists) — drop it so it can
      // never block the rest of the queue again.
      a.retry_count = (a.retry_count || 0) + 1
      if (a.retry_count >= 5) {
        console.warn('Dropping permanently-failing offline action:', a)
        q.splice(i, 1)
        write(q)
        onProgress?.(q.length)
        continue
      }
      write(q)
      i++ // move past this one for now, keep trying the rest
    }
  } finally { syncing = false }
}

async function run(a) {
  try {
    if (a.type === 'clock_in') {
      const { error } = await supabase.rpc('clock_in', {
        p_shift_id: a.shift_id, p_lat: a.lat, p_lng: a.lng, p_at: a.at, p_offline: true,
      })
      return !error
    }
    if (a.type === 'clock_out') {
      // The visit may itself have been created offline: look it up by shift.
      const { data: v } = await supabase.from('visits').select('id').eq('shift_id', a.shift_id).maybeSingle()
      if (!v) return false
      const { error } = await supabase.rpc('clock_out', {
        p_visit_id: v.id, p_lat: a.lat, p_lng: a.lng, p_at: a.at, p_offline: true,
      })
      return !error
    }
    if (a.type === 'task') {
      const { error } = await supabase.from('visit_tasks').update({
        completed: a.completed, skipped_reason: a.skipped_reason || null,
        completed_at: a.completed ? a.at : null,
      }).eq('id', a.task_id)
      return !error
    }
    if (a.type === 'note') {
      const { data: v } = await supabase.from('visits').select('id').eq('shift_id', a.shift_id).maybeSingle()
      if (!v) return false
      const { error } = await supabase.from('visit_notes').insert({
        visit_id: v.id, author_id: a.author_id, body: a.body,
      })
      return !error
    }
    if (a.type === 'geofence_block') {
      const { error } = await supabase.from('alerts').insert({
        alert_type: 'other', severity: 'critical', message: a.message,
        shift_id: a.shift_id, client_id: a.client_id, caregiver_id: a.caregiver_id,
      })
      return !error
    }
    return true // unknown action: drop it rather than block the queue
  } catch { return false }
}

/** Wire up automatic syncing. Call once at app start. */
export function startSyncLoop(onProgress) {
  window.addEventListener('online', () => syncQueue(onProgress))
  setInterval(() => syncQueue(onProgress), 45000)
  syncQueue(onProgress)
}
