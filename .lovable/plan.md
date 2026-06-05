# Realistic debt on seeded candidates

Data-only change. No schema edits, no scoring code edits. We update `loan_balance` on the 8 candidate `property_financials` rows so most candidates carry typical 70–75% LTV debt, with two deliberate outliers to keep boot scenarios visible. ROE math is untouched (debt service is computed on `0.75 × asking_price` regardless of the actual `loan_balance`, so the existing ROE spread is preserved exactly).

## How boot is computed (recap)

`calculateBoot()` in `_shared/matching-core.ts`:
- `cashBoot = max(0, exchange_proceeds − candidate_asking_price)`
- `mortgageBoot = max(0, buyer_loan_balance − candidate_loan_balance)`
- `totalBoot = cashBoot + mortgageBoot`
- Status: `no_boot` (=0) · `minor_boot` (<5% of proceeds, i.e. <$40k here) · `significant_boot` (else)

All three buyers have `exchange_proceeds = 800k` and candidate prices ≥ $2.4M, so `cashBoot` is always 0. **Boot is entirely driven by `buyer_loan − candidate_loan`.** That's the only knob we need to turn.

## New candidate loan balances

| Cand | Price | NOI | **New loan** | New LTV | Rationale |
|---|---|---|---|---|---|
| 1 (Phoenix MF) | $3.0M | $260k | **$200,000** | 7% | **Outlier** — under-leveraged seller, creates significant boot for every buyer |
| 2 (Charlotte Ind) | $3.2M | $280k | **$2,300,000** | 72% | Realistic trade-up, fully covers buyer debt |
| 3 (Houston MF) | $3.2M | $230k | **$2,300,000** | 72% | Realistic |
| 4 (Mesa Retail) | $2.8M | $185k | **$2,000,000** | 71% | Realistic |
| 5 (Tempe Ind) | $3.0M | $200k | **$2,100,000** | 70% | Realistic |
| 6 (Miami Retail) | $2.4M | $135k | **$1,700,000** | 71% | Realistic |
| 7 (Raleigh Off) | $3.0M | $260k | **$2,200,000** | 73% | Realistic |
| 8 (Durham Off) | $2.8M | $215k | **$1,680,000** | 60% | Mildly under-leveraged, yields minor boot for Buyer B only |

## Projected boot per existing match (10 rows)

Buyer A loan = $1.2M · Buyer B = $1.7M · Buyer C = $0.7M. Proceeds = $800k → minor threshold = $40k.

| Match | Cand loan | New boot | Status | ROE Δpp |
|---|---|---|---|---|
| A → 1 | $0.20M | **$1,000,000** | significant | +3.65 |
| A → 2 | $2.30M | $0 | **none** | +4.56 |
| A → 7 | $2.20M | $0 | **none** | +3.65 |
| B → 1 | $0.20M | **$1,500,000** | significant | +4.65 |
| B → 2 | $2.30M | $0 | **none** | +5.56 |
| B → 7 | $2.20M | $0 | **none** | +4.65 |
| B → 8 | $1.68M | $20,000 | **minor** | +0.61 |
| C → 1 | $0.20M | **$500,000** | significant | +2.65 |
| C → 2 | $2.30M | $0 | **none** | +3.56 |
| C → 7 | $2.20M | $0 | **none** | +2.65 |

Result spread: **6 none · 1 minor · 3 significant**. The "$1.7M boot on every match" pattern goes away; the outlier (cand-1) keeps the significant-boot path visible end-to-end.

## Sanity checks

- ROE math unaffected: scorer uses `0.75 × asking_price` for debt service, not `loan_balance`. The +0.61 → +5.56pp spread from before is preserved.
- Affordability gate unaffected: gate uses buyer equity vs. candidate price, no loan input.
- Eligibility unchanged: same 10 matches survive, just with refreshed boot fields.

## Execution (build phase)

1. One migration: `UPDATE public.property_financials SET loan_balance = ... WHERE property_id = ...` for the 8 candidates (or a single `UPDATE ... CASE` statement).
2. Refresh existing match rows so `estimated_total_boot` / `boot_status` reflect the new debts. Two options — recommend (a):
   - **(a)** Re-invoke the existing `run-auto-matching` flow for the 3 buyer exchanges (or a tiny throwaway edge function as in Phase 3) so matches are recomputed by the real engine. No code path differs from production.
   - **(b)** Directly `UPDATE matches SET estimated_total_boot = ..., estimated_mortgage_boot = ..., boot_status = ...` in the same migration for the 10 known rows. Faster but bypasses the engine.
3. Verify with `SELECT buyer_exchange_id, seller_property_id, estimated_total_boot, boot_status FROM matches ORDER BY 1,2;` — counts should be 6 / 1 / 3.

No app code, no scoring config, no schema is touched.
