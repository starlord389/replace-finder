

# Phase 2D: Agent Match List + Match Detail Pages

## Overview
Replace the placeholder AgentMatches with a real match list showing buyer-side and seller-side matches. Create AgentMatchDetail with full financial analysis, boot breakdown, score dimensions, and property comparison — adapted from the existing client MatchDetail.tsx (1045 lines).

## Constants Update

### `src/lib/constants.ts`
Update `SCORE_DIMENSIONS` to include all 8 dimensions with correct weights:
```
price_score 20%, geo_score 15%, asset_score 15%, strategy_score 10%,
financial_score 10%, timing_score 10%, debt_fit_score 10%, scale_fit_score 10%
```

Add `BOOT_STATUS_LABELS` and `BOOT_STATUS_COLORS` maps.

## Files to Create

### `src/pages/agent/AgentMatchDetail.tsx` (~900 lines)

Adapted from `src/pages/client/MatchDetail.tsx`. Same section structure, new data model.

**Data loading:**
- Fetch match by ID from `matches` table
- Verify access: buyer_exchange belongs to agent OR seller_property belongs to agent
- Fetch seller property (`pledged_properties`), its `property_financials`, its `property_images`
- Fetch buyer exchange (`exchanges`), its `replacement_criteria`, its relinquished property + financials
- Fetch buyer exchange's client (`agent_clients`)

**View tracking:** If buyer agent and `buyer_agent_viewed = false`, update to true.

**Sections (same layout as existing MatchDetail):**
1. **Context banner** — "Match for: [Client]'s [City, State] exchange"
2. **Sticky action bar** — property name, price, score, boot status, "Start Exchange" button
3. **Photo gallery** — same Zillow-style grid + lightbox from existing code
4. **Property header** — name, address, metrics, score badge, boot status card
5. **Exchange comparison** — side-by-side table using `CompRow` pattern, position summary cards (equity, cash flow, scale)
6. **Boot analysis section** — NEW prominent section: cash boot, mortgage boot, total, tax estimate, status badge, explanation text
7. **Detailed financial comparison** (collapsible) — operating income table (`OpRow`), exchange economics, charts (NOI bar, revenue pie, waterfall)
8. **Property deep dive** — calculated metrics with health indicators (`HealthMetric`), physical details grid, operating statement
9. **Match score breakdown** — 8 dimension bars with dynamic explanations per dimension
10. **Bottom CTA** — "Start Exchange" button (shows toast "Coming in next update" for now)

**Key differences from client MatchDetail:**
- No "Interested/Pass" response buttons — replaced with "Start Exchange" (coming soon toast)
- Agent identity hidden: "Listed by a verified agent in the ExchangeUp network"
- Boot analysis is a standalone prominent section (not buried in collapsible)
- 8 score dimensions instead of 6
- Data comes from `pledged_properties` + `property_financials` instead of `inventory_properties` + `inventory_financials`
- Comparison "yours" side uses the exchange's relinquished property + its financials instead of `exchange_requests`

**Reused patterns from existing MatchDetail (copy into file):**
- `fmt`, `pct`, `num` formatters
- `scoreColor`, `scoreTextColor`, `metricHealthDot`, `metricColor`
- `calcDelta`, `absDelta` helpers
- `CompRow`, `OpRow`, `PositionCard`, `EconItem`, `StatPill`, `FinRow`, `HealthMetric` sub-components
- Photo gallery + lightbox markup
- Chart configs (Recharts BarChart, PieChart)

## Files to Modify

### `src/pages/agent/AgentMatches.tsx` (full rewrite, ~350 lines)

**Data loading:**
1. Fetch agent's exchanges: `exchanges.select("id, client_id").eq("agent_id", user.id)`
2. Fetch agent's pledged property IDs: `pledged_properties.select("id").eq("agent_id", user.id)`
3. **Buyer-side matches**: `matches.select("*").in("buyer_exchange_id", exchangeIds).eq("status", "active")`
4. For each match: batch-fetch seller properties, financials, first image, and client names via maps
5. **Seller-side matches**: `matches.select("*").in("seller_property_id", propertyIds).eq("status", "active")`
6. Sort buyer matches: unviewed first, then by total_score desc

**Filters (state-controlled):**
- Exchange/client dropdown
- Score range: All / Strong 85+ / Good 70-84 / Fair 65-69
- Boot status: All / No Boot / Minor / Significant
- Sort: Match Score / Price Low-High / Price High-Low / Newest

**Match cards (same Zillow pattern as existing MatchList):**
- Cover photo or Building2 placeholder
- Score badge (top-right, color-coded)
- Boot status indicator
- "New" badge if `buyer_agent_viewed = false`
- Price, metrics row (cap rate · NOI · units/SF · year built)
- Property name, city/state, asset + strategy badges
- "For: [Client]'s exchange" label
- Click → `/agent/matches/:id`

**Seller-side section below:**
- Heading: "Your Properties Matched to Other Exchanges"
- Simpler cards: "Your [property] matched an exchange in [state]" + score
- Informational only, no CTA

**Empty state:** "No matches yet. Once you activate an exchange, the system will automatically find matching properties."

### `src/App.tsx`
Add import and route:
```tsx
import AgentMatchDetail from "@/pages/agent/AgentMatchDetail";
<Route path="/agent/matches/:id" element={<AgentMatchDetail />} />
```

## Technical Notes
- All financial helpers and sub-components are copied into AgentMatchDetail (not extracted to shared module — simpler for now, same as existing pattern)
- The `property_images` table references `pledged_properties` via `property_id` foreign key
- The `property_financials` table is `isOneToOne: true` with `pledged_properties`
- Boot fields on `matches`: `estimated_cash_boot`, `estimated_mortgage_boot`, `estimated_total_boot`, `estimated_boot_tax`, `boot_status`
- Score dimensions on `matches`: `price_score`, `geo_score`, `asset_score`, `strategy_score`, `financial_score`, `timing_score`, `debt_fit_score`, `scale_fit_score`, `total_score`
- "Start Exchange" button shows `toast.info("Exchange connections coming in the next update.")` — no connection logic yet
- No storage bucket needed for property_images — images are in `property_images` table referencing pledged_properties, likely using an existing bucket or no images uploaded yet in this flow

## What NOT to Change
- Client match pages (MatchList, MatchDetail)
- Admin pages
- Matching engine
- Database schema

