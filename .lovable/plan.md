# Remove orphaned `run-matching` edge function

## Verification (done against your actual project)

**1. Reference search — zero hits.**
Searched the entire repo (`src/`, `supabase/`, all hidden files) for `run-matching`, `runMatching`, and `run_matching`. No matches anywhere:
- Not invoked from frontend (no `supabase.functions.invoke("run-matching")`)
- Not called from any other edge function
- Not referenced from `_shared/`
- The function's `index.ts` does not import from `_shared/`, so no shared module exists solely to support it
- No cron jobs and no database triggers exist in the project (prior investigation), so it cannot be invoked on a schedule

**2. Dependency tables — confirmed missing.**
Queried `information_schema.tables` for the 6 tables `run-matching` depends on:
`exchange_requests`, `exchange_request_preferences`, `inventory_properties`, `inventory_financials`, `match_runs`, `match_results` — **none exist** in the `public` schema.

Conclusion: `run-matching` is fully orphaned and safe to remove.

## Plan

1. Delete the directory `supabase/functions/run-matching/` (contains only `index.ts`).
2. Call the platform's edge-function delete tool to remove the deployed `run-matching` function from Lovable Cloud so it no longer exists server-side.

## Not touched

- `run-auto-matching/` (live matching) — untouched
- `automation-worker/`, `create-exchange/`, `update-exchange/`, `seed-counterparty-agents/`, `_shared/` — untouched
- `matches` table and all live matching data — untouched
- No database schema changes
- No frontend changes (nothing references it)
