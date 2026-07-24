// Purpose-specific public notification endpoint.
//
// This endpoint is called by the (anon/authenticated) frontend right after a
// signup or a landlord referral is inserted. It NEVER accepts caller-supplied
// recipient addresses or template names — it looks up the real record from the
// database with the service role and derives everything from stored values.
//
// It is the only public entrypoint that can reach send-transactional-email
// on behalf of end-users; send-transactional-email itself is now locked to
// service_role callers.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { notifyAdmins } from '../_shared/admin-notify.ts'

const MAX_BODY_BYTES = 4 * 1024
const RATE_LIMIT_WINDOW_SECONDS = 60
const RATE_LIMIT_MAX_PER_IP = 20

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

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') || ''
  return (fwd.split(',')[0] || '').trim() || req.headers.get('x-real-ip') || 'unknown'
}

async function sendTransactionalEmail(payload: {
  templateName: string
  recipientEmail: string
  idempotencyKey: string
  templateData: Record<string, unknown>
}) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) return
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const txt = await res.text()
      console.warn('send-transactional-email non-ok', { status: res.status, body: txt.slice(0, 300) })
    } else {
      await res.text()
    }
  } catch (err) {
    console.warn('send-transactional-email fetch error', String(err))
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') {
    return json(405, { error: 'method not allowed' })
  }

  // Size cap
  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) {
    return json(413, { error: 'payload too large' })
  }

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

  // Lightweight IP rate limit against the dispatch log.
  const ip = clientIp(req)
  try {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString()
    const { count } = await admin
      .from('admin_notify_dispatch_log')
      .select('id', { count: 'exact', head: true })
      .eq('kind', kind as string)
      .eq('requester_ip', ip)
      .gte('created_at', since)
    if (typeof count === 'number' && count >= RATE_LIMIT_MAX_PER_IP) {
      return json(429, { error: 'rate limited' })
    }
  } catch (err) {
    console.warn('rate limit check failed (allowing)', String(err))
  }

  if (kind === 'agent_signup') {
    return await handleAgentSignup(body, admin, ip)
  }
  return await handleLandlordReferral(body, admin, ip)
})

async function claimIdempotency(
  admin: ReturnType<typeof createClient>,
  key: string,
  kind: Kind,
  subjectId: string,
  ip: string,
): Promise<boolean> {
  const { error } = await admin
    .from('admin_notify_dispatch_log')
    .insert({ idempotency_key: key, kind, subject_id: subjectId, requester_ip: ip })
  if (!error) return true
  // 23505 = unique violation → already dispatched
  // deno-lint-ignore no-explicit-any
  if ((error as any).code === '23505') return false
  console.warn('idempotency insert failed', error)
  // Fail-closed: treat as already dispatched to avoid duplicate sends on transient DB errors.
  return false
}

async function handleAgentSignup(
  body: IncomingBody,
  admin: ReturnType<typeof createClient>,
  ip: string,
): Promise<Response> {
  const userId = typeof body.idempotencySuffix === 'string' ? body.idempotencySuffix : ''
  if (!UUID_RE.test(userId)) {
    return json(400, { error: 'invalid user id' })
  }

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, full_name, email, phone, brokerage_name, license_state, mls_number')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('profile lookup failed', error)
    return json(500, { error: 'lookup failed' })
  }
  if (!profile) {
    return json(404, { error: 'profile not found' })
  }

  const idemKey = `admin-signup-${profile.id}`
  const fresh = await claimIdempotency(admin, idemKey, 'agent_signup', profile.id as string, ip)
  if (!fresh) return json(200, { ok: true, duplicate: true })

  await notifyAdmins({
    eventType: 'New agent signup',
    title: `${profile.full_name || 'A new agent'} just created an account`,
    summary: 'A new agent finished signup on 1031ExchangeUp.',
    details: [
      { label: 'Name', value: (profile.full_name as string) || '—' },
      { label: 'Email', value: (profile.email as string) || '—' },
      { label: 'Phone', value: (profile.phone as string) || '—' },
      { label: 'Brokerage', value: (profile.brokerage_name as string) || '—' },
      { label: 'License state', value: (profile.license_state as string) || '—' },
      { label: 'MLS #', value: (profile.mls_number as string) || '—' },
    ],
    idempotencySuffix: `signup-${profile.id}`,
  })

  return json(200, { ok: true })
}

async function handleLandlordReferral(
  body: IncomingBody,
  admin: ReturnType<typeof createClient>,
  ip: string,
): Promise<Response> {
  // Prefer explicit referralId (future-facing). Otherwise fall back to the
  // published-frontend contract: locate the newest matching referral for the
  // supplied email within the last 10 minutes.
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
      console.error('referral id lookup failed', error)
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
      console.error('referral email lookup failed', error)
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
  const phone = (referral.owner_phone as string) || '—'
  const propertyType = (referral.property_type as string) || '—'
  const estimatedValueNum = referral.estimated_value as number | null | undefined
  const estimatedValue =
    typeof estimatedValueNum === 'number' && Number.isFinite(estimatedValueNum)
      ? `$${estimatedValueNum.toLocaleString()}`
      : '—'

  // Idempotency guard for admin notification.
  const adminIdemKey = `admin-referral-${refId}`
  const freshAdmin = await claimIdempotency(admin, adminIdemKey, 'landlord_referral', refId, ip)

  if (freshAdmin) {
    await notifyAdmins({
      eventType: 'New landlord referral request',
      title: `${ownerName || 'A landlord'} requested a 1031 agent`,
      summary: 'A landlord submitted the "Find me an agent" form.',
      details: [
        { label: 'Name', value: ownerName || '—' },
        { label: 'Email', value: ownerEmail || '—' },
        { label: 'Phone', value: phone },
        { label: 'Location', value: location || '—' },
        { label: 'Property type', value: propertyType },
        { label: 'Est. value', value: estimatedValue },
      ],
      idempotencySuffix: `referral-${refId}`,
    })
  }

  // Separate idempotency guard for the owner acknowledgement email so the
  // two independent sends can't clobber each other.
  const ackIdemKey = `ack-referral-${refId}`
  const freshAck = await claimIdempotency(admin, ackIdemKey, 'landlord_referral', refId, ip)
  if (freshAck && ownerEmail && EMAIL_RE.test(ownerEmail)) {
    await sendTransactionalEmail({
      templateName: 'referral-acknowledgement',
      recipientEmail: ownerEmail,
      idempotencyKey: `referral-ack-${refId}`,
      templateData: { firstName, location },
    })
  }

  return json(200, { ok: true, duplicate: !freshAdmin && !freshAck })
}
