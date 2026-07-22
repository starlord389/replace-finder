
## Goal

Give the matching pipeline a repeatable, hands-off way to prove it works: a fixed staging dataset that can be re-seeded any time, plus automated tests that run against it and cover matching math, approval/persistence, and the notification email path.

## What to build

### 1. Repeatable staging dataset

New edge function `seed-staging-dataset` (admin-only, `verify_jwt=false` with in-code admin check via `has_role`) that:

- Wipes any existing rows tagged `is_demo=true` for the staging agents (idempotent).
- Creates 2 fixed staging agents (`staging-buyer@1031exchangeup.test`, `staging-seller@1031exchangeup.test`) via `auth.admin.createUser` if missing; stores their ids in `app_settings` under key `staging_dataset` so re-runs are deterministic.
- Inserts a curated set of `pledged_properties` + `property_financials` + `exchanges` + `replacement_criteria`, all `is_demo=true`, chosen to exercise:
  - one clean match (ROE upgrade, in-budget, geo+asset fit)
  - one affordability rejection (candidate price > equity ceiling)
  - one no-ROE-upgrade rejection
  - one seller-side match (buyer exchange from other agent matches staging listing)
  - one missing-financials skip
- Returns a JSON manifest (ids of everything created) that tests can consume.

Admin trigger: add a "Re-seed staging data" button on the existing admin QA area (Deal Oversight page header) that calls the function and toasts the manifest summary.

### 2. Deno unit tests for `matching-core.ts`

`supabase/functions/_shared/matching-core.test.ts` — pure-logic tests, no DB, no network:

- `scorePairExplained` returns `ok:true` with expected `roe_improvement_pp` and total for a clean upgrade.
- Returns `ok:false` with `reason` starting `candidate price` when price exceeds affordability ceiling.
- Returns `ok:false` with `reason` starting `no ROE upgrade` when candidate ROE ≤ buyer ROE.
- Returns `ok:false` when required financials are missing.
- `blendFit` returns 100 when buyer has no criteria (pure-ROE ranking).
- Boot calculation returns `cash_boot > 0` when candidate price < proceeds.

Run via `supabase--test_edge_functions` with `functions: ["_shared"]` pattern (or a dedicated wrapper function that re-exports).

### 3. Deno integration test for `run-auto-matching`

`supabase/functions/run-auto-matching/index.test.ts`:

- Loads env via `deno.land/std/dotenv/load.ts`.
- Calls `seed-staging-dataset` to establish known state.
- Signs in as the staging buyer, invokes `run-auto-matching` with `{explain:true, dry_run:true}`, asserts:
  - buyer-side eligible count = 1
  - diagnostics contain one "candidate price ... exceeds affordability" skip
  - diagnostics contain one "no ROE upgrade" skip
- Invokes again with `dry_run:false`, asserts `total_new_matches ≥ 1` and that a row now exists in `public.matches` with the expected buyer/seller pair.
- Asserts a row exists in `email_send_log` with `template_name='new-match-notification'` for the buyer agent within the last minute.

### 4. Approval-path assertion

The current "approval" step is the `matches` row being persisted and surfaced through `matched_property_access`. The integration test also asserts that after the persist run the staging seller can read the buyer's exchange summary through the standard client APIs (proves RLS + view wiring end-to-end).

### 5. Wiring

- Add `supabase/functions/seed-staging-dataset/index.ts` with corsHeaders, admin gate, and idempotent seed logic.
- Add tests as above; no `deno.lock` changes.
- Add a small admin button in `src/pages/admin/AdminDealOversight.tsx` (or nearest admin index) that calls the seeder and shows a toast.
- No changes to production tables/schemas; everything piggybacks on the existing `is_demo` flag.

## Not in scope

- No frontend Vitest suite — the interesting logic lives in edge functions; a React test would only cover the QA card render.
- No CI config changes — tests are invoked via the `test_edge_functions` tool on demand.
- No new email templates; reuses existing `new-match-notification`.

## Deliverables

1. `supabase/functions/seed-staging-dataset/index.ts`
2. `supabase/functions/_shared/matching-core.test.ts`
3. `supabase/functions/run-auto-matching/index.test.ts`
4. Small admin button + handler in the deal oversight page.
5. One green run of both test files against a freshly seeded dataset.
