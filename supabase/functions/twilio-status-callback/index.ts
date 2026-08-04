// Public Twilio status callback webhook.
//
// Twilio POSTs application/x-www-form-urlencoded delivery updates here.
// Auth is NOT Supabase JWT (Twilio can't send one) — instead every request is
// validated with Twilio's X-Twilio-Signature HMAC-SHA1 scheme using the
// account's auth token, which is read from the TWILIO_AUTH_TOKEN secret.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const MAX_BODY_BYTES = 16 * 1024

const TERMINAL_DELIVERED = new Set(['delivered'])
const KNOWN_STATUSES = new Set([
  'accepted',
  'queued',
  'sending',
  'sent',
  'receiving',
  'received',
  'delivered',
  'undelivered',
  'failed',
  'read',
  'canceled',
  'scheduled',
])

function textResponse(status: number, body: string) {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
  })
}

function base64(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// Twilio signature = base64(HMAC-SHA1(authToken, url + sorted(k+v) concatenated))
async function computeSignature(authToken: string, url: string, params: Record<string, string>) {
  const payload =
    url +
    Object.keys(params)
      .sort()
      .map((key) => key + params[key])
      .join('')

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return base64(sig)
}

// Twilio signs the exact URL it was configured with. Prefer the explicitly
// configured public URL so proxy/host rewrites can't break validation.
function candidateUrls(req: Request): string[] {
  const configured = Deno.env.get('TWILIO_STATUS_CALLBACK_URL')?.trim()
  const requestUrl = new URL(req.url)
  const forwardedHost = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https'

  const urls = new Set<string>()
  if (configured) urls.add(configured)
  urls.add(requestUrl.toString())
  if (forwardedHost) {
    urls.add(`${forwardedProto}://${forwardedHost}${requestUrl.pathname}${requestUrl.search}`)
  }
  return [...urls]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return textResponse(405, 'method not allowed')

  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authToken || !supabaseUrl || !serviceKey) {
    console.error('twilio-status-callback: missing required environment configuration')
    return textResponse(500, 'server misconfigured')
  }

  const signature = req.headers.get('x-twilio-signature')
  if (!signature) return textResponse(403, 'missing signature')

  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) return textResponse(413, 'payload too large')

  const form = new URLSearchParams(raw)
  const params: Record<string, string> = {}
  for (const [k, v] of form.entries()) params[k] = v

  let valid = false
  for (const url of candidateUrls(req)) {
    const expected = await computeSignature(authToken, url, params)
    if (timingSafeEqual(expected, signature)) {
      valid = true
      break
    }
  }
  if (!valid) {
    console.warn('twilio-status-callback: signature validation failed')
    return textResponse(403, 'invalid signature')
  }

  const messageSid = (params.MessageSid || params.SmsSid || '').trim()
  const messageStatus = (params.MessageStatus || params.SmsStatus || '').trim().toLowerCase()
  const to = (params.To || '').trim()
  const from = (params.From || '').trim()
  const errorCode = (params.ErrorCode || '').trim() || null
  const errorMessage = (params.ErrorMessage || '').trim().slice(0, 500) || null

  if (!messageSid || !/^[A-Za-z0-9]{10,64}$/.test(messageSid)) {
    console.warn('twilio-status-callback: invalid MessageSid')
    return textResponse(200, 'ok')
  }
  if (!messageStatus || !KNOWN_STATUSES.has(messageStatus)) {
    console.warn('twilio-status-callback: unknown MessageStatus', messageStatus)
    return textResponse(200, 'ok')
  }

  console.log('twilio-status-callback', {
    messageSid,
    messageStatus,
    errorCode,
    hasError: Boolean(errorMessage),
  })

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const now = new Date().toISOString()

  const { data: updated, error: updateErr } = await admin
    .from('sms_messages')
    .update({
      status: messageStatus,
      error_code: errorCode,
      error_message: errorMessage,
      status_updated_at: now,
      delivered_at: TERMINAL_DELIVERED.has(messageStatus) ? now : null,
    })
    .eq('message_sid', messageSid)
    .select('id')
    .maybeSingle()

  if (updateErr) {
    console.error('twilio-status-callback: update failed', updateErr.message)
  } else if (!updated) {
    // Callback can arrive before/without a local record — record it so the
    // delivery status is never silently dropped.
    const { error: insertErr } = await admin.from('sms_messages').insert({
      message_sid: messageSid,
      to_number: to || 'unknown',
      from_number: from || null,
      status: messageStatus,
      error_code: errorCode,
      error_message: errorMessage,
      status_updated_at: now,
      delivered_at: TERMINAL_DELIVERED.has(messageStatus) ? now : null,
    })
    if (insertErr) console.error('twilio-status-callback: insert failed', insertErr.message)
  }

  // Always 200 so Twilio does not retry.
  return textResponse(200, 'ok')
})
