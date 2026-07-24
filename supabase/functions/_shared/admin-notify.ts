// Fires internal-admin-notification emails to platform operators.
// Returns explicit per-recipient success/failure so callers (e.g. dispatch
// finalizers) know whether the downstream sender actually accepted the message.

import { sendTransactionalEmail, type SendResult } from './send-transactional.ts'

export const ADMIN_NOTIFY_EMAILS = [
  'eamon.t.mckenna123@gmail.com',
  'steve@multifamilyproperties.com',
]

interface AdminNotifyPayload {
  eventType: string
  title: string
  summary?: string
  details?: Array<{ label: string; value: string }>
  idempotencySuffix: string // e.g. `signup-<userId>` or `listing-<exchangeId>`
}

export interface AdminNotifyResult {
  ok: boolean
  results: Array<{ recipient: string; ok: boolean; errorCode?: string }>
  errorCode?: string
}

export async function notifyAdmins(payload: AdminNotifyPayload): Promise<AdminNotifyResult> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    console.warn('notifyAdmins: missing env')
    return { ok: false, results: [], errorCode: 'server_misconfigured' }
  }

  const results = await Promise.all(
    ADMIN_NOTIFY_EMAILS.map(async (recipient): Promise<{ recipient: string; ok: boolean; errorCode?: string }> => {
      const res: SendResult = await sendTransactionalEmail({
        templateName: 'internal-admin-notification',
        recipientEmail: recipient,
        idempotencyKey: `admin-${payload.idempotencySuffix}-${recipient}`,
        templateData: {
          eventType: payload.eventType,
          title: payload.title,
          summary: payload.summary,
          details: payload.details ?? [],
        },
      })
      return { recipient, ok: res.ok, errorCode: res.errorCode }
    }),
  )

  const allOk = results.every((r) => r.ok)
  const firstErr = results.find((r) => !r.ok)?.errorCode
  return { ok: allOk, results, errorCode: allOk ? undefined : (firstErr || 'send_failed') }
}
