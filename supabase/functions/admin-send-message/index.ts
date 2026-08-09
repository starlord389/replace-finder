// Admin Communications Center - direct message dispatch.
//
// Auth: gateway verifies JWT (verify_jwt=true). We additionally require the
// caller's ACTUAL user JWT to map to a public.has_role(uid,'admin') row.
// Recipient email + template name are NEVER accepted from the client - the
// recipient is resolved from stored data based on recipient_type/id.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTransactionalEmail } from '../_shared/send-transactional.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HTML_RE = /<\s*\/?\s*[a-z][^>]*>/i

const MAX_BODY_BYTES = 32 * 1024
const MAX_SUBJECT = 160
const MAX_MESSAGE = 5000
const MAX_IDEM_KEY = 128
const RATE_LIMIT_MAX_PER_HOUR = 20

type RecipientType = 'user' | 'referral' | 'demo' | 'contact'

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface RecipientLookup {
  email: string
  name: string | null
}

async function resolveRecipient(
  admin: ReturnType<typeof createClient>,
  type: RecipientType,
  id: string,
): Promise<RecipientLookup | null> {
  if (type === 'user') {
    const { data } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', id)
      .maybeSingle()
    if (!data?.email) return null
    return { email: String(data.email), name: (data.full_name as string) || null }
  }
  if (type === 'referral') {
    const { data } = await admin
      .from('referrals')
      .select('owner_email, owner_name')
      .eq('id', id)
      .maybeSingle()
    if (!data?.owner_email) return null
    return { email: String(data.owner_email), name: (data.owner_name as string) || null }
  }
  if (type === 'demo') {
    const { data } = await admin
      .from('demo_requests')
      .select('work_email, full_name')
      .eq('id', id)
      .maybeSingle()
    if (!data?.work_email) return null
    return { email: String(data.work_email), name: (data.full_name as string) || null }
  }
  if (type === 'contact') {
    const { data } = await admin
      .from('contact_submissions')
      .select('email, name')
      .eq('id', id)
      .maybeSingle()
    if (!data?.email) return null
    return { email: String(data.email), name: (data.name as string) || null }
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' })

  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json(401, { error: 'unauthorized' })
  }
  const token = authHeader.slice(7).trim()

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error('missing supabase env')
    return json(500, { error: 'server misconfigured' })
  }

  // 1. Verify the user JWT (never trust decoded claims alone).
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
  const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token)
  if (claimsErr || !claimsData?.claims?.sub) {
    return json(401, { error: 'unauthorized' })
  }
  const adminUserId = String(claimsData.claims.sub)

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // 2. Confirm admin role via authoritative RPC.
  const { data: isAdmin, error: roleErr } = await admin.rpc('has_role', {
    _user_id: adminUserId,
    _role: 'admin',
  })
  if (roleErr) {
    console.warn('has_role check failed', roleErr.message)
    return json(500, { error: 'authorization check failed' })
  }
  if (!isAdmin) return json(403, { error: 'forbidden' })

  // 3. Parse + validate body.
  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'payload too large' })
  let body: any
  try {
    body = raw ? JSON.parse(raw) : {}
  } catch {
    return json(400, { error: 'invalid json' })
  }

  const recipientType = body.recipientType
  const recipientId = body.recipientId
  const subjectRaw = typeof body.subject === 'string' ? body.subject.trim() : ''
  const messageRaw = typeof body.messageText === 'string' ? body.messageText.trim() : ''
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : ''

  if (!['user', 'referral', 'demo', 'contact'].includes(recipientType)) {
    return json(400, { error: 'invalid recipientType' })
  }
  if (typeof recipientId !== 'string' || !UUID_RE.test(recipientId)) {
    return json(400, { error: 'invalid recipientId' })
  }
  if (subjectRaw.length < 1 || subjectRaw.length > MAX_SUBJECT) {
    return json(400, { error: 'subject length must be 1..160' })
  }
  if (messageRaw.length < 1 || messageRaw.length > MAX_MESSAGE) {
    return json(400, { error: 'messageText length must be 1..5000' })
  }
  if (HTML_RE.test(subjectRaw) || HTML_RE.test(messageRaw)) {
    return json(400, { error: 'HTML is not allowed; plain text only' })
  }
  if (!idempotencyKey || idempotencyKey.length > MAX_IDEM_KEY) {
    return json(400, { error: 'invalid idempotencyKey' })
  }

  // 4. Idempotency: return existing record if this key already exists.
  const { data: existing, error: existErr } = await admin
    .from('admin_messages')
    .select('id, status, sanitized_error_code')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (existErr) {
    console.warn('idempotency lookup failed', existErr.message)
    return json(503, { error: 'temporarily unavailable' })
  }
  if (existing) {
    return json(200, {
      id: existing.id,
      status: existing.status,
      duplicate: true,
    })
  }

  // 5. Rate limit: 20 messages/hour per admin.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count, error: rlErr } = await admin
    .from('admin_messages')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', adminUserId)
    .gte('created_at', since)
  if (rlErr) {
    console.warn('rate lookup failed', rlErr.message)
    return json(503, { error: 'temporarily unavailable' })
  }
  if ((count ?? 0) >= RATE_LIMIT_MAX_PER_HOUR) {
    return json(429, { error: 'rate limited' })
  }

  // 6. Resolve recipient from stored data.
  const recipient = await resolveRecipient(admin, recipientType as RecipientType, recipientId)
  if (!recipient) return json(404, { error: 'recipient not found' })

  const normalizedEmail = recipient.email.trim().toLowerCase()
  if (!EMAIL_RE.test(normalizedEmail) || normalizedEmail.length > 254) {
    return json(422, { error: 'stored recipient email is invalid' })
  }
  if (normalizedEmail.endsWith('@replacefinder.test')) {
    return json(422, { error: 'test recipients are not allowed' })
  }

  // 7. Suppression check (mirror send-transactional-email's fail-closed model).
  const { data: suppressed, error: supErr } = await admin
    .from('suppressed_emails')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()
  if (supErr) {
    console.warn('suppression check failed', supErr.message)
    return json(503, { error: 'temporarily unavailable' })
  }

  // 8. Create the admin_messages row BEFORE dispatch. Unique idempotency_key
  // makes concurrent requests race-safe.
  const insertPayload: Record<string, unknown> = {
    created_by: adminUserId,
    recipient_type: recipientType,
    recipient_id: recipientId,
    recipient_name: recipient.name,
    recipient_email: normalizedEmail,
    subject: subjectRaw,
    message_text: messageRaw,
    idempotency_key: idempotencyKey,
    status: suppressed ? 'suppressed' : 'pending',
  }
  const { data: inserted, error: insertErr } = await admin
    .from('admin_messages')
    .insert(insertPayload)
    .select('id, status')
    .single()

  if (insertErr) {
    // Concurrent insert lost the race - return existing row.
    if ((insertErr as any).code === '23505') {
      const { data: raced } = await admin
        .from('admin_messages')
        .select('id, status')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()
      if (raced) return json(200, { id: raced.id, status: raced.status, duplicate: true })
    }
    console.error('admin_messages insert failed', insertErr.message)
    return json(500, { error: 'failed to record message' })
  }

  // Audit BEFORE dispatch attempt (records the intent).
  await admin.rpc('log_admin_action', {
    p_action: 'admin_message.send',
    p_entity_type: 'admin_message',
    p_entity_id: inserted.id,
    p_summary: `Direct message → ${recipientType}`,
    p_metadata: {
      recipient_type: recipientType,
      recipient_id: recipientId,
      subject_length: subjectRaw.length,
      message_length: messageRaw.length,
      initial_status: inserted.status,
    },
  })

  if (suppressed) {
    return json(200, { id: inserted.id, status: 'suppressed' })
  }

  // 9. Dispatch via hardened internal helper (service-role JWT).
  const sendResult = await sendTransactionalEmail({
    templateName: 'admin-direct-message',
    recipientEmail: normalizedEmail,
    idempotencyKey: `admin-msg-${inserted.id}`,
    templateData: {
      recipientName: recipient.name || undefined,
      subject: subjectRaw,
      messageText: messageRaw,
    },
  })

  const finalStatus = sendResult.ok
    ? 'queued'
    : sendResult.errorCode === 'email_suppressed'
      ? 'suppressed'
      : 'failed'

  await admin
    .from('admin_messages')
    .update({
      status: finalStatus,
      sanitized_error_code: sendResult.ok ? null : (sendResult.errorCode || 'send_failed').slice(0, 64),
      provider_message_id: sendResult.providerMessageId ?? null,
      sent_at: sendResult.ok ? new Date().toISOString() : null,
    })
    .eq('id', inserted.id)

  await admin.rpc('log_admin_action', {
    p_action: 'admin_message.status',
    p_entity_type: 'admin_message',
    p_entity_id: inserted.id,
    p_summary: `Dispatch → ${finalStatus}`,
    p_metadata: {
      recipient_type: recipientType,
      recipient_id: recipientId,
      status: finalStatus,
      error_code: sendResult.ok ? null : (sendResult.errorCode || 'send_failed').slice(0, 64),
    },
  })

  return json(200, { id: inserted.id, status: finalStatus })
})
