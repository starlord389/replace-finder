# Exchange Workspace v2 — Phased Plan

Built behind a new route `/agent/matches-v2` so the existing `/agent/matches` keeps working until v2 is signed off. No DB, auth, role, or sidebar restructuring. Each phase ends in a working, demoable state and gets verified before the next phase starts.

---

## Phase 0 — Scaffolding & data mocks (foundation)

**Goal:** new route renders, mock data layer in place, no UI features yet.

Files created:
- `src/pages/agent/AgentExchangeWorkspace.tsx` — page shell only, inherits `AgentLayout`.
- `src/features/matches/v2/mocks/exchangeMocks.ts` — deterministic (hash-by-id) mock fields: `deadlineAt`, `daysRemaining`, `targetStates`, `targetPriceMin/Max`, `targetAssetTypes`, `relinquishedValue`, `exchangeStatus`, per-match `rank`, `rankReason`, `rankExplanation`, `clientSharingStatus`, `activityTimeline`. Single file — easy to swap for real columns later.
- `src/features/matches/v2/hooks/useWorkspaceExchanges.ts` — groups `useUnifiedRelationships` output by `buyerExchangeId`, merges client name + mock criteria, exposes `{ exchanges, byId, defaultExchangeId }`.

Files modified:
- `src/App.tsx` — register `/agent/matches-v2` (agent-guarded).
- `src/components/layout/AgentSidebar.tsx` — small "Workspace (beta)" sub-link under Matches (one line, no reorg).

Layout primitives committed up front (used by every later phase):
- Page root: `flex h-full min-h-0 flex-col overflow-hidden`.
- Body grid: `grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)]`.
- Every column: `min-h-0 min-w-0 overflow-hidden` wrapping one inner `overflow-y-auto overscroll-contain`.
- No `h-[calc()]`, no absolute positioning for layout, no max-heights that trap content.

Verify: route loads, no horizontal scrollbar at 1202px / 1440px / 768px / 390px, console clean.

---

## Phase 1 — Exchange context header + picker

**Goal:** agent always sees which client/exchange/relinquished property they're on, and can switch.

New components (`src/features/matches/v2/components/`):
- `ExchangeContextHeader.tsx` — client name, relinquished property + address, value, days-left chip (color by urgency), criteria summary, match count, best score, exchange status badge. Right side: `[Change exchange ▾]` `[View client]` `[Add note]`.
- `ExchangePickerDrawer.tsx` (`Sheet`) — list of all agent exchanges with: client, relinquished property/address, location, days remaining, match count, best score, status. Click → switch.

URL state added: `?exchange=<id>`.

On switch: queue + header + selection update together; best-ranked match auto-selected.

Verify: header truthfully reflects URL; switching exchanges updates everything; "Add note" stubs to a toast for now.

---

## Phase 2 — Ranked match queue

**Goal:** left column ranked best→worst with clear "why ranked here" reasons, sort, and compact filters.

New components:
- `RankedMatchQueue.tsx` — header (sort dropdown + filter popover trigger + count), scrollable card list, empty/loading states.
- `RankedMatchCard.tsx` — rank pill `#N`, score badge, property name, city/state, asset type, price, cap rate, NOI, status badge, italic `rankReason`, primary next-step label preview, selected/hover state.
- `QueueFilterPopover.tsx` — min score slider, asset type multi-select, market/state multi-select, price range, status chips. Compact.

Reuses: `sortRelationships`, `rankReason`, `rankExplanation`, `deriveUiStatus` from `inboxHelpers.ts`.

URL: `?sort=` (default `best_match`), `?id=<matchId>`. Filters in component state.

Verify: ranking is correct, sort changes order, filters narrow list, auto-select drops to new rank #1 when current selection filtered out, queue scrolls independently.

---

## Phase 3 — Selected match detail (header + metrics + tabs)

**Goal:** right column is a clean listing review with all property/financial info reachable.

New components:
- `SelectedMatchPanel.tsx` — single scroll container holding hero image, header block, action row, metric strip, tabs. No nested scroll.
- `MatchHeaderBlock.tsx` — name, location, price, asset type, status badge, score circle, `#N of M matches`, context line "Matched for {client}'s 1031 exchange", main reason paragraph from `rankExplanation`.
- `MatchActionRow.tsx` — status-driven primary CTA + "All actions" button + "Full details" link.
- `MetricStrip.tsx` — NOI, Cap, CoC, DSCR, Occupancy, Required Equity, Est. Loan, Projected Annual CF, $/unit or $/SF (when available). Mock-flag aware.
- `MatchTabs.tsx` — Overview, Why This Matched, Financials, Documents, Conversation, Activity. Reuses `WhyThisMatched`, `MatchBreakdownChart`, `AgentCommsCard`, existing financials grid.

CTA mapping (existing `UiStatus`):
- new → Send to Client · sent_to_client → Mark Client Interested · client_interested → Request Agent Intro · agent_connected → Open Conversation · reviewing_docs → Mark Offer Sent · loi → Mark Under Contract · under_contract → Mark Closed · closed/archived → no primary.

Verify: scroll the whole panel top→bottom, every tab content visible, no horizontal overflow, no clipped text, hero never traps scroll.

---

## Phase 4 — Actions drawer + Send-to-Client modal

**Goal:** all secondary actions live in a drawer, client sharing is a real modal flow.

New components:
- `ActionsDrawer.tsx` (`Sheet`) — hosts `LifecycleTracker`, `ClientSharingCard`, agent comms shortcuts, archive/lost outcomes (Client Passed, Not a Fit, Seller Unavailable, Property Under Contract, Exchange Expired, Archived), notes.
- `SendToClientModal.tsx` (`Dialog`) — client name, property summary, auto-generated paragraph, key financials block, optional note textarea, buttons: Send Email, Copy Client Link, Download One-Page PDF. Email + PDF stub to toast for now (real wiring out of scope).
- `QuickMessagePrompts.tsx` — the 6 canned prompts that prefill `AgentCommsCard` composer when clicked.

Verify: every secondary action reachable, lifecycle persists via existing `useMatchLocalState`, modal traps focus correctly, drawer scrolls.

---

## Phase 5 — Mobile/tablet, empty/loading/error states, polish

**Goal:** stable across breakpoints, clean states, design polish.

Work:
- Mobile (`< lg`): exchange selector first, queue second, detail third (push view via state), sticky primary action footer.
- Tablet (`lg`): queue collapses behind a left drawer trigger; detail dominant.
- Empty states: no exchanges, no matches in exchange, no matches after filter.
- Loading skeletons for header, queue, detail.
- Error boundaries on each major region (reuse `AppErrorBoundary` pattern).
- Visual pass: spacing, type hierarchy, selected/hover states, semantic tokens only (no raw colors), `cn` everywhere, all colors via `index.css` tokens.

Verify at 390 / 768 / 1024 / 1280 / 1440 / 1920 px. No horizontal scroll, no clipped content, queue + detail scroll independently.

---

## Phase 6 — Cutover decision (separate sign-off)

Not implemented automatically. After you approve v2:
- Either swap `/agent/matches` to render `AgentExchangeWorkspace` and redirect old subroutes,
- Or keep both and remove the beta link.
- Old files deleted in that phase only.

---

## Out of scope (all phases)
DB schema, auth, role guards, other roles' pages, `/agent/matches/:id`, sidebar restructuring beyond the one beta link, matching engine logic.

## Deliverables I will post after each phase
Files created, files modified, mock fields touched, manual verification checklist results, and confirmation the old `/agent/matches` is unchanged.
