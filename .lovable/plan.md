# Matches tab: open full review on click + redesign search/filter

## Goal
Two changes, both UI-only in `src/pages/agent/AgentMatches.tsx` and `src/features/matches/components/inbox/InboxList.tsx`. No backend, no business logic, no schema changes.

## 1. Clicking a match opens the full workspace inbox

Right now `AgentMatches.tsx` already navigates to `/agent/workspace/:exchangeId?match=:matchId` on card click (see `openMatch`). The screenshot in the request *is* that destination page (`AgentWorkspace.tsx` — breadcrumb, listing summary, left inbox, right `PropertyReviewPanel`). So clicking already lands on the right page; we just need to make sure each match card on the Matches index reliably opens it with the correct `?match=` selected.

Concrete tweaks:
- Keep current grid grouping (client → listing → cards) on `/agent/matches` as the index view.
- On card click, navigate to `/agent/workspace/:buyerExchangeId?match=:matchId` (already wired). Verify the workspace selects that match on first render even before the visible-filter computation runs — if `?match=` is present, prefer it over `visibleRels[0]` so the user always lands on the property they clicked, not the top-ranked one. Small adjustment inside `AgentWorkspace.tsx`'s `selected` memo.
- Add a subtle hover affordance ("Open match →") on `PropertyMatchCard` when used from `/agent/matches` so it's obvious clicking opens the full page.

## 2. Redesign the search / filter header

The current header (in `InboxList.tsx`) stacks: a full-width search input, then a row of chip filters (All / New / Interested / Connected / Closed / More), then a separate Sort + Filters bar. It feels generic and noisy.

New header — one compact, cohesive toolbar:

```text
┌─────────────────────────────────────────────────────────────┐
│ [⌕ Search…]   [Status ▾]   [Sort: Best ▾]   [⚙ Filters (2)]│  ← single row
│                                                             │
│ Active: [Status: New ✕] [State: NC ✕]      Showing 4 of 12 │  ← chip bar (only when filters active)
└─────────────────────────────────────────────────────────────┘
```

Specifics:
- **Search input**: smaller (h-9 → h-9 but inline), grows to fill remaining space, placeholder "Search property, city, or client…", with a clear-on-focus `⌘K` style hint and a small ✕ button when value is non-empty. Debounced visually (no behavior change).
- **Status dropdown** replaces the chip strip + "More" popover. Single dropdown showing all statuses with their counts inline (`All · 4`, `New · 4`, `Interested · 0`, …). Active status shows as the dropdown label. This collapses the two-row tab/popover combo into one control and removes the awkward "More" overflow.
- **Sort dropdown**: same shadcn `DropdownMenu` style as Status for visual rhythm.
- **Filters button**: keep the existing filters popover (price/state/score), but show a numeric badge for active filter count.
- **Active-filters chip row** (only rendered when any filter is set, including status ≠ all or search ≠ ""): a thin row of removable chips so the user sees at a glance what's narrowing the list, plus a "Clear all" link. Right-aligned "Showing N of M".
- Visually: one bordered container (`rounded-lg border bg-card`), single 12px padding, items separated by `gap-2`. No second border line between rows — the active-chip row is inside the same container, separated by a hairline only when present.

The "Group by client" toggle stays where it is (it's contextual and used inside per-listing workspace).

## Files

- `src/features/matches/components/inbox/InboxList.tsx` — replace the search + chips + sort/filter blocks with the new single-row toolbar + active-filters chip row. Keep the same props API so `AgentWorkspace.tsx` doesn't change.
- `src/pages/agent/AgentMatches.tsx` — minor: ensure card click still routes to workspace with `?match=`; optionally surface a small "Open" hint on hover.
- `src/pages/agent/AgentWorkspace.tsx` — tiny fix in the `selected` memo so an incoming `?match=` is honored even when that match would otherwise be the first row.

## Out of scope
- No changes to `PropertyReviewPanel`, action center, lifecycle, or any data hooks.
- No DB / RLS / edge function changes.
- No new routes.
