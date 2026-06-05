# Client Workspace

Goal: clicking a client in **My Clients** opens a focused workspace for that one client. Global Dashboard and global Matches stay untouched.

## Routing

- New route: `/agent/clients/:clientId` → `AgentClientWorkspace.tsx` (overview).
- Move existing edit form to `/agent/clients/:clientId/edit` → keep `AgentClientDetail.tsx` as the edit page (no behavioral change; just a URL change).
- `/agent/clients/new` continues to use `AgentClientDetail` (create form).
- In `AgentClients.tsx`, the row `<Link to={...}>` already points to `/agent/clients/:id` — it now lands on the workspace instead of the edit form. No code change needed there.

## Page layout

```
AgentClientWorkspace
├── Header (accent-colored)
│   ├── ● Client Name   [status badge]   [Edit client] [Invite] [New exchange]
│   ├── email · phone · company
│   └── Counts: N listings · N matches · N active deals
└── Tabs (shadcn Tabs)
    ├── Listings  → ClientListingsTab
    ├── Matches   → ClientMatchesTab
    └── Deal      → ClientDealTab
```

Header uses `getClientAccent(clientId)`:
- left border `accent.borderLeft` (border-l-[4px]) on the header card
- accent dot before the name (`accent.dot`)
- accent soft chip behind the status badge area (`accent.soft` + `accent.fg`)

`Edit client` button → `/agent/clients/:clientId/edit`. The existing **Invite to Platform** and **Deactivate** controls remain on the edit page; we surface only `Edit client` from the workspace header (no duplicate UI).

## Tabs — reuse, don't rebuild

### 1. Listings tab
Fetch `pledged_properties` for the client's exchanges (join via `exchanges.relinquished_property_id` and any other pledged properties tied to the client through `agent_clients.id` → `exchanges.client_id`). Render with the same card visual used on `AgentExchanges.tsx` (cover image, address, asset type, asking price, cap rate). Reuse `propertyImage()` and `ASSET_TYPE_LABELS`. Link each card to `/agent/exchanges/:id` (existing detail).

### 2. Matches tab — pre-scoped, no client filter shown
Reuse the **exact** Matches Hub composition but lift the scope:
- Reuse `useUnifiedRelationships()` and filter client-side: `rels.filter(r => r.clientId === clientId)`.
- Reuse `InboxList` (left), `PropertyReviewPanel` (right), `DealRoomPanel` (slide-out via `Sheet`) — all unchanged.
- Hide the `ExchangeContextBar` (we're already scoped). Optionally show a small sub-scope picker if the client has >1 exchange (filter by `buyerExchangeId`) — reuses the same component with `selectedClientId` locked.
- The `hideClientLead` prop already on `PropertyMatchCard` lets us suppress the client lead line inside the workspace (since the page header already shows the client). Cards keep the accent left-border.

Effectively this tab is `<AgentMatchesHub>` re-rendered with `?client=:clientId` baked in and the picker suppressed. Cleanest implementation: extract the body of `AgentMatchesHub` into `<MatchesWorkspace clientId={clientId} hideContextBar />` and have both pages render it. If extraction is risky, keep `AgentMatchesHub` as is and write a thin `ClientMatchesTab` that imports `InboxList` + `PropertyReviewPanel` directly — same components, ~80 lines of glue.

### 3. Deal tab
Filters `useAgentExchangesQuery()` (or `exchanges` table) to `client_id = :clientId` AND status in active deal states (`active`, `under_contract`, `in_identification`, etc. — whatever the existing "live" filter on `AgentExchanges` uses). For each:
- Show the existing exchange card (reused from `AgentExchanges.tsx`).
- For any matches with `connectionId` (i.e. connected/in deal room), expose **Open deal room** which mounts the existing `DealRoomPanel` inside a `Sheet` — identical to how `AgentMatchesHub` opens it today.

No new "deal" entity is created; "Deal" is just the connected/in-progress slice of this client's matches + their exchanges.

## Scoping logic (summary)

| Tab | Source | Filter |
|---|---|---|
| Listings | `pledged_properties` via `exchanges.client_id = :clientId` | — |
| Matches | `useUnifiedRelationships()` | `r.clientId === clientId` |
| Deal | exchanges + relationships | `clientId === :clientId` AND (`connectionId != null` OR exchange in active status) |

## Components reused (no changes)
`InboxList`, `PropertyMatchCard`, `PropertyReviewPanel`, `DealRoomPanel`, `NextActionCard`, `ClientSharingCard`, `AgentCommsCard`, `LifecycleTracker`, `ClientLeadLine`, `getClientAccent`, exchange card markup from `AgentExchanges`, `propertyImage`, `ASSET_TYPE_LABELS`.

## Out of scope
- No scoring / matching changes.
- No schema changes.
- No changes to global Dashboard or global Matches Hub.
- `AgentClientDetail` edit form keeps all current functionality; only its URL moves to `/edit`.

## Files

New:
- `src/pages/agent/AgentClientWorkspace.tsx`
- `src/features/clients/components/ClientWorkspaceHeader.tsx`
- `src/features/clients/components/ClientListingsTab.tsx`
- `src/features/clients/components/ClientMatchesTab.tsx`
- `src/features/clients/components/ClientDealTab.tsx`

Edited:
- `src/App.tsx` — add `/agent/clients/:clientId` (workspace) and `/agent/clients/:clientId/edit` (existing detail). Keep `/agent/clients/new`.
- `src/pages/agent/AgentClientDetail.tsx` — small: change the back link target if needed; no logic changes.

## Review checkpoints
1. Route shape: `/agent/clients/:clientId` = workspace, `/agent/clients/:clientId/edit` = current form. OK?
2. Matches tab implementation: extract a shared `MatchesWorkspace` so both the global hub and the client workspace render the same body, vs. a thin glue component reusing `InboxList` + `PropertyReviewPanel`. Preference?
3. "Deal" tab scope = this client's exchanges in active statuses + their connected matches (deal-room accessible). OK, or do you want it limited strictly to matches with an open `connectionId`?
