# Restructure: My Clients as roster, new "Deals" tab for workspace

## Goal

Separate the *who* (clients) from the *what* (their listings, matches, and in-flight deals).

- **My Clients** becomes a simple roster. Clicking a row opens a read-only profile with an Edit button.
- A new top-nav tab **Deals** becomes the all-clients workspace: every listing, every match, every active deal across the agent's book, filterable by client.

No schema, scoring, or matching logic changes. UI/routing only.

---

## Top nav (final order)

```text
Launchpad   Dashboard   My Clients   Deals
```

`PRIMARY_NAV` in `src/components/layout/AgentTopNav.tsx` gains a 4th entry:
`{ title: "Deals", url: "/agent/deals" }`.

---

## My Clients (simplified)

Route: `/agent/clients` (existing `AgentClients.tsx`)

- Keep the roster table/cards (name, company, status, last activity, counts).
- Row click → `/agent/clients/:clientId` (profile view), **not** the workspace.
- Keep the "Add Client" entry point.

### Client profile page

Route: `/agent/clients/:clientId` — repurpose `AgentClientWorkspace.tsx` into a profile view.

- Header: name, status, contact info (reuse `ClientWorkspaceHeader` minus the listings/matches/deals counts, or simplify it).
- Body: read-only fields (email, phone, company, notes, created date, status).
- Primary actions: **Edit client** (→ existing `/agent/clients/:clientId/edit`), **View in Deals** (→ `/agent/deals?client=:clientId`).
- Remove the Tabs (Listings/Matches/Deal) from this page — they move to the Deals tab.

The existing edit route `/agent/clients/:clientId/edit` stays unchanged.

---

## Deals (new tab) — all-clients aggregate

Route: `/agent/deals` — new page `src/pages/agent/AgentDeals.tsx`.

A single workspace surfacing everything actionable across all clients, with a client filter chip-bar at the top.

### Layout

```text
+--------------------------------------------------------------+
| Deals                                  [+ New listing]       |
| Client filter: [All] [Acme] [Beth Co] [Carter] ...           |
+--------------------------------------------------------------+
| Tabs:  Listings    Matches    Active Deals                   |
+--------------------------------------------------------------+
| <tab content, filtered by selected client(s)>                |
+--------------------------------------------------------------+
```

### Tab contents (reused components)

| Tab          | Reuses                                                                 | Data source                          |
| ------------ | ---------------------------------------------------------------------- | ------------------------------------ |
| Listings     | `ClientListingsTab` rendered per client OR a flat list variant         | `useAgentExchangesQuery`             |
| Matches      | `InboxList` + `PropertyReviewPanel` / `DealRoomPanel` (existing inbox) | `useUnifiedRelationships` (all)      |
| Active Deals | `DealRoomPanel` list filtered to `connectionId != null && stage != closed_lost` | `useUnifiedRelationships` filtered |

The client filter narrows results client-side via the existing `clientId` field on each row — no new queries.

Default tab: **Matches** (most actionable). URL: `?tab=matches|listings|deals&client=:id`.

---

## Dashboard impact

`AgentDashboard.tsx` already links to clients and matches. Update those CTAs so action-oriented links (e.g. "Review matches", "View active deals") point into `/agent/deals?tab=...` instead of per-client pages where appropriate. Roster-style CTAs ("Manage clients") continue to point at `/agent/clients`.

---

## Link audit

Anywhere that currently deep-links into `/agent/clients/:id?tab=listings|matches|deal`:

- `ClientWorkspaceHeader` — used inside the profile, drop the counts/tab affordances.
- Dashboard cards, notifications, and inbox links that send the user to a specific client's tab should keep working: redirect those legacy URLs from `AgentClientWorkspace` to either the profile (when `?tab` absent) or `/agent/deals?client=:id&tab=...` (when present).
- Notifications referencing matches should target `/agent/deals?tab=matches&match=:id` (open the panel for that match).

---

## Mobile

- Top nav already collapses to a Sheet menu — add "Deals" to both desktop and mobile `PRIMARY_NAV`.
- Deals page: client filter becomes a horizontal scroll chip row; tabs stay as `TabsList`.

---

## Files

**New**
- `src/pages/agent/AgentDeals.tsx` — aggregate workspace
- `src/features/agent/components/DealsClientFilter.tsx` — chip-row filter

**Edited**
- `src/components/layout/AgentTopNav.tsx` — add Deals to `PRIMARY_NAV`
- `src/app/routes/routeManifest.ts` — register `/agent/deals`
- `src/pages/agent/AgentClientWorkspace.tsx` — convert to read-only profile, remove Tabs, add Edit + "View in Deals" actions
- `src/features/clients/components/ClientWorkspaceHeader.tsx` — drop counts row (or keep as link to Deals filtered by client)
- `src/pages/agent/AgentDashboard.tsx` — point action CTAs at `/agent/deals`

**Untouched**
- `ClientListingsTab`, `ClientMatchesTab`, `ClientDealTab`, `InboxList`, `DealRoomPanel`, scoring, RLS, schema.

---

## Open follow-ups (not in this round)

- Whether to also archive the per-client tabs UI entirely or keep `ClientDealTab` etc. as the building blocks for `AgentDeals` (recommended: keep as building blocks).
- Saved filter presets on Deals (e.g. "Needs my reply").
