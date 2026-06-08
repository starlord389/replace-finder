# Add a global matches view across all clients & listings

## Goal
Right now the inbox+review layout only exists inside `/agent/workspace/:exchangeId`, which is always scoped to one client and one listing. Add a "global" mode that shows matches across every client and listing the agent owns, while keeping the per-listing workspace intact.

## Where it lives
Upgrade `/agent/matches` from the current grouped card index into the full inbox + review layout. That route already exists, is already in the top nav, and conceptually means "all matches" — perfect home for the global view.

```text
/agent/matches                → global inbox (all clients, all listings)
/agent/workspace/:exchangeId  → per-listing inbox (unchanged)
```

## What the global view shows
- Same `InboxList` (left) + `PropertyReviewPanel` (right) layout as the workspace.
- Scope = every `Relationship` where `mySide === "buyer"` (i.e. matches against the agent's own listings).
- The toolbar's Client → Property switcher is the pivot:
  - Client dropdown gets an "All clients" option at the top.
  - Property dropdown gets an "All properties" option at the top (only enabled when a client is selected; when "All clients" is chosen, the property dropdown is disabled and reads "All properties").
  - Picking a specific client + property navigates to `/agent/workspace/:exchangeId` so the user drops into the focused per-listing view.
  - Picking "All clients" from inside a workspace navigates back to `/agent/matches`.
- Since matches now span multiple clients, the inbox cards show the client lead line (we pass through `hideClientLead={false}`), and `groupByClient` is enabled by default with a toggle to flip it off.
- The breadcrumb + property summary strip (specific to one listing) are hidden in global mode. A simple page header "All matches · N across M listings" replaces them.

## Selection state in global mode
- Selected match is stored in `?match=:matchId` on `/agent/matches`, same pattern as workspace.
- Clicking a card on the left selects it on the right (in-place); it does *not* jump to the per-listing workspace. A small "Open in workspace ↗" link in the review panel header lets the user pivot when they want the focused per-listing context.
- Status / Sort / advanced Filters work identically; counts are computed across the global scope.
- Search field gains "client" as a searchable field (already in the placeholder) — already covered.

## Wiring
- New page `src/pages/agent/AgentMatches.tsx` is rewritten to use `useUnifiedRelationships` for buyer-side rels, plus `useAgentListings` to build the same `InboxClientGroup[]` used by the workspace. It renders `<InboxList>` and `<PropertyReviewPanel>` with the same sort/filter/search state and URL `?match=` selection.
- `InboxList`'s `clients` data gets two synthetic entries surfaced at the top of each dropdown:
  - `{ clientId: "__all", clientName: "All clients", listings: [] }` (special-cased in the row)
  - Inside each real client group, an "All properties" sentinel listing.
  - The switcher row gains an `onSelectAll?: () => void` prop (navigates to `/agent/matches`) and an `onSelectAllPropertiesForClient?: (clientId) => void` (filters the global list to that client without leaving `/agent/matches`).
- On `/agent/matches`, the switcher's client + property selections become local filter state (which client / which listing to scope the global list to) instead of navigation. Picking a concrete property does navigate to `/agent/workspace/:exchangeId`.
- The old `/agent/matches` card-grouping layout goes away; its empty-state copy moves into the new page.

## Out of scope
- No DB / RLS / edge function changes.
- No new endpoints; reuses `useUnifiedRelationships` and `useAgentListings`.
- Seller-side matches stay out of this view (still buyer-only, same as today).
- No multi-listing bulk actions; selections are still single-match.

## Files
- `src/pages/agent/AgentMatches.tsx` — rewrite to inbox + review layout, global scope by default, with optional client/listing scope via the toolbar.
- `src/features/matches/components/inbox/InboxList.tsx` — add "All clients" / "All properties" entries to the switcher, plus the two new optional callbacks. Keep all existing props backward-compatible so `AgentWorkspace` keeps working as-is.
- `src/pages/agent/AgentWorkspace.tsx` — when the toolbar picks "All clients", call `navigate('/agent/matches')` (wire the new prop).
