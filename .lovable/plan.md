

# Seed Test Data Migration

Run a single migration with a `DO $$` block that inserts 2 exchange requests, preferences, 4 inventory properties with financials, a completed match run, 3 approved match results, 3 matched_property_access rows, and status history — all referencing the first user in `profiles`.

All inserts use `ON CONFLICT DO NOTHING` for re-run safety. Enum values confirmed from schema: `multifamily`, `net_lease`, `industrial`, `self_storage`, `core`, `core_plus`, `active`, `submitted`, `approved`, `completed`.

### Single migration file

One `DO $$` block with variables for all UUIDs. Steps:
1. Select first profile user into `test_user_id`
2. Insert 2 `exchange_requests` (one `active`, one `submitted`)
3. Insert `exchange_request_preferences` for request 1
4. Insert 4 `inventory_properties`
5. Insert 4 `inventory_financials`
6. Insert 1 `match_runs` (completed)
7. Insert 3 `match_results` (all approved, no client response)
8. Insert 3 `matched_property_access` rows
9. Insert 2 `exchange_request_status_history` rows

No code changes needed — migration only.

