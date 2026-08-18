// TEMPORARY: fires a single sample admin-notification email to the operator
// inbox so each intake type can be visually verified. Recipient is hardcoded;
// no caller input can redirect it. Delete once verification is done.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTransactionalEmail } from '../_shared/send-transactional.ts'

const RECIPIENT = 'eamon.t.mckenna123@gmail.com'

type Sample = {
  eventType: string
  title: string
  summary: string
  details: Array<{ label: string; value: string }>
}

const SAMPLES: Record<string, Sample> = {
  agent_signup: {
    eventType: 'New agent signup',
    title: 'Test Agent just created an account',
    summary: '[TEST] A new agent finished signup on 1031ExchangeUp.',
    details: [
      { label: 'Name', value: 'Test Agent' },
      { label: 'Email', value: 'test.agent@example.com' },
      { label: 'Phone', value: '(617) 555-0142' },
      { label: 'Brokerage', value: 'Lyv Realty' },
      { label: 'License state', value: 'MA' },
      { label: 'MLS #', value: '9123456' },
    ],
  },
  investor_signup: {
    eventType: 'New investor signup',
    title: 'Test Investor just created an account',
    summary: '[TEST] A new investor / property owner finished signup on 1031ExchangeUp.',
    details: [
      { label: 'Name', value: 'Test Investor' },
      { label: 'Email', value: 'test.investor@example.com' },
      { label: 'Phone', value: '(508) 555-0119' },
      { label: 'Account type', value: 'Investor / property owner' },
    ],
  },
  landlord_referral: {
    eventType: 'New landlord referral request',
    title: 'Test Landlord requested a 1031 agent',
    summary: '[TEST] A landlord submitted the "Find me an agent" form.',
    details: [
      { label: 'Name', value: 'Test Landlord' },
      { label: 'Email', value: 'test.landlord@example.com' },
      { label: 'Phone', value: '(781) 555-0188' },
      { label: 'Location', value: 'Worcester, MA' },
      { label: 'Property type', value: 'Multifamily (6 units)' },
      { label: 'Est. value', value: '$1,250,000' },
    ],
  },
  new_listing: {
    eventType: 'New listing created',
    title: 'Test Agent listed 42 Beacon St, Somerville, MA',
    summary: '[TEST] A new replacement property was listed on 1031ExchangeUp.',
    details: [
      { label: 'Agent', value: 'Test Agent (test.agent@example.com)' },
      { label: 'Property', value: '42 Beacon St, Somerville, MA' },
      { label: 'Asset type', value: 'Multifamily' },
      { label: 'Units', value: '8' },
      { label: 'Asking price', value: '$2,450,000' },
      { label: 'Cap rate', value: '5.4%' },
    ],
  },
  demo_request: {
    eventType: 'New demo request',
    title: 'Test Requester booked a demo',
    summary: '[TEST] Someone submitted the Book a Demo form.',
    details: [
      { label: 'Name', value: 'Test Requester' },
      { label: 'Email', value: 'test.demo@example.com' },
      { label: 'Phone', value: '(617) 555-0177' },
      { label: 'Company', value: 'Multifamily Partners LLC' },
      { label: 'Role', value: 'Broker' },
      { label: 'Message', value: 'Would like to see how matching works for my clients.' },
    ],
  },
  event_registration: {
    eventType: 'New event registration',
    title: 'Test Attendee registered for the webinar',
    summary: '[TEST] Someone registered for an upcoming event.',
    details: [
      { label: 'Name', value: 'Test Attendee' },
      { label: 'Email', value: 'test.attendee@example.com' },
      { label: 'Phone', value: '(413) 555-0166' },
      { label: 'Event', value: '1031 Exchange Up - Live Q&A' },
    ],
  },
  support_ticket: {
    eventType: 'New support ticket',
    title: 'Test User submitted a support ticket',
    summary: '[TEST] A user opened a support request.',
    details: [
      { label: 'Name', value: 'Test User' },
      { label: 'Email', value: 'test.user@example.com' },
      { label: 'Phone', value: '(978) 555-0155' },
      { label: 'Category', value: 'Account' },
      { label: 'Subject', value: 'Cannot update my exchange criteria' },
      { label: 'Message', value: 'The save button does not respond on the criteria step.' },
    ],
  },
  listing_inquiry: {
    eventType: 'New listing inquiry',
    title: 'Test Investor inquired about 42 Beacon St, Somerville, MA',
    summary: '[TEST] An investor sent an inquiry on a matched listing.',
    details: [
      { label: 'Investor', value: 'Test Investor (test.investor@example.com)' },
      { label: 'Listing agent', value: 'Test Agent (test.agent@example.com)' },
      { label: 'Property', value: '42 Beacon St, Somerville, MA' },
      { label: 'Asset type', value: 'Multifamily' },
      { label: 'Asking price', value: '$2,450,000' },
      { label: 'Message', value: 'Interested - can you share the rent roll and recent expenses?' },
    ],
  },
  account_deletion: {
    eventType: 'Account deletion request',
    title: 'Test User requested account deletion',
    summary: '[TEST] A user requested that their account be deleted.',
    details: [
      { label: 'Name', value: 'Test User' },
      { label: 'Email', value: 'test.user@example.com' },
      { label: 'Role', value: 'Agent' },
      { label: 'Reason', value: 'No longer practicing in Massachusetts.' },
    ],
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  let kind = ''
  try {
    const body = await req.json()
    kind = typeof body?.kind === 'string' ? body.kind : ''
  } catch {
    kind = ''
  }

  const sample = SAMPLES[kind]
  if (!sample) {
    return new Response(
      JSON.stringify({ error: 'unknown kind', available: Object.keys(SAMPLES) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const res = await sendTransactionalEmail({
    templateName: 'internal-admin-notification',
    recipientEmail: RECIPIENT,
    idempotencyKey: `admin-test-${kind}-${Date.now()}`,
    templateData: sample,
  })

  return new Response(JSON.stringify({ kind, recipient: RECIPIENT, ...res }), {
    status: res.ok ? 200 : 502,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
