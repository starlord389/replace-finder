// Public endpoint invoked from the client right after successful signup or
// referral submission to alert platform operators. Never returns sensitive
// data; validates inputs and rate-limits by idempotency key inside the
// downstream send-transactional-email pipeline.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { notifyAdmins } from '../_shared/admin-notify.ts'

interface Body {
  kind: 'agent_signup' | 'landlord_referral'
  idempotencySuffix: string
  data: Record<string, string | undefined>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  let body: Body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!body?.kind || !body?.idempotencySuffix) {
    return new Response(JSON.stringify({ error: 'missing fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Auth: require a valid JWT (anon or user) so random unauthenticated
  // callers can't spam admin emails. verify_jwt=true handles this at gateway.
  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const trim = (v: unknown, max = 200) =>
    typeof v === 'string' ? v.slice(0, max) : ''

  if (body.kind === 'agent_signup') {
    const name = trim(body.data?.name) || 'Unknown'
    const email = trim(body.data?.email) || 'unknown'
    const brokerage = trim(body.data?.brokerage) || '—'
    const licenseState = trim(body.data?.licenseState) || '—'
    const mls = trim(body.data?.mlsNumber) || '—'
    const phone = trim(body.data?.phone) || '—'
    await notifyAdmins({
      eventType: 'New agent signup',
      title: `${name} just created an agent account`,
      summary: 'A new agent finished signup on 1031ExchangeUp.',
      details: [
        { label: 'Name', value: name },
        { label: 'Email', value: email },
        { label: 'Phone', value: phone },
        { label: 'Brokerage', value: brokerage },
        { label: 'License state', value: licenseState },
        { label: 'MLS #', value: mls },
      ],
      idempotencySuffix: `signup-${body.idempotencySuffix}`,
    })
  } else if (body.kind === 'landlord_referral') {
    const name = trim(body.data?.name) || 'Unknown'
    const email = trim(body.data?.email) || 'unknown'
    const phone = trim(body.data?.phone) || '—'
    const location = trim(body.data?.location) || '—'
    const propertyType = trim(body.data?.propertyType) || '—'
    const estimatedValue = trim(body.data?.estimatedValue) || '—'
    await notifyAdmins({
      eventType: 'New landlord referral request',
      title: `${name} requested a 1031 agent`,
      summary: 'A landlord submitted the "Find me an agent" form.',
      details: [
        { label: 'Name', value: name },
        { label: 'Email', value: email },
        { label: 'Phone', value: phone },
        { label: 'Location', value: location },
        { label: 'Property type', value: propertyType },
        { label: 'Est. value', value: estimatedValue },
      ],
      idempotencySuffix: `referral-${body.idempotencySuffix}`,
    })
  } else {
    return new Response(JSON.stringify({ error: 'unknown kind' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
