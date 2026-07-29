## What's going on

The matching engine is working — it deliberately refused to match your two properties because **they're both under the same agent account**.

I checked the live data for `steve@multifamilyproperties.com` (agent `e4b7d15b…`). That account has three active listings, all in MA, all non-demo:

| Property | Asset | Ask | Loan | NOI |
|---|---|---|---|---|
| Manchester | other | $550,000 | $250,000 | $38,400 |
| Manchester | multifamily | $1,300,000 | $775,000 | $60,000 |
| Gloucester | multifamily | $2,590,000 | $1,300,000 | $180,000 |

All three belong to the **same** `agent_id`. Both scan directions in the matching core explicitly exclude the caller's own inventory (`.neq("agent_id", userId)` on the buyer-side property scan and on the seller-side exchange scan). So with only one agent in the live workspace, the candidate pool is empty every run and zero matches are produced — no error, no notification, nothing to see.

That exclusion is intentional: the product is a cross-agent network, and a match is meant to introduce two different agents. It is not a bug, but it does mean **you can never test matching from a single account.**

For what it's worth, the underlying economics would have produced a match if the accounts were different: the Manchester multifamily buyer (equity $525k, current ROE ≈2.5%) paired against the Gloucester listing clears the affordability ceiling and improves ROE to ≈2.9%, which passes the eligibility gate. The $550k listing would still be correctly rejected — it lowers ROE.

Secondary note: all three exchanges have **empty replacement criteria** (no target states, no asset types, price min/max = 0). That doesn't block matching — blank preferences fall back to pure ROE ranking — but it means fit scoring contributes nothing and your matches would rank on ROE alone.

## Proposed work

**1. Make single-account testing possible (admin-only)**

Add an admin-only "match as if cross-agent" toggle to the existing Matching QA card on the admin exchange detail page. It passes a flag through `run-auto-matching` (already admin-gated, already supports `dry_run` + `explain`) into `computeMatchesForExchange`, which skips the `neq("agent_id")` filter. Dry-run only by default, so nothing is persisted and no emails fire — you get the full diagnostics table showing exactly why each candidate matched or was skipped.

**2. Surface "no counterparties" instead of silence**

Right now an activation with an empty candidate pool looks identical to a broken engine. After activation, when matching returns zero, the activate result dialog should say plainly that the listing is live and being scanned, but there are currently no counterparty listings in the network to match against — rather than just "activated".

**3. Empty-criteria warning in the wizard**

Flag at review time when target states / asset types / price range are all blank, explaining that the listing will be ranked on ROE alone. Non-blocking.

## Technical details

- `supabase/functions/_shared/matching-core.ts` — add an optional `includeSameAgent` param to `computeMatchesForExchange`, applied to both the `pledged_properties` and `exchanges` candidate queries. Default `false`; no behavior change for the normal path.
- `supabase/functions/run-auto-matching/index.ts` — accept `include_same_agent`, honored **only** when the caller passed the admin check that's already there, and force `dry_run` when it's set so self-matches can never be persisted or emailed.
- `src/pages/admin/AdminExchangeDetail.tsx` — checkbox in the Matching QA card wired to the new flag.
- `src/components/exchange/ActivateResultDialog.tsx` — zero-match copy.
- `src/components/exchange/StepReview.tsx` — blank-criteria notice.

No database migration, no change to the live matching rules, and the cross-agent exclusion stays in force for every real run.
