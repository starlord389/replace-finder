Reset demo data, lock seeding to your account, then rebuild the seed function from scratch.

## 1. Wipe all existing seed data (one-time SQL)

Run a single migration that deletes everything tagged `__mock__` plus the mock counterparty agents, in dependency order:

```text
notifications → messages → exchange_connections → matches → exchange_timeline
→ identification_list → replacement_criteria → exchanges → property_financials
→ property_images → property_documents → pledged_properties → agent_clients
→ user_roles + profiles + auth.users for mock.agent.*@replacefinder.test
```

After this, every workspace (including yours) has zero demo data.

## 2. Lock seeding to starlord389@gmail.com only

In `seed-counterparty-agents/index.ts`, hard-gate the `seed-all` and `clear-all` actions:

- Reject the call (403) unless `caller.email === 'starlord389@gmail.com'`.
- The default `counterparties-only` action also becomes owner-only (so nobody else can recreate mock agents either).
- Remove the dev `Seed mock data` UI panel for everyone except your account (already gated by role, but I'll tighten it to email match so it doesn't show on other admin accounts you might create).

## 3. Rebuild the seed function from scratch

Throw out the current `seedAll` body and rewrite it to mirror exactly how an agent would set things up through the wizards, so every required field gets populated and the matching engine actually computes:

**Counterparty agents (8):** real-looking profiles (full_name, brokerage_name, phone, license_state, mls_number, verification_status='verified', avatar). Each owns 1-2 fully-filled listings.

**Your clients (10):** mix of buyer-side, seller-side, and dual. Every client gets `client_name`, `client_email`, `client_phone`, `client_company`, status, plus realistic `notes` describing their 1031 situation.

**Your listings (5):** `pledged_properties` with the full physical/legal block including the two new fields:
- `address_is_public` (mix of true/false)
- `owner_authorization_confirmed: true` on every active listing
- Plus images, financials (T-12 income, full opex breakdown, debt terms, occupancy, rent roll summary), and a `description`.

**Exchanges (12) across all lifecycle stages:**
- 2 `draft` (mid-wizard)
- 3 `active` (pledged, awaiting sale)
- 3 `in_identification` (sale_close_date set → auto 45/180 deadlines, 1-3 identified replacements in `identification_list`)
- 2 `in_closing` (replacement chosen, under contract)
- 2 `completed` (actual_close_date set)
- Each gets `exchange_proceeds`, `estimated_equity`, a complete `replacement_criteria` row (price range, target states, asset types, strategy, year-built floor, ROE goal), and `exchange_timeline` events at every stage transition.

**Matches (25-30):** real engine-shaped rows with `price_score`, `geo_score`, `asset_score`, `strategy_score`, `financial_score`, `timing_score`, `total_score`, `boot_status`, `estimated_boot`, `buyer_current_roe`, `candidate_roe`, `roe_improvement_pp`, status mix (`new`, `viewed`, `interested`, `passed`).

**Connections (6):** spread across `pending`, `accepted`, `under_contract`, `closed`, `failed` with the right timestamps and a `facilitation_fee_amount` where accepted.

**Messages + notifications:** 3-5 message threads on accepted connections, ~15 notifications across types (new_match, connection_request, message, deadline_warning).

Every insert is wrapped so it tags `__mock__` somewhere (description or notes) for future cleanup.

## 4. Re-seed and verify

- Call `seed-all` as you (already signed in).
- Verify counts in the DB and screenshot the Agent dashboard, Pipeline, and Matches inbox so you can confirm the numbers look real.

## Technical details

- **Email gate** is checked server-side from the JWT-decoded email (case-insensitive); the existing role check stays as a second guard.
- The `target_user_id` service-role override is **removed** (no escape hatch).
- Counterparty seeding uses `auth.admin.createUser` with `email_confirm: true` and inserts matching `profiles` + `user_roles('agent')` rows so RLS lets them appear as real agents.
- The wipe migration uses `DELETE … WHERE` (not TRUNCATE) so it respects foreign keys; mock counterparty `auth.users` rows are removed last via `auth.admin.deleteUser` from a one-time edge call (since the migration tool can't touch the `auth` schema). I'll do that step right after the migration runs.
- No schema changes — only data.

After approval I'll: (a) run the cleanup, (b) rewrite the function, (c) redeploy, (d) call seed-all, (e) report counts.