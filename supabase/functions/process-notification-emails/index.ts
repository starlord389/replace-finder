import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTransactionalEmail } from '../_shared/send-transactional.ts'

const SITE_URL = 'https://1031exchangeup.com'

interface ClaimedRow {
  notification_id: string
  recipient_user_id: string
  notification_type: string
  notification_title: string | null
  notification_message: string | null
  notification_link: string | null
  notification_metadata: Record<string, unknown> | null
  recipient_email: string | null
  recipient_first_name: string | null
}

const REASONS: Record<string, string> = {
  new_match: "You're getting this because match alerts are on in your notification settings.",
  connection_request: "You're getting this because connection request alerts are on in your notification settings.",
  connection_accepted: "You're getting this because connection update alerts are on in your notification settings.",
  message: "You're getting this because message alerts are on in your notification settings.",
  listing_inquiry: "You're getting this because listing inquiry alerts are on in your notification settings.",
}

function reasonFor(type: string): string {
  if (type.includes('match')) return REASONS.new_match
  if (type.includes('message')) return REASONS.message
  if (type.includes('inquiry')) return REASONS.listing_inquiry
  if (type.includes('accept') || type.includes('assigned') || type.includes('started')) {
    return REASONS.connection_accepted
  }
  if (type.includes('request') || type.includes('invite') || type.includes('representation')) {
    return REASONS.connection_request
  }
  return "You're getting this because of activity on your 1031ExchangeUp account."
}

function ctaLabelFor(type: string): string {
  if (type.includes('match')) return 'View the match'
  if (type.includes('message')) return 'Read the message'
  if (type.includes('inquiry')) return 'View the inquiry'
  if (type.includes('request') || type.includes('invite')) return 'Review the request'
  return 'Open in 1031ExchangeUp'
}

function absoluteUrl(link: string | null): string {
  if (!link) return SITE_URL
  if (link.startsWith('http')) return link
  return `${SITE_URL}${link.startsWith('/') ? '' : '/'}${link}`
}

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

  // Mark opted-out / demo notifications as handled so they never queue up.
  const { data: skipped } = await supabase.rpc('skip_opted_out_notification_emails')

  const { data, error } = await supabase.rpc('claim_notification_emails', { _limit: 25 })
  if (error) {
    console.error('claim_notification_emails failed', error.message)
    return new Response(JSON.stringify({ error: 'claim_failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const rows = (data ?? []) as ClaimedRow[]
  let sent = 0
  let failed = 0
  let noEmail = 0

  for (const row of rows) {
    if (!row.recipient_email) {
      noEmail++
      await supabase.rpc('mark_notification_email', {
        _notification_id: row.notification_id,
        _status: 'no_email',
      })
      continue
    }

    const isWelcome = row.notification_type === 'welcome'
    const templateName = isWelcome ? 'welcome' : 'user-notification'
    const templateData = isWelcome
      ? {
          firstName: row.recipient_first_name ?? undefined,
          ctaUrl: absoluteUrl(row.notification_link),
          ctaLabel: 'Get started',
          role: (row.notification_metadata?.role as string) ?? undefined,
        }
      : {
          firstName: row.recipient_first_name ?? undefined,
          headline: row.notification_title || 'Update on your account',
          bodyText: row.notification_message || undefined,
          ctaUrl: absoluteUrl(row.notification_link),
          ctaLabel: ctaLabelFor(row.notification_type),
          reason: reasonFor(row.notification_type),
          preferencesUrl: `${SITE_URL}/settings/notifications`,
        }

    const result = await sendTransactionalEmail({
      templateName,
      recipientEmail: row.recipient_email,
      idempotencyKey: `notification-${row.notification_id}`,
      templateData,
    })

    if (result.ok) {
      sent++
      await supabase.rpc('mark_notification_email', {
        _notification_id: row.notification_id,
        _status: 'sent',
      })
    } else if (result.status >= 500 || result.status === 0 || result.status === 429) {
      failed++
      // Retryable - clears emailed_at so a later run picks it up again.
      await supabase.rpc('mark_notification_email', {
        _notification_id: row.notification_id,
        _status: 'retry',
      })
    } else {
      failed++
      await supabase.rpc('mark_notification_email', {
        _notification_id: row.notification_id,
        _status: result.errorCode || 'failed',
      })
    }
  }

  return new Response(
    JSON.stringify({ claimed: rows.length, sent, failed, noEmail, skipped: skipped ?? 0 }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
