import { supabase } from './supabase'

/**
 * Calls the create-caregiver-account Edge Function to securely create
 * a caregiver's Care App login and link it to their record. The service
 * role key that makes this possible lives only on Supabase's server —
 * never in this file, never in the browser.
 */
export async function createCaregiverAccount({ email, password, caregiverId, fullName }) {
  const { data, error } = await supabase.functions.invoke('create-caregiver-account', {
    body: { email, password, caregiver_id: caregiverId, full_name: fullName },
  })
  if (error) {
    // Supabase wraps non-2xx responses in a generic error — the real message is
    // in the response body, which requires an async .json() read to get at.
    let detail = error.message
    try {
      if (error.context && typeof error.context.json === 'function') {
        const body = await error.context.json()
        if (body?.error) detail = body.error
      }
    } catch {}
    return { ok: false, error: detail }
  }
  if (data?.error) return { ok: false, error: data.error }
  return { ok: true, userId: data?.user_id }
}
