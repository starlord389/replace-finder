

# Phase 2C: Automatic Matching Engine

## Overview
Create a new edge function `run-auto-matching` that performs bidirectional 8-dimension scoring with boot calculations when an exchange is activated. Call it from the frontend after activation. No database migration needed — the `matches_unique_pair` constraint already exists.

## Files to Create

### `supabase/functions/run-auto-matching/index.ts` (~350 lines)

A new Deno edge function following the same pattern as the existing `run-matching/index.ts`.

**Setup & Auth:**
- CORS headers (same pattern as existing function)
- Verify Authorization header, extract userId via `getClaims()`
- Use `SUPABASE_SERVICE_ROLE_KEY` client for all DB operations (needs cross-agent reads)
- Accept JSON body: `{ exchange_id: string, property_id: string }`
- Do NOT require admin role — any authenticated agent can trigger for their own exchange

**Data Loading:**
- Fetch the activated exchange by `exchange_id`
- Fetch its `replacement_criteria` by `exchange.criteria_id`
- Fetch the pledged property by `property_id`
- Fetch that property's `property_financials`

**Bidirectional Matching:**

1. **Buyer-side** (find properties FOR this exchange):
   - Fetch all `pledged_properties` where `status = 'active'` AND `agent_id != userId`
   - For each, fetch its `property_financials`
   - Score each property against this exchange's `replacement_criteria`
   - Insert matches where `total_score >= 65`

2. **Seller-side** (find exchanges that want THIS property):
   - Fetch all `exchanges` where `status IN ('active','in_identification','in_closing')` AND `agent_id != userId`
   - For each, fetch its `replacement_criteria`
   - Score this property against each exchange's criteria
   - Insert matches where `total_score >= 65`

**8-Dimension Scoring (each 0-100, weighted total):**

| Dimension | Weight | Logic |
|-----------|--------|-------|
| Price | 0.20 | Property asking_price vs criteria target_price_min/max. In range = 100. Outside = decrease by deviation from midpoint. Fallback: compare to exchange_proceeds (0.8-2.0x ratio = 100). |
| Geography | 0.15 | State in target_states = +70. City matches target_metros = +30. Both = 100. Neither = 0. No criteria = 50. |
| Asset Type | 0.15 | asset_type in target_asset_types = 100. Not in = 0. No criteria = 50. |
| Strategy | 0.10 | strategy_type in target_strategies = 100. Not in = 20. No criteria = 50. |
| Financial | 0.10 | Cap rate in target range = 100, decrease by deviation. +20 bonus if occupancy >= target_occupancy_min. +10 bonus if year_built >= target_year_built_min. No criteria = 50. |
| Timing | 0.10 | Urgency map: immediate=90, standard=70, flexible=50. Default=70. |
| Debt Fit | 0.10 | If must_replace_debt AND min_debt_replacement set: property loan_balance >= requirement = 100, else proportional. If must_replace_debt false = 80. No data = 50. |
| Scale Fit | 0.10 | Units in target range = 100, else decrease. Or SF in target range. +20 bonus for property_class match. No criteria = 50. |

**Boot Calculation (per match):**
```
cashBoot = max(0, buyerExchange.exchange_proceeds - sellerProperty.asking_price)
mortgageBoot = max(0, buyerExchange.financials.loan_balance - sellerProperty.financials.loan_balance)
totalBoot = max(0, cashBoot + mortgageBoot)
bootTax = totalBoot * 0.30
bootStatus = totalBoot === 0 ? 'no_boot' 
           : totalBoot < proceeds * 0.05 ? 'minor_boot' 
           : 'significant_boot'
           // missing data → 'insufficient_data'
```

**Match Insert:**
- Upsert into `matches` using `ON CONFLICT (buyer_exchange_id, seller_property_id) DO UPDATE` — leveraging the existing `matches_unique_pair` constraint
- Store all 8 dimension scores + boot fields + `status = 'active'`

**Notifications:**
- For buyer-side matches: notify the buyer agent (current user) — "A property matching your criteria has been found"
- For seller-side matches: notify the other agent — "A new property has entered the network that matches your client's criteria"
- Insert into `notifications` table with `type = 'new_match'`, `link_to = '/agent/matches'`

**Return:**
```json
{
  "matches_for_exchange": 3,
  "matches_from_property": 2, 
  "total_new_matches": 5,
  "top_matches": [{ "property_id": "...", "score": 92 }]
}
```

## Files to Modify

### `src/pages/agent/NewExchange.tsx`

After the timeline insert block (line ~161), before the existing toast/navigate (lines 163-164), add matching invocation when `activate` is true:

```typescript
if (activate) {
  try {
    const { data: matchResult } = await supabase.functions.invoke("run-auto-matching", {
      body: { exchange_id: exchange.id, property_id: prop.id }
    });
    if (matchResult?.total_new_matches > 0) {
      toast.success(`Exchange activated! ${matchResult.total_new_matches} matches found.`);
    } else {
      toast.success("Exchange activated! Your property is now in the network.");
    }
  } catch {
    // Matching failure must NOT block activation
    toast.success("Exchange activated! Matching will run shortly.");
  }
  navigate(`/agent/exchanges/${exchange.id}`);
} else {
  toast.success("Exchange saved as draft.");
  navigate(`/agent/exchanges/${exchange.id}`);
}
```

Replace the current lines 163-164 with the above block so activation success/failure is handled separately from draft saves.

## No Database Changes
- The `matches_unique_pair` unique constraint already exists from Phase 1A
- The `matches` table already has all required columns (8 score fields + boot fields)
- RLS policies already allow authenticated inserts (`Service can insert matches` with `WITH CHECK true`)
- No migration needed

## What NOT to Change
- `supabase/functions/run-matching/index.ts` — keep the old admin-triggered engine as-is
- No RLS changes
- No other frontend files beyond NewExchange.tsx

