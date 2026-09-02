// supabase/functions/caregiver-change-own-password/index.ts
//
// Lets a caregiver change their own Care App password. Routed through
// the server (rather than a direct client-side auth.updateUser call) so
// the office's encrypted login-secret copy stays in sync automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { current_password, new_password } = await req.json()
    if (!current_password || !new_password) {
      return new Response(JSON.stringify({ error: 'Current and new password are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (new_password.length < 8) {
      return new Response(JSON.stringify({ error: 'New password must be at least 8 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Verify the current password is correct before changing anything.
    const verifyClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '')
    const { error: verifyErr } = await verifyClient.auth.signInWithPassword({ email: caller.email!, password: current_password })
    if (verifyErr) {
      return new Response(JSON.stringify({ error: 'Your current password is incorrect.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(caller.id, { password: new_password })
    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Keep the encrypted login-secret copy in sync, for the Emails page.
    const { data: cg } = await adminClient.from('caregivers').select('id').eq('profile_id', caller.id).maybeSingle()
    if (cg?.id) {
      await adminClient.rpc('upsert_caregiver_login_secret', {
        p_caregiver_id: cg.id, p_email: caller.email, p_password: new_password, p_is_admin_set: false,
      })
    }

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
