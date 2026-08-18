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

interface DigestItem {
  label: string
  detail?: string
}

interface Props {
  firstName?: string
  periodLabel?: string
  newMatches?: number
  newMessages?: number
  newConnections?: number
  items?: DigestItem[]
  staleExchangeLabel?: string
  ctaUrl?: string
}

const Email = ({
  firstName,
  periodLabel,
  newMatches = 0,
  newMessages = 0,
  newConnections = 0,
  items = [],
  staleExchangeLabel,
  ctaUrl,
}: Props) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  const url = ctaUrl || 'https://1031exchangeup.com'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your weekly 1031ExchangeUp summary</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>
              1031Exchange<span style={brandAccent}>UP</span>
            </Text>
          </Section>

          <Heading style={h1}>Your week on the network</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            Here's what Exchange IQ surfaced{periodLabel ? ` ${periodLabel}` : ' in the past week'}.
          </Text>

          <Section style={card}>
            <Text style={listItem}><b>New matches:</b> {newMatches}</Text>
            <Text style={listItem}><b>New messages:</b> {newMessages}</Text>
            <Text style={listItem}><b>New connection activity:</b> {newConnections}</Text>
          </Section>

          {items.length > 0 && (
            <Section style={card}>
              {items.slice(0, 6).map((item, i) => (
                <Text key={i} style={listItem}>
                  <b>{item.label}</b>
                  {item.detail ? ` - ${item.detail}` : ''}
                </Text>
              ))}
            </Section>
          )}

          {staleExchangeLabel && (
            <Text style={paragraph}>
              Heads up: <b>{staleExchangeLabel}</b> has been active for a while without an accepted match.
              Widening the criteria - price band, geography, or asset type - usually surfaces more options.
            </Text>
          )}

          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={url} style={button}>Open your dashboard</Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You're getting this weekly summary because it's enabled in your notification settings.
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
  subject: 'Your weekly 1031ExchangeUp summary',
  displayName: 'Weekly digest',
  previewData: {
    firstName: 'Alex',
    newMatches: 3,
    newMessages: 2,
    newConnections: 1,
    items: [{ label: '12-unit multifamily - Worcester, MA', detail: 'Match score 88' }],
    ctaUrl: 'https://1031exchangeup.com/agent/dashboard',
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
const listItem = { fontSize: '14.5px', lineHeight: '1.6', color: '#333', margin: '0 0 8px' }
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
