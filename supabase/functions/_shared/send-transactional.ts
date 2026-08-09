// Internal helper for calling send-transactional-email with the service-role
// JWT. Returns a structured SendResult so callers can decide how to record
// dispatch state (do NOT swallow failures).

export interface SendResult {
  ok: boolean
  status: number
  providerMessageId?: string
  errorCode?: string
  reason?: string
}

interface SendArgs {
  templateName: string
  recipientEmail: string
  idempotencyKey: string
  templateData: Record<string, unknown>
}

function classifyStatus(status: number): string {
  if (status === 401 || status === 403) return 'auth_error'
  if (status === 404) return 'template_not_found'
  if (status === 413) return 'payload_too_large'
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'server_error'
  if (status >= 400) return 'bad_request'
  return 'unknown_error'
}

export async function sendTransactionalEmail(args: SendArgs): Promise<SendResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, status: 0, errorCode: 'server_misconfigured' }
  }

  let res: Response
  try {
    res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(args),
    })
  } catch (err) {
    console.warn('sendTransactionalEmail fetch failed', String(err))
    return { ok: false, status: 0, errorCode: 'network_error' }
  }

  let body: any = null
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    // Log status only; never leak provider/error text to callers.
    console.warn('send-transactional-email non-ok', {
      status: res.status,
      template: args.templateName,
    })
    return { ok: false, status: res.status, errorCode: classifyStatus(res.status) }
  }

  // 200 with success:false covers the suppression case - treat as terminal,
  // not a retryable failure.
  if (body && body.success === false) {
    return {
      ok: false,
      status: res.status,
      errorCode: body.reason === 'email_suppressed' ? 'email_suppressed' : 'send_declined',
      reason: typeof body.reason === 'string' ? body.reason : undefined,
    }
  }

  return {
    ok: true,
    status: res.status,
    providerMessageId: typeof body?.message_id === 'string' ? body.message_id : undefined,
  }
}
