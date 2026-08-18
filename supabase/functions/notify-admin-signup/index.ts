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

type Kind =
  | 'agent_signup'
  | 'investor_signup'
  | 'landlord_referral'
  | 'demo_request'
  | 'event_registration'
  | 'support_ticket'
  | 'listing_inquiry'

const ALL_KINDS: Kind[] = [
  'agent_signup',
  'investor_signup',
  'landlord_referral',
  'demo_request',
  'event_registration',
  'support_ticket',
  'listing_inquiry',
]

interface IncomingBody {
  kind?: unknown
  idempotencySuffix?: unknown
  referralId?: unknown
  recordId?: unknown
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
  if (typeof kind !== 'string' || !ALL_KINDS.includes(kind as Kind)) {
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

  if (kind === 'agent_signup' || kind === 'investor_signup') {
    return await handleSignup(kind, body, admin, fingerprint)
  }
  if (kind === 'landlord_referral') {
    return await handleLandlordReferral(body, admin, fingerprint)
  }
  return await handleRecordIntake(kind as RecordKind, body, admin, fingerprint)
})

// ---------------------------------------------------------------------------
// Record-backed intake notifications (demo requests, event registrations,
// support tickets, listing inquiries). The caller only supplies a record id;
// every value in the email is read back from the database with the service
// role so nothing user-supplied controls recipients or content.
// ---------------------------------------------------------------------------

type RecordKind = 'demo_request' | 'event_registration' | 'support_ticket' | 'listing_inquiry'

async function handleRecordIntake(
  kind: RecordKind,
  body: IncomingBody,
  admin: Admin,
  fingerprint: string,
): Promise<Response> {
  const recordId = typeof body.recordId === 'string' ? body.recordId : ''
  if (!UUID_RE.test(recordId)) return json(400, { error: 'invalid record id' })

  const idemKey = `admin-${kind}-${recordId}`
  const c = await claim(admin, idemKey, kind as unknown as Kind, recordId, fingerprint)
  if (!c) return json(503, { error: 'temporarily unavailable' })
  if (!c.claimed) {
    if (c.currentStatus === 'sent') return json(200, { ok: true, duplicate: true })
    if (c.currentStatus === 'failed' && c.attempts >= MAX_ATTEMPTS) {
      return json(200, { ok: false, status: 'failed', duplicate: true })
    }
    return json(202, { ok: true, pending: true })
  }

  let payload:
    | { eventType: string; title: string; summary: string; details: Array<{ label: string; value: string }> }
    | null = null

  if (kind === 'demo_request') {
    const { data, error } = await admin
      .from('demo_requests')
      .select('id, full_name, work_email, company, role, phone, timeline, use_case')
      .eq('id', recordId)
      .maybeSingle()
    if (error) {
      await finalize(admin, idemKey, false, 'lookup_failed')
      return json(500, { error: 'lookup failed' })
    }
    if (!data) {
      await finalize(admin, idemKey, false, 'not_found')
      return json(404, { error: 'not found' })
    }
    payload = {
      eventType: 'New demo request',
      title: `${(data.full_name as string) || 'Someone'} requested a demo`,
      summary: 'A new demo request was submitted on 1031ExchangeUp.',
      details: [
        { label: 'Name', value: str(data.full_name) },
        { label: 'Email', value: str(data.work_email) },
        { label: 'Phone', value: str(data.phone) },
        { label: 'Company', value: str(data.company) },
        { label: 'Role', value: str(data.role) },
        { label: 'Timeline', value: str(data.timeline) },
        { label: 'What they need', value: str(data.use_case) },
      ],
    }
  } else if (kind === 'event_registration') {
    const { data, error } = await admin
      .from('event_registrations')
      .select('id, full_name, email, role, event, created_at')
      .eq('id', recordId)
      .maybeSingle()
    if (error) {
      await finalize(admin, idemKey, false, 'lookup_failed')
      return json(500, { error: 'lookup failed' })
    }
    if (!data) {
      await finalize(admin, idemKey, false, 'not_found')
      return json(404, { error: 'not found' })
    }
    payload = {
      eventType: 'New event registration',
      title: `${(data.full_name as string) || 'Someone'} registered for an event`,
      summary: 'A new registration came in for an upcoming session.',
      details: [
        { label: 'Name', value: str(data.full_name) },
        { label: 'Email', value: str(data.email) },
        { label: 'Role', value: str(data.role) },
        { label: 'Event', value: str(data.event) },
      ],
    }
  } else if (kind === 'support_ticket') {
    const { data, error } = await admin
      .from('support_tickets')
      .select('id, subject, message, category, status, user_id')
      .eq('id', recordId)
      .maybeSingle()
    if (error) {
      await finalize(admin, idemKey, false, 'lookup_failed')
      return json(500, { error: 'lookup failed' })
    }
    if (!data) {
      await finalize(admin, idemKey, false, 'not_found')
      return json(404, { error: 'not found' })
    }
    const submitter = await profileSummary(admin, data.user_id as string)
    payload = {
      eventType: 'New support ticket',
      title: `Support ticket: ${str(data.subject)}`,
      summary: 'A user submitted a support request.',
      details: [
        { label: 'From', value: submitter.name },
        { label: 'Email', value: submitter.email },
        { label: 'Phone', value: submitter.phone },
        { label: 'Category', value: str(data.category) },
        { label: 'Subject', value: str(data.subject) },
        { label: 'Message', value: str(data.message) },
      ],
    }
  } else {
    const { data, error } = await admin
      .from('listing_inquiries')
      .select('id, initial_message, investor_id, listing_agent_id, property_id, is_demo')
      .eq('id', recordId)
      .maybeSingle()
    if (error) {
      await finalize(admin, idemKey, false, 'lookup_failed')
      return json(500, { error: 'lookup failed' })
    }
    if (!data) {
      await finalize(admin, idemKey, false, 'not_found')
      return json(404, { error: 'not found' })
    }
    if (data.is_demo === true) {
      await finalize(admin, idemKey, true)
      return json(200, { ok: true, skipped: 'demo' })
    }
    const [investor, agent] = await Promise.all([
      profileSummary(admin, data.investor_id as string),
      profileSummary(admin, data.listing_agent_id as string),
    ])
    const { data: property } = await admin
      .from('pledged_properties')
      .select('city, state, asset_type, asking_price')
      .eq('id', data.property_id as string)
      .maybeSingle()
    const price = property?.asking_price
    payload = {
      eventType: 'New listing inquiry',
      title: `${investor.name} inquired about a listing`,
      summary: 'An investor contacted a listing agent through the platform.',
      details: [
        { label: 'Investor', value: investor.name },
        { label: 'Investor email', value: investor.email },
        { label: 'Investor phone', value: investor.phone },
        { label: 'Listing agent', value: agent.name },
        { label: 'Listing agent email', value: agent.email },
        {
          label: 'Property',
          value: [property?.city, property?.state].filter(Boolean).join(', ') || '-',
        },
        { label: 'Asset type', value: str(property?.asset_type) },
        {
          label: 'Asking price',
          value: typeof price === 'number' && Number.isFinite(price) ? `$${price.toLocaleString()}` : '-',
        },
        { label: 'Message', value: str(data.initial_message) },
      ],
    }
  }

  const result = await notifyAdmins({ ...payload, idempotencySuffix: `${kind}-${recordId}` })
  await finalize(admin, idemKey, result.ok, result.errorCode)
  return json(200, { ok: result.ok })
}

function str(value: unknown): string {
  const s = typeof value === 'string' ? value.trim() : value != null ? String(value) : ''
  return s ? s.slice(0, 2000) : '-'
}

async function profileSummary(
  admin: Admin,
  userId: string | null,
): Promise<{ name: string; email: string; phone: string }> {
  if (!userId || !UUID_RE.test(userId)) return { name: '-', email: '-', phone: '-' }
  const { data } = await admin
    .from('profiles')
    .select('full_name, email, phone')
    .eq('id', userId)
    .maybeSingle()
  return {
    name: str(data?.full_name),
    email: str(data?.email),
    phone: str(data?.phone),
  }
}


async function handleSignup(
  kind: 'agent_signup' | 'investor_signup',
  body: IncomingBody,
  admin: Admin,
  fingerprint: string,
): Promise<Response> {
  const userId = typeof body.idempotencySuffix === 'string' ? body.idempotencySuffix : ''
  if (!UUID_RE.test(userId)) return json(400, { error: 'invalid user id' })

  // The profile row is created by a trigger, which can lag a beat behind the
  // client's notification call - retry briefly before giving up.
  let profile: Record<string, unknown> | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin
      .from('profiles')
      .select('id, full_name, email, phone, brokerage_name, license_state, mls_number')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.error('profile lookup failed', error.message)
      return json(500, { error: 'lookup failed' })
    }
    if (data) {
      profile = data as Record<string, unknown>
      break
    }
    await new Promise((r) => setTimeout(r, 700))
  }
  if (!profile) return json(404, { error: 'profile not found' })

  const isAgent = kind === 'agent_signup'
  const idemKey = `admin-signup-${profile.id}`
  const c = await claim(admin, idemKey, kind, String(profile.id), fingerprint)
  if (!c) return json(503, { error: 'temporarily unavailable' })
  if (!c.claimed) {
    if (c.currentStatus === 'sent') return json(200, { ok: true, duplicate: true })
    if (c.currentStatus === 'failed' && c.attempts >= MAX_ATTEMPTS) {
      return json(200, { ok: false, status: 'failed', duplicate: true })
    }
    // pending in flight elsewhere
    return json(202, { ok: true, pending: true })
  }

  const baseDetails = [
    { label: 'Name', value: str(profile.full_name) },
    { label: 'Email', value: str(profile.email) },
    { label: 'Phone', value: str(profile.phone) },
  ]

  const result = await notifyAdmins({
    eventType: isAgent ? 'New agent signup' : 'New investor signup',
    title: `${str(profile.full_name) !== '-' ? profile.full_name : isAgent ? 'A new agent' : 'A new investor'} just created an account`,
    summary: isAgent
      ? 'A new agent finished signup on 1031ExchangeUp.'
      : 'A new investor / property owner finished signup on 1031ExchangeUp.',
    details: isAgent
      ? [
        ...baseDetails,
        { label: 'Brokerage', value: str(profile.brokerage_name) },
        { label: 'License state', value: str(profile.license_state) },
        { label: 'MLS #', value: str(profile.mls_number) },
      ]
      : [...baseDetails, { label: 'Account type', value: 'Investor / property owner' }],
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
