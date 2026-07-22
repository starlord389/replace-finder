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
  firstName?: string
  location?: string
}

const Email = ({ firstName, location }: Props) => {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your agent referral request is in — here's what happens next.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>
              1031Exchange<span style={brandAccent}>UP</span>
            </Text>
          </Section>

          <Heading style={h1}>We got your request</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            Thanks for reaching out. We've received your request to be matched with a
            1031-savvy agent{location ? ` in ${location}` : ''}. A member of our team is
            already reviewing it.
          </Text>

          <Section style={card}>
            <Heading as="h3" style={h3}>What happens next</Heading>
            <Text style={listItem}><b>1. Review (within 1 business day).</b> We hand-pick agents based on your location, asset type, and timing.</Text>
            <Text style={listItem}><b>2. Introduction.</b> You'll receive an email introducing your matched agent, with their background and how to reach them.</Text>
            <Text style={listItem}><b>3. Kick off your exchange.</b> Your agent will help you identify replacement properties inside your 45- and 180-day windows.</Text>
          </Section>

          <Section style={card}>
            <Heading as="h3" style={h3}>About 1031ExchangeUp</Heading>
            <Text style={paragraph}>
              We're a private agent-to-agent network built specifically for 1031 exchanges.
              Instead of scrolling the MLS, our platform matches your requirements with
              off-market and exchange-ready listings surfaced by other licensed agents.
            </Text>
          </Section>

          <Text style={paragraph}>
            <b>Tip:</b> add <Link href="mailto:support@1031exchangeup.com" style={link}>support@1031exchangeup.com</Link> to your contacts so our
            introduction email doesn't land in spam.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            Questions? Just reply to this email — a real person will get back to you.
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
  subject: 'We got your request — your 1031 agent match is on the way',
  displayName: 'Referral acknowledgement',
  previewData: { firstName: 'Alex', location: 'Austin, TX' },
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
const h3 = { fontSize: '15px', fontWeight: 700, color: '#0e2a4d', margin: '0 0 10px' }
const paragraph = { fontSize: '15px', lineHeight: '1.6', color: '#333', margin: '0 0 14px' }
const listItem = { fontSize: '14.5px', lineHeight: '1.6', color: '#333', margin: '0 0 10px' }
const card = {
  backgroundColor: '#f5f4f2',
  borderRadius: '12px',
  padding: '20px 22px',
  margin: '18px 0',
}
const link = { color: '#0e2a4d', textDecoration: 'underline' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footer = { fontSize: '13px', color: '#626a75', lineHeight: '1.5', margin: '0 0 6px' }
const footerSmall = { fontSize: '12px', color: '#8a94a3', margin: 0 }
