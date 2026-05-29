## Goal

Collapse the "Pledged Properties" tab into the "Exchanges" tab. Keep the visual style of the Pledged Properties page (image preview cards, price, badges, dropdown actions) and keep the Exchanges functionality (deadlines, status, "New Exchange" CTA, navigate to exchange detail).

## End state

- Single sidebar item: **Exchanges** (`/agent/exchanges`)
- "Pledged Properties" sidebar item removed
- `/agent/properties` route removed (or 301-style redirect to `/agent/exchanges`)
- Exchanges page shows a card grid (one card per exchange) using the pledged-property card design, enriched with exchange data (client name, status, deadline countdown, proceeds)
- "New Exchange" button preserved in the header
- Empty state preserved from Exchanges ("No exchanges yet → Create First Exchange")

## Page design (per card)

Reuse the Pledged Properties card layout:
- Cover image (from `property_images`) or `Building2` placeholder
- Top-left badge: **exchange status** (replaces pledged-property status) using `EXCHANGE_STATUS_COLORS` / `EXCHANGE_STATUS_LABELS`
- Top-right: dropdown menu (View exchange, Edit details, Withdraw/Reactivate)
- Body:
  - Asking price (large)
  - Cap rate · units · year built row
  - Property name / address
  - City, State with `MapPin`
  - Chips row: asset type, match count, **deadline countdown** ("12d to ID" with color thresholds), **proceeds**
  - "for {client_name}" line
  - "Open exchange" button → `/agent/exchanges/{id}`

Filters row (kept from pledged page, retuned for exchanges):
- Search (client name, property name, address, city)
- Status filter using **exchange statuses** (All / Draft / Active / In Identification / In Closing / Completed / Cancelled) with counts

Exchanges without a pledged property yet still render a card (placeholder image, "No property pledged yet", same actions).

## Data

Build one query that returns exchanges + their relinquished pledged property + financials + cover image + match count + client name. Approach: extend `useAgentExchangesQuery` (or add a sibling hook `useAgentExchangesWithPropertyQuery`) that:
1. Fetches exchanges (current behavior) — already returns client name and pledged property address.
2. For exchanges with `relinquished_property_id`, batch-fetches:
   - `property_financials` (asking_price, cap_rate)
   - `property_images` first image → public URL
   - `pledged_properties` extra fields (property_name, asset_type, units, year_built, status)
   - `matches` count grouped by `seller_property_id`

Mirror the batching pattern already in `AgentPledgedProperties.fetchProperties`.

Withdraw/Reactivate actions update `pledged_properties.status` (same mutation as today). No business logic changes.

## File changes

- **Edit** `src/pages/agent/AgentExchanges.tsx` — rewrite to render the card grid + filters described above.
- **Edit** `src/features/agent/hooks/useAgentExchangesQuery.ts` — extend row shape with `property_name, asset_type, units, year_built, asking_price, cap_rate, cover_url, match_count, pledged_status` (or add a second hook and keep the existing one for places that only need the slim shape — easier and safer).
- **Delete** `src/pages/agent/AgentPledgedProperties.tsx`.
- **Edit** `src/App.tsx` — remove `AgentPledgedProperties` import and `/agent/properties` route (or replace with `<Navigate to="/agent/exchanges" replace />`).
- **Edit** `src/components/layout/AgentSidebar.tsx` — remove the "Pledged Properties" nav item.
- **Edit** `src/pages/agent/AgentHelp.tsx` — point "Pledge a property" link to `/agent/exchanges` (already correct).
- **Edit** `src/app/routes/routeManifest.ts` — drop `/agent/properties` entry.
- **Check** `src/test/routes.test.ts` — update if it asserts the removed route.

## Out of scope

- Admin pages
- Public marketing pages
- Matching engine / business logic
- Any redesign beyond reusing the existing card style
