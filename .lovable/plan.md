

## Build out the Help Center with full docs, FAQs, and ticket submission

Today `/agent/help` is a thin page: 5 FAQ items and a static support email. I'll turn it into a real help center with categorized documentation, expanded FAQs, a ticket submission form, and a view of the user's past tickets.

### What you'll see at `/agent/help`

A tabbed interface with 4 tabs:

**1. Getting Started** (default tab)
- Quick-start walkthrough cards: Set up your profile → Add your first client → Create an exchange → Pledge a property → Review matches → Connect with another agent
- Each card has a short description and a deep-link button into the relevant section of the app
- Glossary section explaining 1031 terminology: Boot, Like-Kind, Identification Period, Exchange Period, Qualified Intermediary, Replacement Property, Relinquished Property, Equal-or-Up Rule, Reverse Exchange, Improvement Exchange

**2. FAQs**
- Expanded from 5 → ~25 questions grouped by category with collapsible sections:
  - **Account & Setup** (4): adding clients, agent verification, brokerage settings, profile photo
  - **Exchanges** (5): create vs draft vs publish, editing exchanges, what fields are required, why an exchange might fail to publish, deleting exchanges
  - **Matching** (5): how scoring works (with link to the 6-dimension breakdown), why a property scored low, refreshing matches, boot calculation, hiding/passing on matches
  - **Connections & Messaging** (4): sending a connection request, what info is shared, accepting/declining, sending messages, marking as read
  - **1031 Rules & Deadlines** (4): 45/180-day rules, identification rules (3-property/200%/95%), like-kind requirements, qualified intermediary requirement
  - **Billing & Account** (3): pricing, canceling, data export
- Search box at the top filters FAQs live by keyword

**3. Documentation**
- Long-form guides rendered as collapsible sections with subheadings:
  - **Exchange Lifecycle Guide** — full walkthrough of statuses (draft → active → in_identification → in_closing → completed) with what each means and what triggers transitions
  - **Match Score Explained** — breakdown of all 6 dimensions (price 25% / geo 20% / asset 20% / strategy 15% / financial 10% / timing 10%) with examples
  - **Boot Calculation** — what cash boot and mortgage boot are, how the platform estimates them, when results are flagged "insufficient data"
  - **Pledged Property Best Practices** — what fields most affect match quality, how photos help, when to mark as off-market
  - **Working with Counter-party Agents** — etiquette for connections, what info gets shared at each stage, facilitation fees
  - **Security & Privacy** — how client data is protected, what other agents can see, RLS-backed access control
- Each guide has a "table of contents" sidebar linking to subsections (anchor scroll)

**4. Submit a Ticket**
- Form with fields:
  - **Category** (select): `Bug Report`, `Feature Request`, `Account Issue`, `Billing`, `General Question`
  - **Subject** (text, max 120 chars)
  - **Message** (textarea, max 2000 chars) — placeholder hints to include steps to reproduce for bugs
  - **Submit** button
- On submit: insert into `support_tickets` with `user_id = auth.uid()`, status defaults to `open`. Toast confirms, form resets.
- Below the form: **Your Tickets** section listing the user's previously submitted tickets with status badges (`open`, `in_progress`, `resolved`, `closed`), subject, category, date, and an expand toggle to reveal the message body, any admin notes, and a "Last updated" timestamp.
- Empty state: "You haven't submitted any tickets yet."
- Footer card stays: contact email + link to documentation

### How it works

**Frontend changes**
- `src/pages/agent/AgentHelp.tsx` — full rewrite using the existing `Tabs` component:
  - Tab state in URL hash (`#getting-started`, `#faqs`, `#docs`, `#tickets`) so deep links work
  - FAQ search uses simple `.toLowerCase().includes()` filter on question + answer
  - Docs use `Accordion` for collapsible sections with anchor IDs
- `src/features/support/hooks/useMyTickets.ts` (new) — React Query hook fetching `support_tickets` for `auth.uid()`, ordered by `created_at desc`
- `src/features/support/hooks/useSubmitTicket.ts` (new) — React Query mutation inserting a ticket, invalidating `["my-tickets"]`
- `src/features/support/types.ts` (new) — shared `TicketCategory` enum and helpers
- Validation with `zod`: subject 1-120 chars, message 1-2000 chars, category required
- Toast + form reset on success; inline field errors on validation failure

**Backend**
- No schema changes needed. `support_tickets` table already exists with the right RLS:
  - Users can `INSERT` their own (`auth.uid() = user_id`)
  - Users can `SELECT` their own
  - Admins see all (already wired into the existing `/admin/support` page)
- No new migration, no new edge function

**Optional client-side help (parallel)**
- `src/pages/client/Help.tsx` already exists. I'll mirror the same component structure there with client-appropriate FAQ wording (no agent-specific items like "pledged properties" or "counter-party connections"), and the ticket form works identically for clients.

### Files

| File | Change |
|---|---|
| `src/pages/agent/AgentHelp.tsx` | Full rewrite — 4-tab help center |
| `src/pages/client/Help.tsx` | Mirror with client-tailored FAQ copy |
| `src/features/support/hooks/useMyTickets.ts` | New — fetch user's tickets |
| `src/features/support/hooks/useSubmitTicket.ts` | New — submit ticket mutation |
| `src/features/support/types.ts` | New — categories, labels, status colors |
| `src/content/helpFaqs.ts` | New — structured FAQ data (categories + items) |
| `src/content/helpDocs.ts` | New — long-form documentation content |

### Out of scope

- Threaded back-and-forth replies on tickets (current schema supports `admin_notes` only — would need a `ticket_messages` table)
- File attachments on tickets
- Email notifications when admin updates a ticket (would need an edge function + outbox row)
- Public knowledge base (no auth) — current help is in-app only

