// supabase/functions/send-push-notification/index.ts
//
// Sends a push notification to one caregiver's device(s) via Firebase
// Cloud Messaging, and logs it so the notification bell can show it.
// Called by Database Webhooks (new message, new update, new shift) and
// by the Android build workflow (new app version).
//
// Deploy with: supabase functions deploy send-push-notification
// Requires these secrets (set via `supabase secrets set`):
//   FIREBASE_SERVICE_ACCOUNT_JSON — the full service account JSON, as one line
//   PUSH_WEBHOOK_SECRET — any random string, shared with the webhook caller

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as jose from 'https://esm.sh/jose@5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30000) return cachedToken.token

  const sa = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON') ?? '{}')
  const privateKey = await jose.importPKCS8(sa.private_key, 'RS256')

  const jwt = await new jose.SignJWT({
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const data = await res.json()
  if (!data.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(data)}`)

  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 }
  return cachedToken.token
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const secret = req.headers.get('x-webhook-secret')
    if (secret !== Deno.env.get('PUSH_WEBHOOK_SECRET')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { caregiver_id, kind, title, body, page } = await req.json()
    if (!caregiver_id || !kind || !title) {
      return new Response(JSON.stringify({ error: 'caregiver_id, kind, and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Always log it, so the bell shows it even if the device push fails
    // (app closed, token stale, no signal, etc).
    await adminClient.from('push_notifications_log').insert({ caregiver_id, kind, title, body })

    const { data: tokens } = await adminClient.from('caregiver_push_tokens').select('token').eq('caregiver_id', caregiver_id)
    if (!tokens?.length) {
      return new Response(JSON.stringify({ ok: true, note: 'No device token on file — logged only.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const sa = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON') ?? '{}')
    const accessToken = await getAccessToken()

    const results = []
    for (const { token } of tokens) {
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body: body ?? '' },
            data: page ? { page } : {},
            android: { priority: 'high' },
          },
        }),
      })
      results.push({ token: token.slice(0, 12) + '…', status: res.status })
      // Clean up tokens Firebase says are no longer valid.
      if (res.status === 404 || res.status === 400) {
        await adminClient.from('caregiver_push_tokens').delete().eq('token', token)
      }
    }

    return new Response(JSON.stringify({ ok: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
