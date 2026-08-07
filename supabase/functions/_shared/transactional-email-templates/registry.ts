import { template as referralAcknowledgement } from './referral-acknowledgement.tsx'
import { template as newMatchNotification } from './new-match-notification.tsx'
import { template as internalAdminNotification } from './internal-admin-notification.tsx'
import { template as adminDirectMessage } from './admin-direct-message.tsx'
import { template as representationInvite } from './representation-invite.tsx'

export interface TemplateEntry {
  component: (props: any) => any
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'referral-acknowledgement': referralAcknowledgement,
  'new-match-notification': newMatchNotification,
  'internal-admin-notification': internalAdminNotification,
  'admin-direct-message': adminDirectMessage,
  'representation-invite': representationInvite,
}
