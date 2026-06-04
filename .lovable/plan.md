# Phase 2 — ROE-based matching

Rebuild the scoring in `supabase/functions/_shared/matching-core.ts` so a candidate property is only a match if it beats the buyer's current return on equity (ROE), and the score is dominated by how much better it is. No edge function call sites change; both `run-auto-matching` and the inline `runMatchingSafe` used in `create-exchange` / `update-exchange` import this same module, so the new model propagates automatically.

## Data availability (confirmed)

- Buyer's relinquished financials: `exchanges.relinquished_property_id` → `property_financials.{noi, asking_price, loan_balance}`. The current core does **not** load these for the buyer side — it only loads `propertyFin` for the just-edited property, which on the buyer side is the candidate, not the relinquished. The seller side already fetches `otherFinancialMap` for other exchanges' relinquished properties; we'll mirror that for the active exchange.
- Candidate financials: `property_financials.{asking_price, noi, occupancy_rate}` — already loaded.
- Admin assumptions: `app_settings.{mortgage_interest_rate, mortgage_amortization_years}` (Phase 1).
- Buyer equity proxy: spec says `relinquished_asking_price − relinquished_loan_balance`. We will use that, not `exchanges.exchange_proceeds`, so the math matches the spec exactly. `exchange_proceeds` stays untouched (still used by boot).

## Model

For each (buyer exchange, candidate property) pair:

```text
buyerCurrentROE  = relinquished_noi / max(relinquished_asking_price - relinquished_loan_balance, ε)
loanAmount       = 0.75 * candidate_asking_price
annualPmt        = amortizedPayment(loanAmount, rate, years)   // standard mortgage formula
candidateROE     = (candidate_noi - annualPmt) / buyerEquity   // buyerEquity = same denominator as above
roeImprovementPP = (candidateROE - buyerCurrentROE) * 100      // percentage points
roeImprovementRel = candidateROE / buyerCurrentROE - 1         // relative
```

**Eligibility gate**: drop the candidate unless `candidateROE > buyerCurrentROE` by any positive margin. If either ROE can't be computed (missing NOI/price/loan/equity ≤ 0), the pair is ineligible — no fallback match. This replaces the current `MATCH_THRESHOLD` cutoff on `total_score`.

**Score (0–100) for eligible matches**:

- **70% ROE improvement**: normalize `roeImprovementPP` over a configured range (default 0pp → +5pp maps to 0 → 100, clamped). Tunable in `match-config.ts`.
- **30% fit (geo + asset + strategy)**: weighted average of the existing `scoreGeo` / `scoreAsset` / `scoreStrategy`. Each one stays neutral (50, treated as no-signal) when the buyer left that criteria field blank — preserves the "criteria optional" stance. Blank criteria do **not** drag the score down: the fit component averages only the dimensions the buyer actually specified, and if all three are blank, fit = 100 (pure ROE ranking).
- **Quality tiebreaker (±a few points)**: small bonus/penalty from occupancy and building age via the existing `scoreFinancial` logic, scaled to ≤ ±3 points so it only breaks ties.

Price-band scoring is removed from the weighted total (ROE already encodes affordability), but we keep an affordability sanity check: if `candidate_asking_price > buyerEquity / (1 - 0.75)` (i.e. requires more than 75% LTV), drop the candidate.

## Boot

`calculateBoot` is unchanged and still runs for every eligible match. The `estimated_*_boot` and `boot_status` columns continue to be persisted exactly as today.

## Both directions

`computeMatchesForExchange` handles buyer-side (this exchange × other properties) and seller-side (this property × other exchanges). Both paths call the same `scorePair(buyerExchange, buyerRelinquishedFin, candidateProp, candidateFin, settings)`, so both directions get ROE scoring without divergence.

## Settings loader

Add `loadMatchSettings(db)` at the top of `computeMatchesForExchange` that does one `select` on `app_settings`. If missing or row absent, fall back to `{ mortgage_interest_rate: 7.0, mortgage_amortization_years: 25 }` and log a warning. Passed into the scorer so we don't re-fetch per candidate.

## `match-config.ts` (all knobs in one place)

```ts
export const MATCH_WEIGHTS = { roe: 0.7, fit: 0.3 } as const;
export const FIT_SUBWEIGHTS = { geo: 0.4, asset: 0.35, strategy: 0.25 } as const;
export const ROE_IMPROVEMENT_FULL_SCORE_PP = 5;   // pp above baseline = 100
export const QUALITY_TIEBREAKER_MAX_POINTS = 3;
export const MAX_COMMERCIAL_LTV = 0.75;
export const ELIGIBILITY_MIN_ROE_IMPROVEMENT_PP = 0; // strictly > baseline
export const FALLBACK_MORTGAGE_RATE = 7.0;
export const FALLBACK_AMORTIZATION_YEARS = 25;
```

`MATCH_THRESHOLD` is removed; eligibility is now the ROE gate.

## Migration — persist ROE on `matches`

```sql
ALTER TABLE public.matches
  ADD COLUMN buyer_current_roe       numeric,
  ADD COLUMN candidate_roe           numeric,
  ADD COLUMN roe_improvement_pp      numeric,
  ADD COLUMN roe_improvement_rel     numeric,
  ADD COLUMN candidate_annual_debt_service numeric;
```

All nullable (older rows + edge cases where math can't run). `persistMatchesAndNotifications` writes them on upsert. Existing `price_score / geo_score / asset_score / strategy_score / financial_score` columns are kept (UI compatibility, debugging) — `price_score` becomes the ROE component score, `financial_score` becomes the quality-tiebreaker score, others unchanged in meaning.

## UI — "Why this matched"

Update `src/features/matches/components/inbox/WhyThisMatched.tsx` and the breakdown panel in `src/pages/agent/AgentMatchDetail.tsx` to lead with:

```text
Current ROE 6.2%  →  Projected ROE 8.4%   (+2.2 pp, +35%)
```

Drive it from the new `matches.buyer_current_roe / candidate_roe / roe_improvement_pp / roe_improvement_rel` columns; fall back gracefully when null (older rows). Keep the existing fit/boot sub-cards underneath. No other UI changes in this phase.

## Conflicts with current code (to fix as part of this work)

1. **Buyer-side scorer has no access to relinquished financials today.** Need to fetch `property_financials` for `exchange.relinquished_property_id` and pass into the scorer. Same `otherFinancialMap` pattern as seller side.
2. **`scorePrice` uses `exchange_proceeds`** as the equity proxy; spec uses `asking − loan_balance`. Two are usually close but not identical. Spec wins; `exchange_proceeds` stays for boot only.
3. **`MATCH_THRESHOLD`** + 5-component weighted total are removed/restructured. Any code that imports `MATCH_THRESHOLD` will need updating (only `matching-core.ts` does).
4. **Match-detail UI** currently emphasizes price/geo/asset/strategy/financial bars; needs the ROE summary added on top. Existing bars stay so nothing breaks.
5. **No field-name mismatches in `property_financials`** — `noi`, `asking_price`, `loan_balance` all exist and are what the Phase 1 validation will guarantee on new/edited listings. Older listings predating Phase 1 may still have nulls; those candidates and those buyers' relinquished properties will fail the eligibility gate cleanly (ineligible, not crash).

## Out of scope

No changes to `app_settings`, Phase 1 validation, auth, edge function entry points, notifications payload, or any other table beyond the `matches` column additions.

## Verification

- Unit-shaped manual test in a scratch script against seeded data: one buyer with known relinquished NOI/price/loan, three candidates straddling the ROE baseline — confirm only the improvers are persisted and ordering matches manual ROE math.
- Trigger `run-auto-matching` for an existing exchange; confirm new columns populated and Why-this-matched UI shows the ROE line.
- Edit a candidate listing via `update-exchange` path; confirm inline matching recomputes ROE columns on the upsert.
