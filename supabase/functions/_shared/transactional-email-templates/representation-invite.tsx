import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  inviterName?: string
  recipientRole?: 'agent' | 'investor'
  inviteUrl?: string
}

const Email = ({ inviterName, recipientRole = 'investor', inviteUrl = 'https://1031exchangeup.com' }: Props) => {
  const agentInvite = recipientRole === 'agent'
  return (
    <Html lang="en"><Head /><Preview>{agentInvite ? 'An investor invited you to represent their 1031 exchange.' : 'Your agent invited you to connect your exchange workspace.'}</Preview>
      <Body style={main}><Container style={container}><Text style={brand}>1031Exchange<span style={accent}>UP</span></Text>
        <Heading style={heading}>{agentInvite ? 'Represent an investor' : 'Connect with your agent'}</Heading>
        <Text style={paragraph}><b>{inviterName || (agentInvite ? 'An investor' : 'An agent')}</b> invited you to work together on 1031ExchangeUp.</Text>
        <Section style={card}><Text style={paragraph}>{agentInvite ? 'Accepting gives you access to the exchanges assigned by the investor and lets you handle all communication with the agent on the other side.' : 'Accepting connects you with your agent while keeping you in control of your listings, matches, and exchange information.'}</Text></Section>
        <Button href={inviteUrl} style={button}>Review secure invitation</Button>
        <Text style={footer}>This invitation expires in 14 days and can only be accepted by the email address it was sent to.</Text>
      </Container></Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Props) => data.recipientRole === 'agent' ? 'An investor invited you to represent their exchange' : 'Your agent invited you to connect',
  displayName: 'Representation invitation',
  previewData: { inviterName: 'Alex Morgan', recipientRole: 'agent', inviteUrl: 'https://1031exchangeup.com/representation-invite?token=demo' },
} satisfies TemplateEntry

const main = { backgroundColor: '#f6f8fb', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", color: '#172033' }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', padding: '32px', borderRadius: '14px' }
const brand = { fontSize: '20px', fontWeight: 800, color: '#0e2a4d' }
const accent = { color: '#43a047' }
const heading = { fontSize: '26px', margin: '20px 0 12px', color: '#172033' }
const paragraph = { fontSize: '15px', lineHeight: '1.6', margin: '0 0 14px' }
const card = { backgroundColor: '#f5f7fa', padding: '18px', borderRadius: '10px', margin: '18px 0' }
const button = { backgroundColor: '#2f7a33', color: '#ffffff', padding: '12px 20px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }
const footer = { fontSize: '12px', lineHeight: '1.5', color: '#6b7280', marginTop: '24px' }
