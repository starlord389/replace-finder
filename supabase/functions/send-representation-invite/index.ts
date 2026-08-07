import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTransactionalEmail } from '../_shared/send-transactional.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceKey) return json(500, { error: 'server misconfigured' })

  const auth = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    auth: { persistSession: false },
  })
  const { data: authData } = await auth.auth.getUser()
  if (!authData.user) return json(401, { error: 'authentication required' })

  let body: { representationId?: unknown }
  try { body = await req.json() } catch { return json(400, { error: 'invalid json' }) }
  const representationId = typeof body.representationId === 'string' ? body.representationId : ''
  if (!UUID_RE.test(representationId)) return json(400, { error: 'invalid representation id' })

  const { data: preparedData, error: preparedError } = await auth.rpc('prepare_representation_invite_delivery', {
    p_representation_id: representationId,
  })
  const prepared = Array.isArray(preparedData) ? preparedData[0] : preparedData
  if (preparedError || !prepared) {
    const message = preparedError?.message || 'pending invitation not found'
    const status = message.toLowerCase().includes('one minute') ? 429 : 400
    return json(status, { error: message })
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const { data: representation, error: repError } = await admin
    .from('agent_representations')
    .select('id, investor_id, agent_id, investor_email, agent_email, source, invited_by')
    .eq('id', representationId)
    .maybeSingle()
  if (repError || !representation) return json(404, { error: 'invitation not found' })

  const { data: inviter } = await admin.from('profiles').select('full_name, company, brokerage_name').eq('id', representation.invited_by).maybeSingle()
  const siteUrl = (Deno.env.get('SITE_URL') || 'https://1031exchangeup.com').replace(/\/$/, '')
  const result = await sendTransactionalEmail({
    templateName: 'representation-invite',
    recipientEmail: prepared.email,
    idempotencyKey: `representation-invite-${prepared.invite_id}-${prepared.send_count}`,
    templateData: {
      inviterName: inviter?.full_name || inviter?.brokerage_name || inviter?.company || undefined,
      recipientRole: prepared.direction === 'investor_to_agent' ? 'agent' : 'investor',
      inviteUrl: `${siteUrl}/representation-invite?token=${encodeURIComponent(prepared.token)}`,
    },
  })
  await admin.from('representation_invites').update({
    delivery_status: result.ok ? 'sent' : 'failed',
    delivery_error_code: result.ok ? null : (result.errorCode || 'email_delivery_failed'),
    updated_at: new Date().toISOString(),
  }).eq('id', prepared.invite_id)
  if (!result.ok) return json(502, { error: result.errorCode || 'email delivery failed' })
  return json(200, { ok: true })
})
