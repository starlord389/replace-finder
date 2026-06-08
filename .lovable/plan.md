## Goal

Replace the single "Workspace" top-nav item with two top-level nav tabs: **Listings** and **Matches**. The existing combined workspace landing page goes away.

## Nav changes (`src/components/layout/AgentTopNav.tsx`)

Replace:
```
{ title: "Workspace", url: "/agent/workspace", end: true }
```
with:
```
{ title: "Listings", url: "/agent/listings" },
{ title: "Matches", url: "/agent/matches" },
```

Pipeline, Dashboard, My Clients, Launchpad stay as-is.

## Routes (`src/App.tsx`)

- Remove `/agent/workspace` landing route. Keep `/agent/workspace/:exchangeId` (the per-listing review page) since that's where a listing card / match card deep-links into.
- Add `/agent/listings` → new `AgentListings` page (listings-only view: the `ListingSwitcher` grouped-by-client list + "New listing" button. Functionally what the previous "Listings" tab showed.)
- Add `/agent/matches` → new `AgentMatches` page (matches-only view: buyer-side matches grouped by client → listing, sorted by score, each card opens `/agent/workspace/:exchangeId?match=...`. Functionally what the previous "Matches" tab showed.)
- Anywhere `/agent/workspace` (the landing) is linked from (e.g. `AgentDashboard`, launchpad checklist, lastListing redirect), repoint to `/agent/listings`.

## Pages to add

- `src/pages/agent/AgentListings.tsx` — extracted from the current `AgentWorkspaceLanding.tsx` "listings" tab content (header + New Listing button + `<ListingSwitcher />` + empty state).
- `src/pages/agent/AgentMatches.tsx` — extracted from the current "matches" tab content (header + grouped client → listing match cards + empty state).

## File to delete

- `src/pages/agent/AgentWorkspaceLanding.tsx` — replaced by the two pages above.

## Out of scope

- No changes to the per-listing workspace page (`/agent/workspace/:exchangeId`), match review panel, action center, or data hooks.
- No DB / RLS / backend changes.
