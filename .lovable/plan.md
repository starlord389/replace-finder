# Matches Page — UX Restructure & Layout Stabilization

Goal: make Matches feel like a CRM deal-review screen. Agent first picks an exchange/client, then reviews matches for it, then opens a property detail. Eliminate the cramped 3-column layout and all horizontal overflow.

## 1. Top context bar — Selected Exchange

New component: `src/features/matches/components/inbox/ExchangeContextBar.tsx`.

Renders above the inbox + detail grid, full-width inside the page container. Shows:
- Client name (e.g. "Marcus Rodriguez LLC")
- Relinquished property name / address
- Location (city, state)
- Relinquished value (`exchange_proceeds`)
- Days remaining to identification deadline (and closing deadline as secondary)
- Target criteria summary (geo + price band) — derived from `exchanges.target_*` columns where present, otherwise omitted gracefully
- "Change exchange" button → opens a `Popover`/`Command` list of the agent's exchanges (`useAgentExchangesQuery`) plus an "All exchanges" option at the top

Selection persists in the URL as `?exchange=<id>` (or `exchange=all`). Default = first active exchange the agent has.

When `exchange === "all"`, the bar shows a compact "All exchanges" summary (counts) and the inbox cards each surface a `Matched for {client}` subtitle. When a specific exchange is selected, that subtitle is omitted from the cards (it's already in the bar).

## 2. Filter relationships by selected exchange

In `AgentMatchesHub.tsx`, after `useUnifiedRelationships()`:

- Filter `rels` to `rel.buyerExchangeId === selectedExchangeId` unless `exchange === "all"`.
- Recompute `counts` and `visibleRels` against this filtered set so the chips reflect the exchange-scoped numbers.
- Auto-select the first match in the new set when the exchange changes.

## 3. New 2-column layout

Replace the 3-column grid with a stable 2-column shell:

```text
[ Context Bar — full width                                       ]
[ Inbox (lg: 380px, xl: 420px) | Property Detail (minmax(0,1fr)) ]
```

- Outer page: `flex h-[calc(100vh-7rem)] min-h-0 flex-col gap-4 overflow-hidden`.
- Grid: `grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)] gap-5 min-h-0 flex-1`.
- Both columns: `min-w-0 min-h-0` so they actually shrink and scroll instead of overflowing.
- Remove the permanent right Deal Room column entirely.

## 4. Property Detail header — actions inline + drawer

In `PropertyReviewPanel.tsx`:

- Hero stays `h-56 shrink-0`, image `object-cover`, status badge top-right.
- Header row: title + location + new client/exchange context line: `Matched for {clientName}'s 1031 exchange · {relinquishedAddress}` (omit segments that are missing).
- Right side of header: price / cap / score + **primary action** button (from `nextActionsFor(status).primary`) + **"All actions"** outline button.
- "All actions" opens a `Sheet` (right side) containing the existing `LifecycleTracker`, `NextActionCard`, `ClientSharingCard`, `AgentCommsCard`, and Archive/Not a Fit/Client Passed outcomes — this replaces today's `DealRoomPanel` column. We keep `DealRoomPanel.tsx` as-is and just mount it inside the Sheet.

Remove `hasSideActions`/`onOpenActions` branching — actions drawer is always the secondary surface.

## 5. Key metrics strip

Already present, keep the 6-card strip but extend to 8 metrics (NOI, Cap, CoC, DSCR, Occupancy, Required Equity, Est. Loan, Annual Cash Flow). On `lg` show `grid-cols-4`, on `2xl` show `grid-cols-8`. Compact padding `p-2.5`.

## 6. Tabs

Order: `Overview`, `Financials`, `Why This Matched`, `Documents`, `Activity`, `Conversation`.

- "Why This Matched" becomes its own tab (currently inside Overview). It uses `whyThisMatched(rel)` but each bullet is rewritten to reference the selected exchange's client / target criteria when available.
- "Conversation" tab embeds a compact `AgentCommsCard` so the agent doesn't have to open the drawer to reply.
- `TabsList`: `flex flex-wrap gap-1`, no `overflow-x-auto`. Only `TabsContent` scrolls (`overflow-y-auto`).

## 7. Scroll & overflow rules (applied everywhere)

- Every column wrapper: `min-w-0 min-h-0 overflow-hidden`.
- Inbox: search + filter chips `shrink-0`; list `flex-1 overflow-y-auto`.
- Property detail card: hero `shrink-0`, header `shrink-0`, metrics `shrink-0`, tabs container `flex-1 min-h-0`, tab content `overflow-y-auto`.
- No `overflow-x-auto` anywhere on the page.
- Filter chips wrap; "More" popover unchanged.
- Match cards: stable single-row layout, no width that depends on content (`min-w-0` on inner flex).

## 8. Inbox match card adjustments

`PropertyMatchCard.tsx`:
- Conditionally show `Matched for {clientName}` only when viewing All exchanges (prop `showClientLabel`).
- Show: thumbnail (64px), name, city/state, price, cap rate, NOI (computed), score chip, status pill. Compact, no horizontal scroll.

## 9. Responsive behavior

- `< md` (mobile): stack — context bar → exchange selector → match list → (when selected) detail page replaces list. Sticky bottom bar with primary action + "All actions". This already works; keep it.
- `md`–`lg` (tablet): single-column inbox collapses behind a "Matches" sheet trigger in the context bar; detail dominates full width.
- `lg+`: 2-column as described.

## 10. Files

**Created**
- `src/features/matches/components/inbox/ExchangeContextBar.tsx`

**Modified**
- `src/pages/agent/AgentMatchesHub.tsx` — exchange selection state, 2-col grid, drawer wiring, removes permanent Deal Room column
- `src/features/matches/components/inbox/PropertyReviewPanel.tsx` — header context line, inline primary + "All actions" button, new tab order with Why This Matched & Conversation, 8-metric strip
- `src/features/matches/components/inbox/InboxList.tsx` — accepts `showClientLabel`, passes through
- `src/features/matches/components/inbox/PropertyMatchCard.tsx` — conditional "Matched for" line, ensure NOI shown, lock overflow
- `src/features/matches/components/inbox/DealRoomPanel.tsx` — minor: render comfortably inside a Sheet (no outer border when in drawer)

**Unchanged**
- DB schema, auth, routing, sidebar, edge functions, `useUnifiedRelationships`, helpers, scoring logic
