import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTransactionalEmail } from '../_shared/send-transactional.ts'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const { data: representation, error: repError } = await admin
    .from('agent_representations')
    .select('id, investor_id, agent_id, investor_email, agent_email, source, invited_by')
    .eq('id', representationId)
    .maybeSingle()
  if (repError || !representation) return json(404, { error: 'invitation not found' })
  if (representation.invited_by !== authData.user.id) return json(403, { error: 'not invitation creator' })

  const { data: invite } = await admin
    .from('representation_invites')
    .select('token, direction, email, status, expires_at')
    .eq('representation_id', representationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!invite) return json(404, { error: 'pending invitation not found' })

  const { data: inviter } = await admin.from('profiles').select('full_name, company, brokerage_name').eq('id', authData.user.id).maybeSingle()
  const siteUrl = (Deno.env.get('SITE_URL') || 'https://1031exchangeup.com').replace(/\/$/, '')
  const result = await sendTransactionalEmail({
    templateName: 'representation-invite',
    recipientEmail: invite.email,
    idempotencyKey: `representation-invite-${representationId}-${invite.token}`,
    templateData: {
      inviterName: inviter?.full_name || inviter?.brokerage_name || inviter?.company || undefined,
      recipientRole: invite.direction === 'investor_to_agent' ? 'agent' : 'investor',
      inviteUrl: `${siteUrl}/representation-invite?token=${encodeURIComponent(invite.token)}`,
    },
  })
  if (!result.ok) return json(502, { error: result.errorCode || 'email delivery failed' })
  return json(200, { ok: true })
})
