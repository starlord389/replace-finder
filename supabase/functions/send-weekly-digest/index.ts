import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTransactionalEmail } from '../_shared/send-transactional.ts'

const SITE_URL = 'https://1031exchangeup.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'server_misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const weekKey = new Date().toISOString().slice(0, 10)

  const { data: prefs, error: prefsError } = await supabase
    .from('user_notification_preferences')
    .select('user_id, notify_weekly_digest')
    .eq('notify_weekly_digest', true)

  if (prefsError) {
    console.error('prefs load failed', prefsError.message)
    return new Response(JSON.stringify({ error: 'prefs_failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('user_id, type, title, created_at')
    .gte('created_at', since)
    .limit(5000)

  if (notifError) {
    console.error('notifications load failed', notifError.message)
    return new Response(JSON.stringify({ error: 'notifications_failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const byUser = new Map<string, { matches: number; messages: number; connections: number; items: { label: string }[] }>()
  for (const n of notifications ?? []) {
    const bucket = byUser.get(n.user_id) ?? { matches: 0, messages: 0, connections: 0, items: [] }
    const type = String(n.type ?? '')
    if (type.includes('match')) {
      bucket.matches++
      if (n.title && bucket.items.length < 6) bucket.items.push({ label: n.title })
    } else if (type.includes('message')) {
      bucket.messages++
    } else if (
      type.includes('connection') || type.includes('representation') ||
      type.includes('request') || type.includes('invite')
    ) {
      bucket.connections++
    }
    byUser.set(n.user_id, bucket)
  }

  const optedIn = new Set((prefs ?? []).map((p) => p.user_id as string))
  const targets = [...byUser.entries()].filter(
    ([userId, b]) => optedIn.has(userId) && (b.matches + b.messages + b.connections) > 0,
  )

  let sent = 0
  let failed = 0

  for (const [userId, bucket] of targets) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', userId)
      .maybeSingle()

    if (!profile?.email) continue

    const result = await sendTransactionalEmail({
      templateName: 'weekly-digest',
      recipientEmail: profile.email,
      idempotencyKey: `weekly-digest-${userId}-${weekKey}`,
      templateData: {
        firstName: profile.first_name ?? undefined,
        newMatches: bucket.matches,
        newMessages: bucket.messages,
        newConnections: bucket.connections,
        items: bucket.items,
        ctaUrl: SITE_URL,
      },
    })

    if (result.ok) sent++
    else failed++
  }

  return new Response(JSON.stringify({ candidates: targets.length, sent, failed }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
