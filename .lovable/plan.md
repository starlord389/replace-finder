## Goal

Replace the kanban Matches page with a premium **Match Inbox + Deal Room**: a 3-panel desktop layout that lets agents triage matches, review the property + numbers, and take the right next action — all without leaving the page.

```text
┌───────────────────────────────────────────────────────────────────────────┐
│  Filters: All · New · Sent · Interested · Connected · Offers · Closed ·…  │
├──────────────┬──────────────────────────────────┬─────────────────────────┤
│ INBOX (28%)  │  PROPERTY REVIEW (44%)           │ DEAL ROOM (28%)         │
│              │                                  │                         │
│ search       │  gallery / hero                  │ Lifecycle tracker       │
│ property card│  name · city · price · score     │                         │
│ property card│  status badge                    │ Next action (primary +  │
│ property card│  tabs: Overview · Financials ·   │   secondaries by stage) │
│ property card│        Match Breakdown · Docs ·  │                         │
│  …           │        Activity                  │ Client Sharing card     │
│              │  Why this matched (bullets)      │ Agent Communication     │
│              │  Financial metric cards          │   card (preview + quick │
│              │                                  │    messages + composer) │
└──────────────┴──────────────────────────────────┴─────────────────────────┘
```

## Scope

In: redesigning `/agent/matches`. Out: backend/matching changes, new tables, new routes (the existing `/agent/matches/:id` deep page stays as a "View full details" escape hatch), DnD, bulk actions.

Preserved as-is: AgentLayout, sidebar, auth, roles, routing, `useUnifiedRelationships`, `ThreadView`, all mutation endpoints, `/agent/matches/:id` page.

## UX model

Mental model: **Find match → Review numbers → Send to client → Connect with agent → Move forward or archive.**

Status taxonomy (UI-facing, mapped from existing stages + 3 new client-share sub-states held in local state / `localStorage` until backend fields exist):

| UI status            | Source                                                                 |
|----------------------|------------------------------------------------------------------------|
| New Match            | `stage = new` / `incoming`                                             |
| Sent to Client       | local flag `sentToClientAt` (mock until DB field)                      |
| Client Interested    | local flag `clientInterestedAt` (mock)                                 |
| Agent Connected      | `stage = connected` / `conversing`                                     |
| Reviewing Docs       | `stage = conversing` + local flag `reviewingDocs`                      |
| LOI / Offer          | local flag `loiSentAt` (mock; later → connection milestone)            |
| Under Contract       | `connection.under_contract_at` not null                                |
| Closed               | `stage = closed_won`                                                   |
| Archived             | `stage = closed_lost` OR local `archivedAt`                            |

Mock flags persist via a small `useMatchLocalState(matchId)` hook backed by `localStorage` so the lifecycle feels real for demo without a migration.

## Files

### New (`src/features/matches/components/inbox/`)
- `InboxList.tsx` — search input + filter tabs row + scrollable list of `PropertyMatchCard`
- `PropertyMatchCard.tsx` — property-first card: thumb, name, city/state, price, asset type, score chip, cap rate, NOI, status badge, next-action label
- `PropertyReviewPanel.tsx` — center: gallery placeholder, header, status badge, **Why this matched** bullets, financial metric cards grid (Price, NOI, Cap, CoC, DSCR, Occupancy, Required Equity, Est. Loan, Projected Cash Flow), tabs (Overview / Financials / Match Breakdown / Docs / Activity)
- `WhyThisMatched.tsx` — derives bullets from match score dimensions + boot status + price/timeline
- `MatchBreakdownChart.tsx` — category bars (Location, Price, Equity, Debt, Timeline, Asset, Return) using existing score breakdown where present, mocked weights otherwise
- `DealRoomPanel.tsx` — right: lifecycle tracker, stage-aware Next Action stack, Client Sharing card, Agent Communication card
- `LifecycleTracker.tsx` — horizontal step rail with current step highlighted; side-exit chips (Not a Fit · Client Passed · Seller Unavailable · Archived)
- `NextActionCard.tsx` — renders primary + secondaries from a stage→actions map; wires to existing mutations when available, otherwise local-state transitions
- `ClientSharingCard.tsx` — Send to Client (opens dialog → marks `sentToClientAt`), Copy Client Link (toast + clipboard), Download One-Page Summary (mock PDF — generate simple `Blob` placeholder), Add Agent Note (textarea persisted to local state)
- `AgentCommsCard.tsx` — wraps `ThreadView` in connected state, shows locked CTA otherwise; quick-message buttons inject canned text into the composer (uses new `initialDraft` prop on ThreadView)
- `useMatchLocalState.ts` — `localStorage`-backed hook for mock lifecycle flags + agent notes per matchId
- `inboxHelpers.ts` — `deriveUiStatus(rel, local)`, `nextActionFor(status)`, `whyThisMatched(rel)`, financial mock fillers

### Edited
- `src/pages/agent/AgentMatchesHub.tsx` — replace `PipelineBoard` + `RelationshipDrawer` with the new 3-panel layout; keep `?id=` URL sync, search, and filter tabs; tablet → 2-panel (inbox + detail) with right panel as Sheet; mobile → stacked with sticky primary action bar
- `src/features/messages/components/ThreadView.tsx` — add optional `initialDraft?: string` prop so quick-message buttons can prefill the composer
- `src/features/matches/components/helpers.tsx` — add UI status taxonomy + label/colour map (extends current `StageBadge`)

### Removed (no longer used by the hub)
- `PipelineBoard.tsx`, `PipelineColumn.tsx`, `RelationshipCard.tsx`, `RelationshipDrawer.tsx`, `ContextPanel.tsx`, `StageActionButton.tsx` (kanban-era components — delete after the new layout is wired)

## Mock / placeholder data

Where real fields don't exist, we mock minimally and clearly:
- Financial metrics not in `property_financials` (CoC, DSCR, Occupancy, Required Equity, Est. Loan, Projected Cash Flow) → derived from `asking_price` + `cap_rate` with documented formulas in `inboxHelpers.ts`; each mocked value tagged `est.` in the UI tooltip
- Documents tab → empty state with "No documents shared yet" + disabled upload button
- Activity tab → reuses connection + message timeline already available; falls back to "Match created" event
- Client share link → generated as `/share/match/{matchId}` (route stub returning placeholder page is out of scope; button copies the URL and toasts)
- One-pager PDF → client-side `Blob` with a simple text summary (no server), so the button works end-to-end

## Responsive

- ≥1280px: 3 columns (28% / 44% / 28%)
- 768–1279px: inbox + center; right Deal Room opens as Sheet via "Take action" button
- <768px: single column stacked (filters → cards). Tapping a card pushes detail view with sticky bottom bar showing the stage's primary action

## Design

Stays on locked tokens (Inter, blue-600 primary, light theme). Cards use `bg-card` + `border-border`, hover → `shadow-sm` + `border-primary/30`. Status badges reuse existing colour ramp; score chip keeps emerald/amber/rose ramp. Generous spacing, single H1, semantic HTML.

## Validation

- Verify build + console clean on `/agent/matches`
- Smoke: open a match → tabs switch, Why-bullets render, financial cards populated, quick-messages prefill composer, Send to Client flips status locally, lifecycle tracker reflects change
- Tablet + mobile breakpoints visually checked via preview viewport
