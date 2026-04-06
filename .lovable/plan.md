

# Phase 2B: Exchange Wizard — Pledge Property + Economics + Criteria

## Overview
Build a 5-step exchange creation wizard, the exchange list page, and the exchange detail page. No database changes needed.

## Save Order (critical)
The `replacement_criteria.exchange_id` is NOT NULL, so the order must be:
1. INSERT `pledged_properties` (no exchange_id yet) → get property_id
2. INSERT `property_financials` (with property_id)
3. INSERT `exchanges` (with relinquished_property_id = property_id, no criteria_id yet) → get exchange_id
4. INSERT `replacement_criteria` (with exchange_id) → get criteria_id
5. UPDATE `exchanges` SET criteria_id, UPDATE `pledged_properties` SET exchange_id
6. If activating: UPDATE `pledged_properties` SET status = 'active', listed_at = now()
7. INSERT `exchange_timeline` entries

The auto-status trigger will fire on the criteria_id update and transition status to 'active'.

## Files to Create

### 1. `src/lib/exchangeWizardTypes.ts` (~80 lines)
TypeScript interfaces for wizard state across all 5 steps: `WizardState`, `PropertyData`, `FinancialsData`, `CriteriaData`. Keeps the wizard component clean.

### 2. `src/pages/agent/NewExchange.tsx` (~200 lines)
Main wizard container. Manages `step` (1-5) state and a `WizardState` object. Renders step progress bar at top (5 labeled steps, clickable for completed steps only, checkmarks on completed). Renders the active step component, passing data + onChange + onNext/onBack.

Submit logic in this file: orchestrates the multi-table insert sequence described above.

### 3. `src/components/exchange/StepSelectClient.tsx` (~120 lines)
Fetches agent_clients. Renders selectable cards with radio-style selection. Includes inline "Add New Client" form (name, email, phone, company) that inserts into agent_clients and auto-selects.

### 4. `src/components/exchange/StepPropertyDetails.tsx` (~250 lines)
Location + Classification sections always expanded. Physical Description expanded with required fields first. "Additional Details" collapsible (Collapsible component) for parking, construction, roof, HVAC, zoning, amenities, renovations, description. Reuses all constants from `constants.ts`.

### 5. `src/components/exchange/StepFinancials.tsx` (~280 lines)
Three sections:
- **Property Financials**: asking price, NOI, occupancy (required); cap rate auto-calc; collapsible "Detailed Expenses"
- **Debt Position**: loan balance, rate, type, maturity, ADS, prepayment toggle
- **Exchange Economics**: proceeds, equity (required); basis, gain (auto-calc), tax liability (auto-calc: gain * 0.30); sale close date (date picker)

Currency inputs styled with "$" prefix, percentage with "%" suffix.

### 6. `src/components/exchange/StepCriteria.tsx` (~220 lines)
Target asset types + states as multi-select chip grids. Price range min/max. Urgency dropdown. Optional: metros tag input, strategies, property classes, cap rate range, occupancy min, year built min, units range, SF range, DST/TIC toggles, must_replace_debt toggle (default on, auto-fills min_debt from Step 3 loan balance). Additional notes textarea.

### 7. `src/components/exchange/StepReview.tsx` (~200 lines)
Read-only summary of all steps in cards. Missing optional fields flagged with amber "Recommended" badges. Two action buttons: "Save as Draft" (outline) and "Activate Exchange" (primary, prominent). Both call the parent's submit handler with an `activate` boolean.

### 8. `src/pages/agent/AgentExchangeDetail.tsx` (~250 lines)
Fetches exchange + joins agent_clients, pledged_properties, property_financials, replacement_criteria, exchange_timeline. Displays in card sections: Overview, Pledged Property, Replacement Criteria, Timeline. Empty states for missing property/criteria. Deadline countdowns if dates exist.

## Files to Modify

### `src/pages/agent/AgentExchanges.tsx` — Full rewrite (~180 lines)
Replace placeholder with real list page. Fetches exchanges with agent_clients join. Cards show client name, property address, status badge, deadlines, proceeds. "New Exchange" button. Empty state CTA.

### `src/App.tsx` — Add 2 routes
```tsx
<Route path="/agent/exchanges/new" element={<NewExchange />} />
<Route path="/agent/exchanges/:id" element={<AgentExchangeDetail />} />
```

### `src/lib/constants.ts` — Add exchange status labels/colors
```ts
export const EXCHANGE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft", active: "Active", in_identification: "In Identification",
  in_closing: "In Closing", completed: "Completed", cancelled: "Cancelled", expired: "Expired",
};
export const EXCHANGE_STATUS_COLORS: Record<string, string> = { ... };
```

## Technical Notes
- All step components are controlled: they receive data and onChange, no local state for form values
- Currency formatting helper: `formatCurrency(n)` and a `CurrencyInput` wrapper that strips non-numeric chars
- Multi-select chips: toggle buttons using Badge components with onClick
- Tag input for metros: Input with onKeyDown Enter handler, renders removable Badge tags
- Date picker uses shadcn Popover + Calendar with `pointer-events-auto`
- No database schema changes needed

