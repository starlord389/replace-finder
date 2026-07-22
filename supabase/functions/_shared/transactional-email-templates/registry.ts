import { template as referralAcknowledgement } from './referral-acknowledgement.tsx'

export interface TemplateEntry {
  component: (props: any) => any
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'referral-acknowledgement': referralAcknowledgement,
}
