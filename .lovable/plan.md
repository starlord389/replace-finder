

## More comparison visuals on match detail + richer listing data

The match detail page (`/agent/matches/:id`) already has a comparison table, position cards, and a few charts buried in a collapsed "Detailed Financial Comparison" section. I'll restructure it so the visual comparison is front-and-center, add several new visualizations, and enrich the match cards on the list page so the data story is clearer at every step.

### What you'll see

**On every match card (`/agent/matches`)**
- A compact 3-bar mini-comparison strip on each card: Price, Cap Rate, NOI — each bar shows your property vs this property side-by-side so you can scan a list and see directional fit instantly.
- Delta chips (e.g. "+12% NOI", "-0.8% Cap") next to the score badge.
- Small map thumbnail (static OpenStreetMap tile) showing replacement property location.

**On the match detail page (`/agent/matches/:id`)**

A new **"Side-by-Side"** panel directly below the property hero (above everything else), replacing the position cards in their current spot:

```text
┌──────────────────────────┬──────────────────────────┐
│  YOUR PROPERTY           │  THIS PROPERTY           │
│  [thumbnail / map]       │  [thumbnail / map]       │
│  Address · City, ST      │  Address · City, ST      │
│  $X.XM  |  X% cap        │  $X.XM  |  X% cap        │
│  X units · X SF · 'YR    │  X units · X SF · 'YR    │
└──────────────────────────┴──────────────────────────┘
```
Two equal cards side-by-side with a "swap arrow" between them.

A new **"At-a-glance impact"** strip with 4 large delta tiles:
- Δ Asking Price (with up/down arrow + % change)
- Δ NOI (annual cash flow change in $ and %)
- Δ Cap Rate (basis-point change)
- Δ Scale (units / SF change)

Each tile is colored green/amber/red based on whether the change is favorable for the exchange.

A new **Match Quality Radar Chart** in the "Why this property was matched" section — replaces the linear bars with a 6-axis radar overlaying the actual scores against the 100-point ideal, so you can see strengths and weaknesses at a glance. (Linear bars stay below as backup detail.)

A new **Comparison charts section** (always visible, no longer collapsed):
- **NOI side-by-side bar** (already exists, promoted out of collapsible)
- **Cap Rate vs market thresholds** — horizontal bar showing your prop, this prop, and shaded bands for "below market / market / above market"
- **Expense composition stacked bars** — yours vs theirs, stacked by tax/insurance/utilities/management/maintenance, so you see where the operating cost differences live
- **Cash flow waterfall** — Revenue → Expenses → NOI → Debt Service → Pre-tax cash flow, for each property side by side

A new **"Exchange fit" gauge** above boot analysis: a single semicircular gauge showing 0–100% how well the proceeds + debt structure matches the replacement requirements (combines equity coverage, debt replacement, value match into one number).

A new **Location context** card: static map thumbnail of the property + simple "X miles from your relinquished property" line.

**Data enrichment on listings** (visible on detail + cards)
- Show **price-per-unit / price-per-SF** prominently
- Show **trailing-vs-projected NOI** if both exist
- Show **debt assumability** flag if loan terms are present
- Show **time on market** since `listed_at`
- Show **all amenities** as chips (currently buried)
- Show a small **"Documents available"** indicator if `inventory_documents` exist

### Technical details

| File | Change |
|---|---|
| `src/pages/agent/AgentMatchDetail.tsx` | Major restructure. Add SideBySidePanel, ImpactStrip, RadarChart, expense-stacked chart, waterfall, fit gauge, location card. Promote charts out of collapsible (keep raw line-item table inside it). |
| `src/components/match/SideBySidePanel.tsx` | New — two-card layout with thumbnails, key stats, swap arrow |
| `src/components/match/ImpactStrip.tsx` | New — 4 delta tiles with directional coloring |
| `src/components/match/MatchRadarChart.tsx` | New — recharts RadarChart over 6 score dimensions |
| `src/components/match/ExpenseStackedChart.tsx` | New — stacked bar of operating expense categories, both properties |
| `src/components/match/CashFlowWaterfall.tsx` | New — recharts composed bar showing revenue→NOI→cashflow chain |
| `src/components/match/FitGauge.tsx` | New — semicircular SVG gauge (no extra dep) |
| `src/components/match/LocationCard.tsx` | New — static map (OpenStreetMap static tile, no API key) + distance |
| `src/components/match/MatchCardMini.tsx` (extracted from `AgentMatches.tsx`) | New — adds mini comparison bar strip + delta chips on each card |
| `src/pages/agent/AgentMatches.tsx` | Use new MatchCardMini; fetch relinquished property snapshot per exchange so card can compare |
| `src/features/agent/hooks/useAgentMatchesQuery.ts` | Extend query to also pull each exchange's relinquished property summary (price, NOI, cap rate) for card-level comparison |
| `src/lib/distance.ts` | New — Haversine helper for property-to-property mileage (uses lat/lng if present, otherwise omitted) |

No schema or migration changes required — all data already exists in `pledged_properties`, `property_financials`, `inventory_documents`, and `matches`.

### Out of scope

- Geocoding addresses to lat/lng (will only show distance if coordinates are already present; otherwise the location card just shows the static map thumbnail and city/state)
- Live market comp data (cap rate bands will be hardcoded reasonable ranges by asset type, not pulled from a market data API)
- Editable comparison (read-only views only)
- Comparing against multiple matches simultaneously (one-to-one only)

