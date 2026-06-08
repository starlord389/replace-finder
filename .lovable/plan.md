# Add Client → Property selector to the matches inbox toolbar

## Goal
Let the agent change which client + listing the inbox is viewing directly from the toolbar. Right now the per-listing workspace (`/agent/workspace/:exchangeId`) only exposes a sibling-property pill row for the *current* client. There's no way to pivot to a different client without leaving the page.

## Where it goes
`src/features/matches/components/inbox/InboxList.tsx` — add two new dropdowns at the very start of the toolbar (left of Search):

```text
[Client ▾] [Property ▾]  [⌕ Search…]   [Status ▾]  [Sort ▾]  [⚙ Filters]
```

- **Client dropdown** — lists every client the agent has at least one listing for. Shows the client name with a colored dot (using `getClientAccent`) and the listing count. Selecting a client jumps to that client's most recently active listing.
- **Property dropdown** — lists the listings for the currently selected client only. Shows property name + city/state + status pill. Selecting a listing routes to `/agent/workspace/:exchangeId` (clearing `?match=` so the inbox lands on the top match for that listing).
- Both controls use shadcn `DropdownMenu` for visual consistency with the new Status / Sort dropdowns.
- On mobile, the two selectors collapse into a single "Switch listing…" button that opens a sheet with the same client → property hierarchy.

The existing sibling-property pill row in `AgentWorkspace.tsx` becomes redundant once the toolbar can switch listings, so I'll remove it to keep the page clean. The breadcrumb stays.

## Data
Reuse `useAgentListings(user.id)` (already imported on the Listings page). It returns every exchange the agent owns with `clientId`, `clientName`, `propertyName`, `city`, `state`, `status`, `createdAt`. Group client-side:

```ts
clients: { clientId, clientName, accent, listings: AgentListing[] }[]
```

Sort clients alphabetically; sort each client's listings by `createdAt desc`. The current `exchangeId` selects the active client + listing in the dropdowns.

## Wiring
`InboxList` gets two new optional props so the per-listing scope still works:

```ts
clients?: ClientGroup[];          // all agent clients + their listings
activeClientId?: string | null;   // for highlighting current selection
activeExchangeId?: string;        // current listing being viewed
onSelectExchange?: (id: string) => void;  // navigates
```

`AgentWorkspace.tsx` calls `useAgentListings`, builds the grouped structure with `useMemo`, and passes everything to `InboxList`. `onSelectExchange` does `navigate('/agent/workspace/' + id)`.

When `clients` is not provided (no current callers, but keeps the prop optional), the selectors are simply not rendered — InboxList stays backward-compatible.

## Out of scope
- No new routes, no DB changes, no edge functions.
- No changes to the matching engine or `PropertyReviewPanel`.
- No multi-select; a client+listing combo is a single active context.
- Doesn't touch the `/agent/matches` index page — that page already groups by client → listing visually.

## Files
- `src/features/matches/components/inbox/InboxList.tsx` — add Client + Property dropdowns at the start of the toolbar, plus the mobile sheet fallback.
- `src/pages/agent/AgentWorkspace.tsx` — load `useAgentListings`, build grouped client list, pass to `InboxList`, remove the now-redundant sibling-property pill row.
