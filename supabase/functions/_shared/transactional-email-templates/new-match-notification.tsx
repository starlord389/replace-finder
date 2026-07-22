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
  yourListingLabel?: string
  matchedPropertyLabel?: string
  matchScore?: number
  matchUrl: string
  matchesUrl?: string
}

const Email = ({
  firstName,
  yourListingLabel,
  matchedPropertyLabel,
  matchScore,
  matchUrl,
  matchesUrl,
}: Props) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New 1031 match{matchedPropertyLabel ? `: ${matchedPropertyLabel}` : ''}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>
              1031Exchange<span style={brandAccent}>UP</span>
            </Text>
          </Section>

          <Heading style={h1}>You've got a new match</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            A new match just came in on the 1031ExchangeUp network. Open it to review
            the fit, the numbers, and reach out to the other agent.
          </Text>

          <Section style={card}>
            {yourListingLabel && (
              <Text style={listItem}><b>Your listing:</b> {yourListingLabel}</Text>
            )}
            {matchedPropertyLabel && (
              <Text style={listItem}><b>Matched with:</b> {matchedPropertyLabel}</Text>
            )}
            {typeof matchScore === 'number' && (
              <Text style={listItem}><b>Match score:</b> {Math.round(matchScore)}/100</Text>
            )}
          </Section>

          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={matchUrl} style={button}>Open this match</Button>
          </Section>

          <Text style={paragraph}>
            Or view all your matches: <Link href={matchesUrl || matchUrl} style={link}>Go to Matches</Link>
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            You're getting this because a new match was found for one of your active listings.
          </Text>
          <Text style={footerSmall}>
            1031ExchangeUp · Agent-to-agent sourcing & referral network
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: any) =>
    data?.matchedPropertyLabel
      ? `New 1031 match: ${data.matchedPropertyLabel}`
      : 'New 1031 match on your listing',
  displayName: 'New match notification',
  previewData: {
    firstName: 'Alex',
    yourListingLabel: 'Sanchez portfolio — Austin, TX',
    matchedPropertyLabel: '12-unit multifamily — Phoenix, AZ',
    matchScore: 87,
    matchUrl: 'https://1031exchangeup.com/agent/matches?listing=abc&match=xyz',
    matchesUrl: 'https://1031exchangeup.com/agent/matches',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  color: '#1c1c1c',
}
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const brandBar = { paddingBottom: '16px' }
const brandText = { fontSize: '20px', fontWeight: 800, color: '#0e2a4d', margin: 0, letterSpacing: '-0.01em' }
const brandAccent = { color: '#43a047' }
const h1 = { fontSize: '26px', fontWeight: 800, color: '#1c1c1c', margin: '8px 0 16px', letterSpacing: '-0.01em' }
const paragraph = { fontSize: '15px', lineHeight: '1.6', color: '#333', margin: '0 0 14px' }
const listItem = { fontSize: '14.5px', lineHeight: '1.6', color: '#333', margin: '0 0 8px' }
const card = {
  backgroundColor: '#f5f4f2',
  borderRadius: '12px',
  padding: '20px 22px',
  margin: '18px 0',
}
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
