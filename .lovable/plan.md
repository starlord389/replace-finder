## Goal

Reframe Pipeline as a high-level kanban overview of listings by stage, and promote Workspace to a top-level nav section that owns all match/listing actions.

## Top nav order

Launchpad → Dashboard → My Clients → Pipeline → Workspace

## Pipeline (`/agent/pipeline`)

Rebuild as a kanban board, one column per stage:

- **New** — listings with no match activity / fresh matches
- **Interested** — at least one match in `interested` state
- **Connected** — at least one connection initiated/active
- **Closed** — exchange/listing closed

Each card = one listing (exchange), showing: client name + accent dot, property title, price/location, match count, last activity timestamp, top-stage chip. Click card → `/agent/workspace/:exchangeId`.

- Reuse `useUnifiedRelationships()` and `deriveUiStatus` to derive each listing's current stage from its matches.
- Aggregate by `buyerExchangeId`, take the furthest-along match status to place card in column.
- Read-only board (no drag). Header has a search + client filter.
- Remove the inbox-style row list from Pipeline; that work moves entirely to Workspace.

## Workspace (`/agent/workspace` and `/agent/workspace/:exchangeId`)

Promote to a top-level nav item.

- **`/agent/workspace`** — empty state: short helper copy + prominent **listing switcher** (searchable combobox of all the agent's listings, grouped by client). Recently opened listings shown as quick-pick chips.
- **`/agent/workspace/:exchangeId`** — unchanged from current implementation: breadcrumb (Client › Property), same-client property switcher pill row, property summary, `InboxList` of matches, `PropertyReviewPanel`, `DealRoomPanel`. This is where all match actions live.

## Routes

- `/agent/pipeline` — new kanban
- `/agent/workspace` — new empty/switcher landing
- `/agent/workspace/:exchangeId` — existing workspace page
- Existing redirects (`/agent/matches*`, `/agent/exchanges/:id`) stay pointed at workspace/pipeline as today.

## Files

**New**
- `src/pages/agent/AgentWorkspaceLanding.tsx` — empty state + listing switcher
- `src/features/pipeline/components/PipelineKanban.tsx` — board + columns
- `src/features/pipeline/components/PipelineListingCard.tsx` — kanban card
- `src/features/workspace/components/ListingSwitcher.tsx` — searchable combobox (reusable; the in-workspace switcher can adopt it too)

**Edit**
- `src/pages/agent/AgentPipeline.tsx` — swap inbox/list UI for `PipelineKanban`
- `src/components/layout/AgentTopNav.tsx` — add Workspace as 5th primary item
- `src/App.tsx` — add `/agent/workspace` route pointing to landing

**No changes**
- Scoring, matching engine, schema, RLS, edge functions
- `AgentWorkspace.tsx` (the per-listing page) and its child panels

## Link audit

- Dashboard KPIs, Launchpad CTAs, Help quick-start, client-overview property cards, redirect routes → confirm all property links still resolve to `/agent/workspace/:exchangeId`.
- Confirm Pipeline cards link to workspace, not legacy `/agent/matches/:id`.
- Final `rg` pass for stale `/agent/matches`, `/agent/exchanges/:id`, and inbox/hub strings.

## Out of scope

Drag-to-restage, bulk actions on cards, custom stage definitions, analytics changes.
