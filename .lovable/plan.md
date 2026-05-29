## Goal

Collapse "Pledged Properties" and "Exchanges" into a single **Exchanges** tab at `/agent/exchanges` that uses the visual style of the current Pledged Properties grid (photo preview cards) while keeping the Exchanges tab's "New Exchange" action and status semantics.

## Why one tab

Every pledged property belongs to an exchange, and every (non-draft) exchange has a pledged property. Two tabs duplicate the same underlying records with different lenses.

## What the merged page looks like

Route: `/agent/exchanges` (keep). Sidebar: drop "Pledged Properties".

Header
- Title: **Exchanges**
- Subtitle: `{activeCount} active · {draftCount} draft`
- Primary action: **+ New Exchange** → `/agent/exchanges/new` (unchanged)

Filter row (same responsive pattern we just shipped)
- Search input (client name, property name, address, city)
- Status select: All / Draft / Active / In Identification / In Closing / Completed / Withdrawn — counts in labels

Grid (reuse the Pledged Properties card design)
- Cover photo (or Building2 placeholder for drafts with no photo yet)
- Status badge (exchange status, using `EXCHANGE_STATUS_LABELS` / `EXCHANGE_STATUS_COLORS`)
- Asking price (large), cap rate · units · year built row
- Property name + city, state
- Chips: asset type, match count
- "for {client_name}"
- Deadline pill (days left, color-coded — pulled from `AgentExchanges`)
- Card click → `/agent/exchanges/{id}` (exchange detail, not property detail)
- Kebab menu: View exchange, Edit details, Withdraw / Reactivate

Empty state: same illustration + copy as today's Exchanges empty state ("No exchanges yet… Create First Exchange").

## Data model

One query keyed by exchange (not by property), so drafts without a property still appear as cards:

1. `exchanges` for the agent (id, status, deadlines, proceeds, client_id, relinquished_property_id, created_at)
2. `agent_clients` for client names
3. `pledged_properties` for the linked relinquished properties (address, city, state, property_name, asset_type, units, year_built, status)
4. `property_financials` (asking_price, cap_rate)
5. `property_images` → first image → `getPublicUrl` for the cover
6. `matches` grouped by `buyer_exchange_id` for the match count

Build via two new hooks/files so the page stays thin:
- `src/features/agent/api/fetchAgentExchangeCards.ts` — the composite fetch
- Extend `useAgentExchangesQuery` (or add `useAgentExchangeCardsQuery`) to return the richer row

Withdraw / reactivate uses the existing `updateExchange` mutation with the right intent (or updates `pledged_properties.status` as today, depending on which is canonical — keep current Pledged Properties behavior to avoid scope creep).

## Routing & cleanup

- Keep `/agent/exchanges`, `/agent/exchanges/new`, `/agent/exchanges/:id`, `/agent/exchanges/:id/edit` as-is.
- Replace `/agent/properties` route with a `<Navigate to="/agent/exchanges" replace />` so old links/notifications don't 404.
- Remove `AgentPledgedProperties` from sidebar (`src/components/layout/AgentSidebar.tsx`).
- Delete `src/pages/agent/AgentPledgedProperties.tsx` after extracting its card markup into the new Exchanges page.
- Update `src/App.tsx` import + route, update `src/app/routes/routeManifest.ts`.
- Update `src/pages/agent/AgentHelp.tsx` "Pledge a property" link copy → "Create an exchange" (or remove duplicate row).
- Leave `AgentDashboard`, `AgentClientDetail`, `seedMockData`, `AdminDashboard` links untouched — they already point at `/agent/exchanges`.

## Files to change

- `src/pages/agent/AgentExchanges.tsx` — rewrite as merged grid view
- `src/features/agent/hooks/useAgentExchangesQuery.ts` — extend or add sibling hook returning card-ready rows
- `src/components/layout/AgentSidebar.tsx` — remove Pledged Properties item
- `src/App.tsx` — drop `AgentPledgedProperties` import, redirect `/agent/properties`
- `src/app/routes/routeManifest.ts` — remove/redirect entry
- `src/pages/agent/AgentHelp.tsx` — fix duplicate link copy
- Delete `src/pages/agent/AgentPledgedProperties.tsx`

## Out of scope

- No schema changes
- No changes to exchange detail, wizard, or matching logic
- No public/marketing or admin changes
