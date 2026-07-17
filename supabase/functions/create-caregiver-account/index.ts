// supabase/functions/create-caregiver-account/index.ts
//
// Securely creates a Supabase Auth user for a caregiver and links it to
// their caregivers row. The service role key never reaches the browser —
// it only exists here, on Supabase's server.
//
// Deploy with: supabase functions deploy create-caregiver-account

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, password, caregiver_id, full_name } = await req.json()
    if (!email || !password || !caregiver_id) {
      return new Response(JSON.stringify({ error: 'email, password, and caregiver_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Step 1: verify the caller is signed in and is office staff — using
    // THEIR OWN token (never the service role) so this respects RLS.
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
    const { data: callerProfile } = await callerClient.from('profiles').select('role').eq('id', caller.id).single()
    if (!callerProfile || !['admin', 'scheduler', 'coordinator'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Only office staff can create caregiver accounts.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Step 2: now — and only now — use the service role to actually create
    // the login. The on_auth_user_created trigger auto-creates their
    // profiles row with role='caregiver'.
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: full_name || email },
    })
    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { error: linkErr } = await adminClient.from('caregivers')
      .update({ profile_id: created.user.id }).eq('id', caregiver_id)
    if (linkErr) {
      return new Response(JSON.stringify({ error: linkErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ ok: true, user_id: created.user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
