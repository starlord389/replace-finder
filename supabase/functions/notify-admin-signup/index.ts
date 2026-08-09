// Purpose-specific public notification endpoint.
//
// Called (with anon/authenticated JWT) by the frontend right after a signup
// or landlord referral is inserted. NEVER accepts caller-supplied recipient
// addresses or template names - always looks up the real record from the
// database with the service role and derives everything from stored values.
//
// Dispatch is tracked in admin_notify_dispatch_log with pending/sent/failed
// states and a bounded retry (max 3 attempts). Concurrent requests for the
// same idempotency key cannot double-send.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { notifyAdmins } from '../_shared/admin-notify.ts'
import { sendTransactionalEmail } from '../_shared/send-transactional.ts'
import { requesterFingerprint } from '../_shared/fingerprint.ts'

const MAX_BODY_BYTES = 4 * 1024
const RATE_LIMIT_WINDOW_SECONDS = 60
const RATE_LIMIT_MAX_PER_FP = 20
const MAX_ATTEMPTS = 3

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Kind = 'agent_signup' | 'landlord_referral'

interface IncomingBody {
  kind?: unknown
  idempotencySuffix?: unknown
  referralId?: unknown
  data?: unknown
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

type Admin = ReturnType<typeof createClient>

interface Claim {
  claimed: boolean
  currentStatus: string
  attempts: number
}

async function claim(
  admin: Admin,
  key: string,
  kind: Kind,
  subjectId: string,
  fingerprint: string,
): Promise<Claim | null> {
  const { data, error } = await admin.rpc('claim_admin_dispatch', {
    p_key: key,
    p_kind: kind,
    p_subject_id: subjectId,
    p_fingerprint: fingerprint,
  })
  if (error) {
    console.warn('claim_admin_dispatch failed', error.message)
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return {
    claimed: !!row.claimed,
    currentStatus: String(row.current_status || 'unknown'),
    attempts: Number(row.attempts || 0),
  }
}

async function finalize(admin: Admin, key: string, success: boolean, errorCode?: string) {
  const { error } = await admin.rpc('finalize_admin_dispatch', {
    p_key: key,
    p_success: success,
    p_error_code: errorCode ?? null,
  })
  if (error) console.warn('finalize_admin_dispatch failed', error.message)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' })

  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'payload too large' })

  let body: IncomingBody
  try {
    body = raw ? JSON.parse(raw) : {}
  } catch {
    return json(400, { error: 'invalid json' })
  }

  const kind = body.kind
  if (kind !== 'agent_signup' && kind !== 'landlord_referral') {
    return json(400, { error: 'unsupported kind' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    console.error('missing supabase env')
    return json(500, { error: 'server misconfigured' })
  }
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const fingerprint = await requesterFingerprint(req)

  // Fail-closed rate limit: any DB error returns 503 rather than silently
  // allowing the request.
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString()
  const { count, error: rlError } = await admin
    .from('admin_notify_dispatch_log')
    .select('id', { count: 'exact', head: true })
    .eq('kind', kind as string)
    .eq('requester_fingerprint', fingerprint)
    .gte('created_at', since)
  if (rlError) {
    console.warn('rate limit lookup failed', rlError.message)
    return json(503, { error: 'temporarily unavailable' })
  }
  if (typeof count === 'number' && count >= RATE_LIMIT_MAX_PER_FP) {
    return json(429, { error: 'rate limited' })
  }

  if (kind === 'agent_signup') {
    return await handleAgentSignup(body, admin, fingerprint)
  }
  return await handleLandlordReferral(body, admin, fingerprint)
})

async function handleAgentSignup(
  body: IncomingBody,
  admin: Admin,
  fingerprint: string,
): Promise<Response> {
  const userId = typeof body.idempotencySuffix === 'string' ? body.idempotencySuffix : ''
  if (!UUID_RE.test(userId)) return json(400, { error: 'invalid user id' })

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, brokerage_name, license_state, mls_number')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('profile lookup failed', error.message)
    return json(500, { error: 'lookup failed' })
  }
  if (!profile) return json(404, { error: 'profile not found' })

  const idemKey = `admin-signup-${profile.id}`
  const c = await claim(admin, idemKey, 'agent_signup', String(profile.id), fingerprint)
  if (!c) return json(503, { error: 'temporarily unavailable' })
  if (!c.claimed) {
    if (c.currentStatus === 'sent') return json(200, { ok: true, duplicate: true })
    if (c.currentStatus === 'failed' && c.attempts >= MAX_ATTEMPTS) {
      return json(200, { ok: false, status: 'failed', duplicate: true })
    }
    // pending in flight elsewhere
    return json(202, { ok: true, pending: true })
  }

  const result = await notifyAdmins({
    eventType: 'New agent signup',
    title: `${profile.full_name || 'A new agent'} just created an account`,
    summary: 'A new agent finished signup on 1031ExchangeUp.',
    details: [
      { label: 'Name', value: (profile.full_name as string) || '-' },
      { label: 'Email', value: (profile.email as string) || '-' },
      { label: 'Phone', value: (profile.phone as string) || '-' },
      { label: 'Brokerage', value: (profile.brokerage_name as string) || '-' },
      { label: 'License state', value: (profile.license_state as string) || '-' },
      { label: 'MLS #', value: (profile.mls_number as string) || '-' },
    ],
    idempotencySuffix: `signup-${profile.id}`,
  })

  await finalize(admin, idemKey, result.ok, result.errorCode)
  return json(200, { ok: result.ok })
}

async function handleLandlordReferral(
  body: IncomingBody,
  admin: Admin,
  fingerprint: string,
): Promise<Response> {
  let referral: Record<string, unknown> | null = null

  const referralId = typeof body.referralId === 'string' ? body.referralId : null
  if (referralId) {
    if (!UUID_RE.test(referralId)) return json(400, { error: 'invalid referralId' })
    const { data, error } = await admin
      .from('referrals')
      .select('id, owner_name, owner_email, owner_phone, property_location, property_type, estimated_value, created_at')
      .eq('id', referralId)
      .maybeSingle()
    if (error) {
      console.error('referral id lookup failed', error.message)
      return json(500, { error: 'lookup failed' })
    }
    referral = data
  } else {
    const data = (body.data ?? {}) as Record<string, unknown>
    const rawEmail = typeof data.email === 'string' ? data.email : ''
    const email = rawEmail.trim().toLowerCase()
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return json(400, { error: 'invalid email' })
    }
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: rows, error } = await admin
      .from('referrals')
      .select('id, owner_name, owner_email, owner_phone, property_location, property_type, estimated_value, created_at')
      .ilike('owner_email', email)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) {
      console.error('referral email lookup failed', error.message)
      return json(500, { error: 'lookup failed' })
    }
    referral = rows && rows.length > 0 ? rows[0] : null
  }

  if (!referral) return json(404, { error: 'referral not found' })

  const refId = referral.id as string
  const ownerEmail = ((referral.owner_email as string) || '').trim()
  const ownerName = ((referral.owner_name as string) || '').trim()
  const firstName = ownerName.split(/\s+/)[0] || undefined
  const location = (referral.property_location as string) || ''
  const phone = (referral.owner_phone as string) || '-'
  const propertyType = (referral.property_type as string) || '-'
  const estimatedValueNum = referral.estimated_value as number | null | undefined
  const estimatedValue =
    typeof estimatedValueNum === 'number' && Number.isFinite(estimatedValueNum)
      ? `$${estimatedValueNum.toLocaleString()}`
      : '-'

  let adminOk = true
  let ackOk = true

  // Admin notification
  const adminKey = `admin-referral-${refId}`
  const adminClaim = await claim(admin, adminKey, 'landlord_referral', refId, fingerprint)
  if (!adminClaim) return json(503, { error: 'temporarily unavailable' })
  if (adminClaim.claimed) {
    const result = await notifyAdmins({
      eventType: 'New landlord referral request',
      title: `${ownerName || 'A landlord'} requested a 1031 agent`,
      summary: 'A landlord submitted the "Find me an agent" form.',
      details: [
        { label: 'Name', value: ownerName || '-' },
        { label: 'Email', value: ownerEmail || '-' },
        { label: 'Phone', value: phone },
        { label: 'Location', value: location || '-' },
        { label: 'Property type', value: propertyType },
        { label: 'Est. value', value: estimatedValue },
      ],
      idempotencySuffix: `referral-${refId}`,
    })
    await finalize(admin, adminKey, result.ok, result.errorCode)
    adminOk = result.ok
  } else if (adminClaim.currentStatus !== 'sent') {
    adminOk = false
  }

  // Owner acknowledgement
  const ackKey = `ack-referral-${refId}`
  if (ownerEmail && EMAIL_RE.test(ownerEmail)) {
    const ackClaim = await claim(admin, ackKey, 'landlord_referral', refId, fingerprint)
    if (!ackClaim) return json(503, { error: 'temporarily unavailable' })
    if (ackClaim.claimed) {
      const res = await sendTransactionalEmail({
        templateName: 'referral-acknowledgement',
        recipientEmail: ownerEmail,
        idempotencyKey: `referral-ack-${refId}`,
        templateData: { firstName, location },
      })
      await finalize(admin, ackKey, res.ok, res.errorCode)
      ackOk = res.ok
    } else if (ackClaim.currentStatus !== 'sent') {
      ackOk = false
    }
  }

  return json(200, { ok: adminOk && ackOk })
}
