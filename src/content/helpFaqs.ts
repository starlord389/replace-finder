export interface FaqItem {
  q: string;
  a: string;
}
export interface FaqCategory {
  category: string;
  items: FaqItem[];
}

export const AGENT_FAQS: FaqCategory[] = [
  {
    category: "Account & Setup",
    items: [
      { q: "How do I add a client?", a: "Go to My Clients → Add Client. Fill in their contact info and any notes about their exchange goals. Clients you add are private to you — other agents can't see them." },
      { q: "How does agent verification work?", a: "Agents self-certify at signup by providing their license or MLS information. Your workspace becomes active immediately — there's no manual review queue." },
      { q: "How do I update my brokerage info?", a: "Settings → Profile. Changes to your name and brokerage appear on your public agent card the next time another agent views one of your matches." },
      { q: "Can I invite team members?", a: "Each agent has their own workspace. Multi-seat brokerage accounts are on the roadmap — submit a ticket if you'd like early access." },
    ],
  },
  {
    category: "Exchanges",
    items: [
      { q: "What's the difference between draft and active?", a: "Draft exchanges aren't visible to the matching engine — use them while you collect property details. Active exchanges are queued for matching as soon as you publish them." },
      { q: "How do I edit an exchange after creating it?", a: "Open the exchange detail page and click Edit. The wizard re-opens prefilled with everything except the client (the client is locked once an exchange exists)." },
      { q: "Can I move an active exchange back to draft?", a: "Yes, as long as no agent has accepted a connection on it yet. Use the Save as Draft button on the detail page." },
      { q: "Why can't I publish my exchange?", a: "Publishing requires a relinquished property and replacement criteria to be filled in. The Review step shows what's missing." },
      { q: "Can I delete an exchange?", a: "Only fresh drafts (no matches generated yet) can be deleted. Once matches exist we keep the exchange for audit purposes — you can move it back to draft instead." },
    ],
  },
  {
    category: "Matching",
    items: [
      { q: "How does the match score work?", a: "Six weighted dimensions: price (25%), geography (20%), asset type (20%), strategy (15%), financial fit (10%), timing (10%). See Documentation → Match Score Explained for the full breakdown." },
      { q: "Why did a property score low even though it looks like a good fit?", a: "Most often it's the price band or geography weighting. Tightening or loosening your replacement criteria changes scores immediately on the next match run." },
      { q: "How often do new matches appear?", a: "Matches refresh automatically when you publish or edit an exchange, when a counter-party agent pledges a new property, and on a daily schedule." },
      { q: "What is boot and how is it calculated?", a: "Boot is the taxable portion of an exchange — cash boot (leftover proceeds) plus mortgage boot (debt reduction). The platform estimates both from your exchange financials and the candidate property's price/debt. Marked 'insufficient data' if either side is missing key fields." },
      { q: "Can I hide matches I'm not interested in?", a: "Open the match detail page and use Pass. Passed matches stay visible but are filtered out of the default view." },
    ],
  },
  {
    category: "Connections & Messaging",
    items: [
      { q: "How do I start a connection with another agent?", a: "Open a match you're interested in and click Initiate Connection. The other agent gets a notification and can accept or decline." },
      { q: "What information is shared at each stage?", a: "Pending: your name, brokerage, and the exchange/property in question. Accepted: full property details, financials, and a private message thread. Client identity is never shared without explicit opt-in." },
      { q: "How do messages work?", a: "Once a connection is accepted, both agents can chat from the connection detail page or the unified Messages inbox in the sidebar." },
      { q: "Why can't I see my messages in the Messages tab?", a: "The inbox only shows accepted connections with at least one message. Pending connections don't appear until they're accepted." },
    ],
  },
  {
    category: "1031 Rules & Deadlines",
    items: [
      { q: "What are the 45 and 180-day rules?", a: "After your relinquished sale closes, you have 45 days to identify replacement properties in writing and 180 days to close on at least one. The platform tracks both deadlines automatically once you set the sale close date." },
      { q: "What are the identification rules?", a: "Three options: identify up to 3 properties (any value), identify any number whose total value ≤ 200% of the relinquished property, or identify any number provided you acquire ≥ 95% of total identified value." },
      { q: "What counts as 'like-kind'?", a: "All US real estate held for investment or business use is considered like-kind to other US real estate held for the same purpose. Personal-use property and inventory don't qualify." },
      { q: "Do I need a Qualified Intermediary?", a: "Yes — the IRS requires a QI to hold proceeds between sale and purchase. The taxpayer can never directly receive the funds. Add your QI in the exchange detail page." },
    ],
  },
  {
    category: "Billing & Account",
    items: [
      { q: "How is the platform priced?", a: "See the Pricing page for current plans. Active plans during the beta period include unlimited exchanges and matching." },
      { q: "Can I cancel anytime?", a: "Yes — cancel from Settings → Billing. Your workspace stays read-only for 30 days after cancellation so you can export data." },
      { q: "How do I export my data?", a: "Settings → Data Export generates a CSV of your clients, exchanges, and connections. Submit a ticket if you need a custom export format." },
    ],
  },
];

export const CLIENT_FAQS: FaqCategory[] = [
  {
    category: "Getting Started",
    items: [
      { q: "How do I submit an exchange request?", a: "From your dashboard, click New Request and walk through the 7-step form. Your agent will be notified and can review with you before publishing." },
      { q: "How long until I see matches?", a: "Most clients see initial matches within 24 hours of their request being published. New properties are scored continuously as they enter the network." },
    ],
  },
  {
    category: "1031 Rules",
    items: [
      { q: "What are the 45 and 180-day deadlines?", a: "From the day your relinquished property sale closes, you have 45 days to identify replacement properties and 180 days to close." },
      { q: "What is boot?", a: "The taxable portion of your exchange — typically leftover cash or a reduction in mortgage debt. We highlight estimated boot on every match so you know the tax impact." },
      { q: "Do I need a Qualified Intermediary?", a: "Yes, the IRS requires one. Your agent can recommend QIs they trust." },
    ],
  },
  {
    category: "Account",
    items: [
      { q: "How do I update my profile?", a: "Settings → Profile. Your contact info is only visible to your agent." },
      { q: "Who can see my information?", a: "Only your agent and platform admins. Counter-party agents never see your name or contact details unless you explicitly opt in." },
    ],
  },
];
