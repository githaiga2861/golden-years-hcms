// supabase/functions/get-caregiver-login-secret/index.ts
//
// Decrypts and returns a caregiver's current Care App login email +
// password, for pre-filling the "share download link" email draft on
// the office's Emails page. Office staff only.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { caregiver_id } = await req.json()
    if (!caregiver_id) {
      return new Response(JSON.stringify({ error: 'caregiver_id is required' }),
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
    const { data: callerProfile } = await callerClient.from('profiles').select('role').eq('id', caller.id).single()
    if (!callerProfile || !['admin', 'scheduler', 'coordinator'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Only office staff can view caregiver login details.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const { data: secret } = await adminClient.from('caregiver_login_secrets').select('email').eq('caregiver_id', caregiver_id).maybeSingle()
    if (!secret) {
      return new Response(JSON.stringify({ error: 'No login on file for this caregiver yet.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: password } = await adminClient.rpc('decrypt_caregiver_login_secret', { p_caregiver_id: caregiver_id })

    return new Response(JSON.stringify({ ok: true, email: secret.email, password }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
