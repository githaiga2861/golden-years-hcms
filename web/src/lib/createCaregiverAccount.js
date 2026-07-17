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
    // Supabase wraps non-2xx responses in a generic error; try to surface the real message.
    const detail = data?.error || error.context?.body?.error || error.message
    return { ok: false, error: detail }
  }
  if (data?.error) return { ok: false, error: data.error }
  return { ok: true, userId: data?.user_id }
}
