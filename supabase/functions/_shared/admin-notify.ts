// Fires internal-admin-notification emails to platform operators.
// Fire-and-forget: never throws; failures are logged only.

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

export async function notifyAdmins(payload: AdminNotifyPayload): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    console.warn('notifyAdmins: missing env, skipping')
    return
  }

  await Promise.all(
    ADMIN_NOTIFY_EMAILS.map(async (recipient) => {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            templateName: 'internal-admin-notification',
            recipientEmail: recipient,
            idempotencyKey: `admin-${payload.idempotencySuffix}-${recipient}`,
            templateData: {
              eventType: payload.eventType,
              title: payload.title,
              summary: payload.summary,
              details: payload.details ?? [],
            },
          }),
        })
        if (!res.ok) {
          const body = await res.text()
          console.warn('notifyAdmins send failed', { recipient, status: res.status, body })
        } else {
          await res.text()
        }
      } catch (err) {
        console.warn('notifyAdmins error', { recipient, err: String(err) })
      }
    }),
  )
}
