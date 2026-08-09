import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  recipientName?: string
  subject?: string
  messageText?: string
}

// Preserve line breaks in an ESCAPED, plain-text way. Never render HTML from
// caller data - messageText is split on newlines and each segment is emitted
// as a JSX child, which React escapes automatically.
function splitLines(text: string): string[] {
  return text.replace(/\r\n/g, '\n').split('\n')
}

const Email = ({ recipientName, subject, messageText = '' }: Props) => {
  const greeting = recipientName ? `Hi ${recipientName},` : 'Hello,'
  const lines = splitLines(messageText)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{subject || 'A message from 1031ExchangeUp'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={eyebrow}>1031 EXCHANGE UP</Text>
          <Heading style={h1}>{subject || 'A message from our team'}</Heading>
          <Text style={paragraph}>{greeting}</Text>

          <Section style={card}>
            {lines.map((line, i) => (
              <Text key={i} style={line ? messageLine : messageBlank}>
                {line || '\u00A0'}
              </Text>
            ))}
          </Section>

          <Text style={paragraph}>
            If you have any questions, just reply to this email or reach us at{' '}
            <Link href="mailto:support@1031exchangeup.com" style={link}>
              support@1031exchangeup.com
            </Link>
            .
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Sent by the 1031ExchangeUp team. This is a one-off message, not a marketing
            newsletter.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Props) => (data?.subject && data.subject.trim()) || 'A message from 1031ExchangeUp',
  displayName: 'Admin direct message',
  previewData: {
    recipientName: 'Sam',
    subject: 'Following up on your inquiry',
    messageText:
      'Thanks for reaching out earlier this week.\n\nWe reviewed your details and would love to jump on a quick call.\n\n- The 1031ExchangeUp team',
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
  color: '#0e2a4d',
  letterSpacing: '0.12em',
  margin: '0 0 8px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 800,
  color: '#0e2a4d',
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
}
const paragraph = { fontSize: '15px', lineHeight: '1.6', color: '#333', margin: '0 0 14px' }
const card = {
  backgroundColor: '#f5f4f2',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '14px 0',
}
const messageLine = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#1c1c1c',
  margin: '0 0 8px',
  whiteSpace: 'pre-wrap' as const,
}
const messageBlank = { ...messageLine, margin: '0 0 12px' }
const link = { color: '#0e2a4d', textDecoration: 'underline' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0 14px' }
const footer = { fontSize: '12px', color: '#8a94a3', margin: 0 }
