import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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

interface Props {
  firstName?: string
  headline: string
  bodyText?: string
  detail?: string
  ctaUrl?: string
  ctaLabel?: string
  reason?: string
  preferencesUrl?: string
}

const Email = ({
  firstName,
  headline,
  bodyText,
  detail,
  ctaUrl,
  ctaLabel,
  reason,
  preferencesUrl,
}: Props) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{bodyText || headline}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>
              1031Exchange<span style={brandAccent}>UP</span>
            </Text>
          </Section>

          <Heading style={h1}>{headline}</Heading>
          <Text style={paragraph}>{greeting}</Text>
          {bodyText && <Text style={paragraph}>{bodyText}</Text>}

          {detail && (
            <Section style={card}>
              <Text style={listItem}>{detail}</Text>
            </Section>
          )}

          {ctaUrl && (
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Button href={ctaUrl} style={button}>{ctaLabel || 'Open in 1031ExchangeUp'}</Button>
            </Section>
          )}

          <Hr style={hr} />
          <Text style={footer}>
            {reason || "You're getting this because of activity on your 1031ExchangeUp account."}
            {preferencesUrl ? ' You can change which emails you receive in your notification settings.' : ''}
          </Text>
          <Text style={footerSmall}>
            1031ExchangeUp · Continuous opportunity monitoring for investors and agents
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: any) => data?.headline || 'Update on your 1031ExchangeUp account',
  displayName: 'User activity notification',
  previewData: {
    firstName: 'Alex',
    headline: 'An agent requested to connect',
    bodyText: 'An agent wants to work with you on your exchange.',
    detail: 'Review the request and choose whether to connect.',
    ctaUrl: 'https://1031exchangeup.com/investor/connections',
    ctaLabel: 'Review request',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  color: '#1c1c1c',
}
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const brandBar = { paddingBottom: '16px' }
const brandText = { fontSize: '20px', fontWeight: 800, color: '#0e2a4d', margin: 0, letterSpacing: '-0.01em' }
const brandAccent = { color: '#43a047' }
const h1 = { fontSize: '25px', fontWeight: 800, color: '#1c1c1c', margin: '8px 0 16px', letterSpacing: '-0.01em' }
const paragraph = { fontSize: '15px', lineHeight: '1.6', color: '#333', margin: '0 0 14px' }
const listItem = { fontSize: '14.5px', lineHeight: '1.6', color: '#333', margin: 0 }
const card = { backgroundColor: '#f5f4f2', borderRadius: '12px', padding: '20px 22px', margin: '18px 0' }
const button = {
  backgroundColor: '#0e2a4d',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 700,
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#626a75', lineHeight: '1.5', margin: '0 0 6px' }
const footerSmall = { fontSize: '12px', color: '#8a94a3', margin: 0 }
