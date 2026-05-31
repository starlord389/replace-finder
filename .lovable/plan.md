# Ranked Matches with Sort/Filter on Matches Page

Front-end only. No DB/schema/auth/routing changes. Uses existing `useUnifiedRelationships` data plus deterministic mock helpers in `inboxHelpers.ts`.

## 1. Enrich the Exchange Context Bar
File: `src/features/matches/components/inbox/ExchangeContextBar.tsx`

- Already shows client, relinquished property, value, ID deadline, target geo/price.
- Add: **Match count for current scope** (e.g. "14 matched opportunities") — passed in via new prop `matchCountInScope`.
- Enhance the "Change exchange" popover items to show, per exchange:
  - Client name
  - Property address / city, state
  - Match count for that exchange (computed from `rels` grouped by `buyerExchangeId`)
  - Best match score in that exchange
  - Days left to ID deadline (from a lightweight per-exchange context query — reuse existing exchange list; deadline already on `AgentExchangeRow`)
- Keep "All exchanges" item at top.

## 2. Sorting + filtering controls
New file: `src/features/matches/components/inbox/SortFilterBar.tsx`

- Sort dropdown (Best Match default, Highest NOI, Highest Cap, Highest CoC, Lowest Price, Best Timeline Fit, Newest, Status).
- "Filters" button opening a Popover with:
  - Minimum match score (slider 0–100)
  - Asset type (multi-select — based on values present in current scope; if none, hidden)
  - Market (state multi-select from current scope)
  - Price min / max
  - Status (reuse `UiStatus` chips)
- "Clear all" link inside popover; shows count of active filters next to button label.

State for sort/filters lives in `AgentMatchesHub` (URL params for sort: `?sort=best`; filter state kept in component state to avoid URL bloat; status filter already uses URL).

## 3. Ranked inbox + per-card rank badge
Files:
- `src/features/matches/components/inbox/InboxList.tsx` — accept already-sorted `rels` plus `rankMap: Map<id, number>`; pass `rank` to each card. Insert `SortFilterBar` above the list.
- `src/features/matches/components/inbox/PropertyMatchCard.tsx` — add:
  - `#N` rank pill (top-left of body row) when `rank` prop provided.
  - NOI line (already partly there) and a one-line "ranked-here reason" using new helper `rankReason(rel)`.
- New helper `rankReason(rel)` and `sortRelationships(rels, sortKey)` added to `inboxHelpers.ts`.

Default sort: `best_match` → descending by `score`. Stable tiebreak by `lastActivityAt`.

## 4. Hub wiring
File: `src/pages/agent/AgentMatchesHub.tsx`

- Read `sort` from URL (default `best_match`).
- Hold `filters` in `useState` (minScore, assetTypes, states, priceMin/Max). Apply filters AFTER exchange scoping and BEFORE status chip filter so counts stay correct.
- Compute `sortedRels = sortRelationships(filteredRels, sort)`.
- Build `rankMap` from `sortedRels` index (1-based).
- Pass `rankMap`, `sort`, `onSortChange`, `filters`, `onFiltersChange` into `InboxList`.
- Auto-select rank #1 when current selection drops out of scope/filters or when exchange scope changes (existing logic already falls back to first item; verify and ensure URL `id` is updated so detail panel reflects #1).
- Pass `rank` and `totalInScope` props into `PropertyReviewPanel`.

## 5. Property detail context line + rank panel
File: `src/features/matches/components/inbox/PropertyReviewPanel.tsx`

- Under the property title, add a small line:
  - "Matched for {clientName}'s 1031 exchange" or fallback to relinquished address.
  - "#{rank} of {totalInScope} matches · Score {score} · {short reason}".
- Improve/extend the existing "Why this matched" tab using `matchBreakdown(rel)` already in `inboxHelpers.ts`:
  - Render the 7 dimensions as horizontal bars with score labels.
  - Top explanatory paragraph: `"Ranked #N because it has the strongest combination of <top 3 dim labels>."` (derived from highest-scoring dimensions).
- No layout/scroll changes — keep the existing single internal scroll area.

## 6. No DB changes
All score breakdowns, asset type, NOI, CoC, timeline fit, rank reason continue to come from deterministic helpers in `inboxHelpers.ts`. Asset type filter falls back gracefully if asset type is not present on `Relationship` (we'll add an `assetType?: string | null` optional field derivation only if cheaply available; otherwise the asset filter is hidden until that field is wired).

## Files changed / created

Created:
- `src/features/matches/components/inbox/SortFilterBar.tsx`

Edited:
- `src/pages/agent/AgentMatchesHub.tsx` (sort/filter state, rank map, selection sync)
- `src/features/matches/components/inbox/InboxList.tsx` (sort/filter slot, ranks)
- `src/features/matches/components/inbox/PropertyMatchCard.tsx` (rank pill, reason line)
- `src/features/matches/components/inbox/PropertyReviewPanel.tsx` (context line, rank header, breakdown bars)
- `src/features/matches/components/inbox/ExchangeContextBar.tsx` (match counts, richer dropdown items)
- `src/features/matches/components/inbox/inboxHelpers.ts` (`sortRelationships`, `rankReason`, sort key types)

Mock/derived fields added (frontend only, no schema change):
- `rank` (computed per scope+sort)
- `rankReason` (heuristic string from score + price/timeline signals)
- `matchBreakdown` (already mocked — reused)
- Per-exchange `matchCount` / `bestScore` / `daysToIdDeadline` (computed client-side from existing query data)

## Acceptance checks
- Switching exchange in context bar updates list + auto-selects rank #1.
- Default order is by match score desc; sort dropdown changes order and rank numbers.
- Filters narrow the list and update counts.
- Detail panel shows "Matched for …" line and "#N of M" rank.
- Scroll/overflow behavior unchanged from current fixed layout.