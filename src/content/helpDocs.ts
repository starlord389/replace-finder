export interface DocSection {
  id: string;
  title: string;
  body: string;
}

export const AGENT_DOCS: DocSection[] = [
  {
    id: "exchange-lifecycle",
    title: "Exchange Lifecycle Guide",
    body: `Every exchange flows through a sequence of statuses. Understanding each stage helps you know what action to take next.

**Draft** — You're still gathering property details, financials, or replacement criteria. Drafts are private to you and don't appear to the matching engine. Save freely; nothing is shared yet.

**Active** — The exchange is queued for matching. Within minutes, the platform scores it against every pledged property in the network and surfaces the best fits. You and your client can review matches and start connections.

**In Identification** — The relinquished sale has closed. The 45-day identification window has started and is tracked automatically on the exchange detail page. Use the Identification List to formally identify up to 3 properties (or use the 200% / 95% rules).

**In Closing** — At least one identified property is under contract. Track inspection, financing, and closing milestones from the connection detail page.

**Completed** — The replacement closing has occurred. The exchange is locked for editing but remains in your history with the full audit trail.

**On Hold / Cancelled** — Use these when an exchange is paused or abandoned. You can re-open by moving back to Draft if no connections were accepted.`,
  },
  {
    id: "match-score",
    title: "Match Score Explained",
    body: `Every match has a total score from 0–100 derived from six weighted dimensions:

**Price Fit (25%)** — How close the property's asking price is to your replacement criteria's target band. A property at the midpoint of your range scores 100; one at the edge scores ~50.

**Geography (20%)** — State and metro overlap. An exact metro match scores 100; same state but different metro scores 60; out-of-state scores based on whether the state was in your acceptable list.

**Asset Type (20%)** — Exact asset-type match (e.g., multifamily ↔ multifamily) scores 100. Adjacent asset types (e.g., retail ↔ mixed-use) score partial credit.

**Strategy (15%)** — Strategy alignment (value-add, stabilized, ground-up, DST, TIC). Mismatched strategies still score if your criteria mark them acceptable.

**Financial Fit (10%)** — Cap rate, NOI, and occupancy compared to your criteria's targets.

**Timing (10%)** — Whether the property's availability window aligns with your client's identification and closing deadlines.

Adjust your replacement criteria to shift these weights — looser bands surface more matches; tighter bands raise quality and lower count.`,
  },
  {
    id: "boot-calculation",
    title: "Boot Calculation",
    body: `Boot is the taxable portion of an exchange. Two kinds:

**Cash Boot** — Exchange proceeds left over after acquiring the replacement property. If your client sold for $1M (with $700K in net proceeds after debt payoff) and buys a $600K property, the $100K difference is cash boot.

**Mortgage Boot** — A reduction in total debt. If the relinquished property carried $300K in debt and the replacement carries $200K, the $100K debt reduction is mortgage boot — even if no cash changed hands.

**How we estimate**: We use your exchange's exchange_proceeds and current debt against the candidate property's asking_price and typical debt ratios. Federal tax is estimated at the long-term capital gains + depreciation recapture rate.

**Insufficient data** appears when key fields (proceeds, current debt, or property price) are missing. Fill them in on the exchange detail page or pledged property to get an estimate.`,
  },
  {
    id: "pledge-best-practices",
    title: "Pledged Property Best Practices",
    body: `Properties you pledge are the supply side of the network. Higher-quality listings get more matches and better counter-party engagement.

**Fill every field you can.** The matching engine scores on asset type, strategy, cap rate, occupancy, and location — missing fields default to neutral and lower the score.

**Add at least 3 photos.** Listings with photos get ~3× more clicks from counter-party agents. The first photo is the cover image.

**Keep financials current.** Rent rolls, T-12 NOI, and operating expenses should reflect the trailing 12 months. Stale numbers reduce buyer confidence and can scuttle deals at LOI.

**Mark off-market promptly.** When a property goes under contract elsewhere, set its status to off-market so you don't get inbound on a deal that's gone.`,
  },
  {
    id: "counterparty-etiquette",
    title: "Working with Counter-party Agents",
    body: `**Initiating a connection.** Lead with a short note: what your client likes about the property and what's still in question (price, terms, timing). Connections with a personal message accept ~2× more often than empty requests.

**What's shared at each stage.**
- Pending request: your name, brokerage, your client's exchange overview (no client identity), and a note from you.
- Accepted: full property financials and documents, a private message thread, and your direct contact info.
- Under contract: closing milestones and document exchange.

**Facilitation fees.** If a deal closes through the platform, the optional facilitation fee splits between buyer and seller agents. Agree on terms before going under contract — the connection detail page tracks the agreement.

**Declining gracefully.** Use the decline reason field. It helps the other agent understand fit issues and improves matching quality over time.`,
  },
  {
    id: "security-privacy",
    title: "Security & Privacy",
    body: `**Your data is yours.** Clients, exchanges, and pledged properties are scoped to your agent ID. Other agents see only what's exposed through accepted connections.

**Row-level security.** Every database read is enforced server-side based on your authenticated identity. Even if a client-side bug exposed an ID, the database would reject the read.

**Client identity protection.** Client names and contact info are never shared with counter-party agents, even after a connection is accepted, unless you explicitly opt them in.

**Document access.** Property documents (rent rolls, OMs) are accessible only to agents with an accepted connection on that property. Access logs are kept for audit.

**Account security.** Use a strong unique password. We support Google sign-in and recommend enabling two-factor authentication on your Google account.`,
  },
];

export const GLOSSARY: { term: string; definition: string }[] = [
  { term: "Boot", definition: "The taxable portion of a 1031 exchange — typically leftover cash or a reduction in mortgage debt." },
  { term: "Like-Kind", definition: "All US real estate held for investment or business use is considered like-kind to other US real estate held for the same purpose." },
  { term: "Identification Period", definition: "The 45 days after closing the relinquished property during which replacement properties must be identified in writing." },
  { term: "Exchange Period", definition: "The 180 days after closing the relinquished property during which the replacement purchase must close." },
  { term: "Qualified Intermediary (QI)", definition: "A third party required by the IRS to hold proceeds between the sale of the relinquished property and the purchase of the replacement." },
  { term: "Replacement Property", definition: "The new property being acquired in the exchange." },
  { term: "Relinquished Property", definition: "The property being sold in the exchange." },
  { term: "Equal-or-Up Rule", definition: "To fully defer tax, the replacement property's value and debt must equal or exceed the relinquished property's." },
  { term: "Reverse Exchange", definition: "An exchange where the replacement property is acquired before the relinquished property is sold." },
  { term: "Improvement Exchange", definition: "An exchange where exchange proceeds are used to improve the replacement property as part of the acquisition." },
];
