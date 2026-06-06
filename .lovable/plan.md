
# Three-Section Restructure: My Clients · Pipeline · Workspace

No scoring, matching, or schema changes. This is re-routing + re-composition of components that already exist.

---

## 1. Top-nav

`AgentTopNav.tsx` `PRIMARY_NAV`:

1. Launchpad
2. Dashboard
3. **My Clients** → `/agent/clients`
4. **Pipeline** → `/agent/pipeline`

Workspace is intentionally *not* a top-level nav item — it's only reached by clicking a property from My Clients or Pipeline, and breadcrumbs lead back out.

---

## 2. Routes

```text
/agent/clients                        My Clients list (existing)
/agent/clients/:clientId              Client overview (REBUILT — profile + property cards, no tabs)
/agent/clients/:clientId/edit         Existing edit flow
/agent/clients/new                    Existing add-client flow

/agent/pipeline                       NEW — cross-client stage board (replaces /agent/matches as the "pipeline" view)

/agent/workspace/:exchangeId          NEW — single-property Workspace (the work surface)

# Redirects (no dead-ends)
/agent/matches                  → /agent/pipeline
/agent/matches/:id              → /agent/workspace/<exchangeId for that match>  (resolved client-side)
/agent/exchanges                → /agent/pipeline   (listings list collapses into pipeline + per-client)
/agent/exchanges/:id            → /agent/workspace/:id
/agent/connections/:id          → keep (deep link from notifications); page links back into Workspace
/agent/clients/:clientId?tab=matches|listings|deal → /agent/clients/:clientId (overview) or /agent/workspace/:exchangeId
```

Listing creation/edit stay on their existing routes (`/agent/exchanges/new`, `/agent/exchanges/:id/edit`) — they're flows, not destinations. On success they navigate to `/agent/workspace/:exchangeId`.

---

## 3. My Clients section

**`/agent/clients`** — unchanged list page. Each row links to the client overview.

**`/agent/clients/:clientId` — Client Overview (rebuilt, no tabs)**

Composition:
- `ClientWorkspaceHeader` (reused) — profile, contact, company, accent color. "Counts" simplified to just listings.
- **Listed Properties grid** — reuses the existing `ClientListingsTab` card markup, extracted into a `ClientPropertyCards` component. Each card links to **`/agent/workspace/:exchangeId`** (instead of `/agent/exchanges/:id`).
- "New listing" CTA → `/agent/exchanges/new?client=:clientId`.

Removed from this page: Matches tab, Deal tab, inline match work. The agent goes to a property's Workspace to do that work.

---

## 4. Pipeline section

**`/agent/pipeline`** — cross-client stage overview.

Implementation: rename/replace `AgentMatchesHub` content into `AgentPipeline.tsx`. Keeps the existing inbox + filter + status logic (uses `useUnifiedRelationships`, `deriveUiStatus`, `InboxList`, `ExchangeContextBar`), with the stage tabs labelled **New → Interested → Connected → Closed** (already the `UiStatus` groupings via `LEGACY_FILTER_MAP`).

Key change: clicking a row no longer opens the right-hand `PropertyReviewPanel` + `DealRoomPanel` in place. Instead it **navigates to `/agent/workspace/:exchangeId?match=:matchId`**, so the property opens in the unified Workspace. (The hub becomes a list, not a master-detail.)

This collapses the prior split between "Matches hub" and per-client/per-exchange work — there is now exactly one work surface.

---

## 5. Workspace section (the work surface)

**`/agent/workspace/:exchangeId`** — `AgentWorkspace.tsx` (new page).

Loads:
- the exchange (and its client) via `exchanges` query.
- all matches for that exchange via `useUnifiedRelationships()` filtered by `buyerExchangeId === exchangeId`.
- the client's *other* exchanges for the property switcher.

Layout (top → bottom):

```text
[Breadcrumb] Client name › Property name        [client accent left-border]
[Property switcher pill row] ◀ all this client's properties; current highlighted ▶
[Property summary strip]    address · asking · cap · status · "Edit listing" · "View listing detail"

[ Inbox (left) — InboxList scoped to this exchange ]   [ Right column: ]
                                                       [   PropertyReviewPanel (selected match) ]
                                                       [   "Open actions" → DealRoomPanel in Sheet ]
```

Reused components (no rebuilds):
- `InboxList` + `SortFilterBar` + `readMatchLocalState` — match list (pre-scoped to this exchange)
- `PropertyReviewPanel` — middle review pane
- `DealRoomPanel` (which already composes `LifecycleTracker`, `NextActionCard`, `ClientSharingCard`, `AgentCommsCard`) — all match actions: internal notes, message listing agent, send to client, mark not-a-fit, archive, etc.
- `useMatchActions` / `useMatchLocalState` — action wiring, untouched
- `ClientWorkspaceHeader` accent system → reused for the breadcrumb chip + left border
- `getClientAccent` — accent color carries through breadcrumb, switcher, and inbox cards

URL state:
- `?match=:matchId` selects a match in the inbox (so Pipeline links land on the right row).
- Property switcher updates `:exchangeId` (full navigate, not a query param, so each property has a clean URL).

**Property switcher**: a horizontal pill row of *this client's* exchanges only (queried `exchanges where client_id = current.client_id`). Current is bold + accent fill; others link to `/agent/workspace/:otherExchangeId`. No cross-client jumping — breadcrumb does that.

**Breadcrumb**: `Client name` (link → `/agent/clients/:clientId`) `›` `Property name` (current page).

If the exchange has no property yet (draft), the Workspace shows the existing exchange-detail summary card + an "Add property" CTA into the edit flow, and the matches column shows the empty state.

---

## 6. What happens to the old pages

| Old | New |
|---|---|
| `AgentMatchesHub` (`/agent/matches`) | Replaced by `AgentPipeline` (`/agent/pipeline`); old route redirects |
| `AgentExchangeDetail` (`/agent/exchanges/:id`) | Replaced by `AgentWorkspace`; old route redirects to `/agent/workspace/:id`. The metadata-only "exchange detail" view can be deleted or kept as a Workspace sub-route later — out of scope here. |
| `AgentClientWorkspace` (tabs: listings/matches/deal) | Replaced by the leaner Client Overview (profile + property cards). Match + deal work moves into Workspace per property. File deleted. |
| `ClientMatchesTab`, `ClientDealTab` | Deleted — their logic was duplicating `AgentMatchesHub`; now consolidated in `AgentWorkspace`. |
| `ClientListingsTab` | Extracted into a reusable `ClientPropertyCards` component used by the new Client Overview. |
| `useAgentPipelineQuery` | Kept; still used by Admin dashboard. |

---

## 7. Link audit (every internal link that points into the old model)

Repointed to the new model:

- **AgentDashboard** — `unreviewedMatches` and `topMatches` rows currently link to `/agent/clients/:id?tab=matches` or `/agent/matches/:matchId` → repoint to `/agent/workspace/:buyerExchangeId?match=:matchId`. Listings list links `/agent/clients/:id?tab=listings` → `/agent/workspace/:exchangeId`. Deadline rows `/agent/exchanges/:id` → `/agent/workspace/:id`.
- **AgentClients** rows → `/agent/clients/:id` (unchanged; lands on new overview).
- **Client Overview** property cards → `/agent/workspace/:exchangeId`.
- **AgentPipeline** rows → `/agent/workspace/:exchangeId?match=:matchId`.
- **AgentTopNav** "Add Client" stays; nav order updated.
- **Notifications** `link_to` values that point to `/agent/matches/...` or `/agent/exchanges/...` are handled via the redirect routes — no code change needed in notification rows.
- **AgentConnectionDetail** "Back" links → `/agent/pipeline`. Any "view property" links → `/agent/workspace/:exchangeId`.
- **AgentExchanges** list page is removed from nav; the route redirects to `/agent/pipeline`. Any "view exchange" buttons elsewhere → `/agent/workspace/:id`.
- **Launchpad / Help / Admin** — `grep` for the remaining `/agent/matches`, `/agent/exchanges/`, `?tab=matches`, `?tab=deal`, `?tab=listings` literals and repoint or rely on redirects.

A final `rg "/agent/(matches|exchanges/|clients/[^\"]+\\?tab=)"` pass confirms nothing dead-ends.

---

## 8. Technical notes

- Workspace's match resolution: when a Pipeline row is clicked we already have `rel.buyerExchangeId` and `rel.matchId` — no extra fetch.
- `/agent/matches/:id` redirect resolves via a thin loader component that fetches the match's `buyer_exchange_id` once and `<Navigate>`s.
- Property switcher query is a small `exchanges` select (`id, status, pledged_properties(property_name, city, state)`) by `client_id` — cacheable with React Query.
- All accent styling continues to use `getClientAccent(clientId)` — no token changes.
- Mobile: Workspace collapses to single column (Pipeline-Hub-style); Sheet-based DealRoom stays. Breadcrumb + switcher remain at top.
- No schema, RLS, edge function, or scoring changes.

---

## Confirmations requested in your prompt

- **Routes**: `/agent/clients`, `/agent/clients/:id`, `/agent/pipeline`, `/agent/workspace/:exchangeId` (+ legacy redirects).
- **How a property opens in Workspace from both entry points**: My Clients overview property cards → `/agent/workspace/:exchangeId`; Pipeline rows → `/agent/workspace/:exchangeId?match=:matchId`. Same destination component for both.
- **Reused Workspace components**: `InboxList`, `PropertyReviewPanel`, `DealRoomPanel` (+ `LifecycleTracker`, `NextActionCard`, `ClientSharingCard`, `AgentCommsCard`), `useMatchActions`, `useMatchLocalState`, `useUnifiedRelationships`, `getClientAccent`, `ClientWorkspaceHeader` accent.
- **Same-client property switcher**: pill row scoped to `exchanges where client_id = current.client_id`; cross-client navigation only via breadcrumb back to the client.
- **Link audit**: dashboard, client overview, pipeline, connections, exchanges, launchpad, help all repointed; legacy `/agent/matches*` and `/agent/exchanges/:id` covered by redirect routes.

Ready for your review — say the word and I'll build it.
