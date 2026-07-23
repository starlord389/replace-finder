import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Detail {
  label: string
  value: string
}

interface Props {
  eventType?: string
  title?: string
  summary?: string
  details?: Detail[]
}

const Email = ({
  eventType = 'Platform activity',
  title = 'New activity',
  summary,
  details = [],
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>{eventType}</Text>
        <Heading style={h1}>{title}</Heading>
        {summary ? <Text style={paragraph}>{summary}</Text> : null}

        {details.length > 0 && (
          <Section style={card}>
            {details.map((d) => (
              <Text key={d.label} style={row}>
                <span style={rowLabel}>{d.label}</span>
                <span style={rowValue}>{d.value}</span>
              </Text>
            ))}
          </Section>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          Internal notification from 1031ExchangeUp · sent to platform operators.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Props) => data?.title || 'New platform activity',
  displayName: 'Internal admin notification',
  previewData: {
    eventType: 'New agent signup',
    title: 'Jane Doe just created an agent account',
    summary: 'A new agent finished signup and is awaiting email verification.',
    details: [
      { label: 'Name', value: 'Jane Doe' },
      { label: 'Email', value: 'jane@example.com' },
      { label: 'Brokerage', value: 'Compass' },
    ],
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  color: '#1c1c1c',
}
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const eyebrow = {
  fontSize: '12px',
  fontWeight: 700,
  color: '#43a047',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  margin: '0 0 6px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#0e2a4d',
  margin: '0 0 12px',
  letterSpacing: '-0.01em',
}
const paragraph = { fontSize: '15px', lineHeight: '1.6', color: '#333', margin: '0 0 14px' }
const card = {
  backgroundColor: '#f5f4f2',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '14px 0',
}
const row = { fontSize: '14px', color: '#1c1c1c', margin: '0 0 8px', lineHeight: '1.5' }
const rowLabel = { display: 'inline-block', width: '130px', color: '#626a75', fontWeight: 600 }
const rowValue = { display: 'inline-block', color: '#1c1c1c' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0 14px' }
const footer = { fontSize: '12px', color: '#8a94a3', margin: 0 }
