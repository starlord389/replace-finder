

# Redesign Match Detail Page — Full Investment Memo

## Overview
Rewrite `src/pages/client/MatchDetail.tsx` (~616 lines) into a comprehensive investment analysis page with 6 sections following progressive disclosure. Also fetch exchange_request_preferences for match score explanations.

## Data Loading Changes
Add one new fetch to `loadData()`:
- `exchange_request_preferences` where `request_id = access.request_id` — needed for Section 5 score explanations

Everything else is already loaded (access, property, financials, images, matchResult, exchangeReq).

## Page Layout (Top to Bottom)

### Context Banner
- Subtle muted bar below header: "Match for: [address, city, state] — [asset type] Exchange"
- Falls back to "Match for: Exchange Request #[short id]" if no address
- Clickable → navigates to `/dashboard`
- Becomes sticky when scrolling past hero

### Section 1: Property Hero (existing — enhanced)
- Photo gallery: 60/40 split (large left + 2-4 grid right), lightbox — **already built**, keep as-is with minor cleanup
- Property header: name, address, badges for asset type + strategy
- Key metrics row: Asking Price (large bold), Cap Rate, NOI, Units/SF, Year Built, Occupancy — as horizontal stat pills
- Match Score badge (color-coded) + Express Interest / Pass buttons right-aligned
- Largely exists, reorganize layout slightly

### Section 2: Exchange Comparison (NEW — replaces old Exchange Fit)
- Title: "Exchange Comparison" with subtitle
- Two-column comparison table: Your Property | → | This Property
- Rows: Value/Price, NOI, Cap Rate, Units, Year Built, Occupancy, Asset Type, Strategy, Price/Unit, NOI/Unit
- Delta column with green ↑ / red ↓ arrows + percentage change text
- Smart color logic (lower price/unit = green, lower cap rate = red)
- **3 Exchange Position Summary Cards** below table:
  1. Equity Position: equity vs price, "Covered" or "Gap: $X" badge
  2. Cash Flow Shift: NOI change +/- with %
  3. Scale Change: "X units → Y units"
- Cards use green/amber/red backgrounds

### Section 3: Detailed Exchange Analysis (NEW — collapsed by default)
- Accordion: "Show Detailed Analysis"
- **3A**: Side-by-side operating income comparison table (gross revenue through pre-tax cash flow with all expense line items)
- **3B**: Exchange Economics — proceeds, equity, boot estimate, debt replacement requirement
- **3C**: Charts (Recharts):
  - Chart 1: NOI comparison bars (yours vs theirs)
  - Chart 2: Revenue & expense breakdown donut/stacked bar for replacement property
  - Chart 3: Return profile comparison (cap rate, CoC, expense ratio — side by side bars)
  - Chart 4: Exchange position waterfall (property value → proceeds → replacement price → gap/surplus)
  - Each chart only renders if sufficient data exists

### Section 4: Property Deep Dive (reorganized from existing sections)
- **4A**: Calculated metrics grid with colored health dots (cap rate, GRM, expense ratio, NOI/unit, price/unit, price/SF, break-even occ, DSCR, CoC) — exists, enhance with color dots
- **4B**: Physical property details grid — exists, keep as-is
- **4C**: Operating statement table — exists, keep as-is

### Section 5: Match Score Breakdown (moved + enhanced)
- Title: "Why This Property Was Matched"
- 6 horizontal bars with scores — exists
- **NEW**: Dynamic text explanations below each bar generated from exchange_request_preferences + property data (e.g., "Asking price of $5.2M is within your target range of $3.5M–$6M")

### Section 6: Bottom CTA
- Repeat Interest/Pass buttons — exists, keep as-is

### Sticky Action Bar
- Already exists — enhance to include match score badge alongside property name + price

## Technical Approach
- Single file rewrite of `src/pages/client/MatchDetail.tsx`
- Extract helper components inline (ExchangeComparison, DetailedAnalysis, PropertyDeepDive, ScoreBreakdown)
- All charts use Recharts (already imported)
- Color palette: blue-600 primary, green-500 positive, red-500 negative, slate for neutral
- Currency: `$X,XXX,XXX` no cents. Percentages: one decimal.
- Missing data: show "—" or "Not provided", hide empty sections, charts only render with sufficient data
- Responsive: comparison table stacks on mobile

## Files Changed
1. `src/pages/client/MatchDetail.tsx` — full rewrite (~800-900 lines)

No database changes needed. No new dependencies.

