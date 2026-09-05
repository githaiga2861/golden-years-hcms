import { useEffect, useRef } from 'react'
import { supabase } from './supabase'

// The tables whose changes should make an open page re-fetch. Messaging is
// handled separately by useMessageRealtime, which updates in place instead
// of remounting the page.
const WATCHED = [
  'shifts',
  'visits',
  'clients',
  'caregivers',
  'client_updates',
  'alerts',
  'caregiver_availability',
  'caregiver_time_off',
  'caregiver_credentials',
  'invoices',
]

/**
 * Keeps whatever page is open in step with the database, so two people
 * working at once see each other's changes without pressing refresh.
 *
 * Deliberately conservative about *when* it refreshes: refreshing
 * remounts the page, so doing it while someone is typing or has a modal
 * open would throw away their work. In those cases the refresh is held
 * until they're done rather than dropped.
 */
export function useAutoRefresh(refresh) {
  const pendingRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const isBusy = () => {
      // A modal is open — never yank it out from under them.
      if (document.querySelector('.overlay')) return true
      // They're typing somewhere.
      const el = document.activeElement
      if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return true
      return false
    }

    const tryRefresh = () => {
      if (isBusy()) { pendingRef.current = true; return }
      pendingRef.current = false
      refresh()
    }

    const schedule = () => {
      // Debounce: a bulk change (like sending to a group) fires many
      // events at once, and we only want one refresh out of it.
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(tryRefresh, 1200)
    }

    const channel = supabase.channel('auto-refresh')
    for (const table of WATCHED) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, schedule)
    }
    channel.subscribe()

    // If a refresh was held back because they were busy, apply it as soon
    // as they finish rather than making them wonder why it's stale.
    const onIdle = () => { if (pendingRef.current && !isBusy()) tryRefresh() }
    document.addEventListener('focusout', onIdle)
    document.addEventListener('click', onIdle)

    return () => {
      clearTimeout(timerRef.current)
      supabase.removeChannel(channel)
      document.removeEventListener('focusout', onIdle)
      document.removeEventListener('click', onIdle)
    }
  }, [refresh])
}
