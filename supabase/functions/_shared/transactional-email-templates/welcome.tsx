import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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
  firstName?: string
  ctaUrl?: string
  ctaLabel?: string
  role?: string
}

const Email = ({ firstName, ctaUrl, ctaLabel, role }: Props) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  const isAgent = role === 'agent'
  const url = ctaUrl || 'https://1031exchangeup.com'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to 1031ExchangeUp - here's how to get started</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>
              1031Exchange<span style={brandAccent}>UP</span>
            </Text>
          </Section>

          <Heading style={h1}>Welcome to 1031ExchangeUp</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            Your account is ready. 1031ExchangeUp is a continuous opportunity monitoring network - once your
            properties and criteria are in, Exchange IQ keeps watching the network and tells you the moment
            something fits.
          </Text>

          <Section style={card}>
            <Text style={listItem}><b>1.</b> Complete your profile so counterparties know who they're working with.</Text>
            <Text style={listItem}>
              <b>2.</b>{' '}
              {isAgent
                ? 'Add your listings and your clients\u2019 buying criteria.'
                : 'Create your exchange with what you own and what you\u2019re looking for.'}
            </Text>
            <Text style={listItem}><b>3.</b> Activate it - we email you the moment a match surfaces.</Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={url} style={button}>{ctaLabel || 'Get started'}</Button>
          </Section>

          <Text style={paragraph}>
            Questions? Just reply to this email, or visit{' '}
            <Link href="https://1031exchangeup.com" style={link}>1031exchangeup.com</Link>.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>You're getting this because you created a 1031ExchangeUp account.</Text>
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
  subject: 'Welcome to 1031ExchangeUp',
  displayName: 'Welcome',
  previewData: {
    firstName: 'Alex',
    role: 'agent',
    ctaUrl: 'https://1031exchangeup.com/agent/launchpad',
    ctaLabel: 'Open your Launchpad',
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
const h1 = { fontSize: '26px', fontWeight: 800, color: '#1c1c1c', margin: '8px 0 16px', letterSpacing: '-0.01em' }
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
const link = { color: '#0e2a4d', textDecoration: 'underline' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#626a75', lineHeight: '1.5', margin: '0 0 6px' }
const footerSmall = { fontSize: '12px', color: '#8a94a3', margin: 0 }
