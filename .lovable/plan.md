
# Phase 1 Plan — Validation + `app_settings`

Scope: numeric validation on the live exchange wizard (client + server) and a new admin-editable `app_settings` row for the future ROE math. **No changes to matching-core, match-config, scoring, or the matches table.**

## 1. Wizard validation — `StepPropertyAndFinancials.tsx`

Extend the existing `validate()` to add numeric range checks alongside the current "not empty" checks.

Rules:
- `asking_price` — required, must parse to number, **> 0**
- `noi` — required, must parse to number, **≥ 0**
- `loan_balance` — required, must parse to number, **≥ 0**
- `occupancy_rate` — required, must parse to number, **0 ≤ x ≤ 100**

Behavior:
- Field-level error styling on the offending input (existing `errors` state, already wired to `border-destructive`).
- Inline helper text under each invalid field with the specific message (e.g. "Must be greater than 0", "Must be between 0 and 100").
- A small toast or summary message at the bottom of the step when the user clicks Continue with invalid values.
- "Continue" button stays enabled but blocks navigation until valid (matches current pattern).

No schema or type changes on the client.

## 2. Server-side validation — `create-exchange` and `update-exchange` edge functions

Add a shared validator (small inline helper, no new shared file needed — or `_shared/validate-financials.ts` if cleaner) that runs after the body is parsed and before any DB writes.

Checks (same rules as client):
- `financials.asking_price` is a finite number > 0
- `financials.noi` is a finite number ≥ 0
- `financials.loan_balance` is a finite number ≥ 0
- `financials.occupancy_rate` is a finite number between 0 and 100

On failure: return HTTP 400 with `{ error: "Invalid financials", details: { field: message, ... } }`. The frontend `createExchange` / `updateExchange` API wrappers already surface `error` from `supabase.functions.invoke`, so the existing mutation `onError` will display it; no frontend wiring change required beyond confirming the toast surfaces the message.

For `update-exchange`: only validate fields that are present in the payload (partial updates), but if a required financial field is being changed it must satisfy its rule.

## 3. New table — `public.app_settings`

Single-row global config. Created via `supabase--migration`.

Columns:
- `id` uuid PK default `gen_random_uuid()`
- `mortgage_interest_rate` numeric not null (percent, e.g. `7.25` means 7.25%)
- `mortgage_amortization_years` int not null
- `updated_at` timestamptz not null default `now()`
- `updated_by` uuid null (references the admin who last edited; not a FK to auth.users — store the id only)
- `singleton` boolean not null default true, with a unique index ensuring only one row can exist

Grants (in same migration, per project rules):
- `GRANT SELECT ON public.app_settings TO authenticated;`
- `GRANT ALL ON public.app_settings TO service_role;`
- No anon grant.

RLS:
- Enable RLS.
- Policy "Authenticated users can read settings" — `FOR SELECT TO authenticated USING (true)`.
- Policy "Admins can insert settings" — `FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'))`.
- Policy "Admins can update settings" — `FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'))`.
- No delete policy (table should never be deleted from).

Trigger: bind existing `public.update_updated_at_column()` as a `BEFORE UPDATE` trigger on this table.

Seed: insert the initial row in the same migration with sensible CRE defaults:
- `mortgage_interest_rate = 7.0`
- `mortgage_amortization_years = 25`

## 4. Admin UI

Add a new page at `/admin/settings` (registered in `routeManifest.ts` under the admin layout, admin-only guard) plus a link in `AdminSidebar`. Keeping it separate from `AdminDashboard` so the dashboard stays focused.

Page contents:
- Title: "Platform Settings"
- One card: "Mortgage Assumptions"
  - Description: "Used by the matching engine to estimate financing costs on candidate properties."
  - `mortgage_interest_rate` — numeric input, 2-decimal step, suffix `%`, range 0–25
  - `mortgage_amortization_years` — numeric input, integer step, range 1–40
  - `updated_at` + `updated_by` (email looked up from profiles) shown as small muted text
  - "Save changes" button — disabled until dirty, shows saving state
- Validation via zod on submit; same numeric bounds as inputs.
- On save: `UPDATE public.app_settings SET ... , updated_by = auth.uid()` against the single existing row (filter `WHERE singleton = true`). React Query mutation; invalidate the read query on success; toast success/error.

Read hook: `useAppSettings()` — `useQuery` selecting the single row; used by the admin page now and available for the future matching code.

Guarding: route uses existing admin role guard (same pattern as `/admin/dashboard` and `/admin/support-tickets`). Non-admins should not see the sidebar link or be able to load the page.

## 5. Files touched

New:
- `supabase/migrations/<timestamp>_app_settings.sql`
- `src/pages/admin/AdminSettings.tsx`
- `src/features/admin/hooks/useAppSettings.ts` (read + update mutation)

Edited:
- `src/components/exchange/StepPropertyAndFinancials.tsx` — extend `validate()` + helper text
- `supabase/functions/create-exchange/index.ts` — add validation guard
- `supabase/functions/update-exchange/index.ts` — add validation guard
- `src/app/routes/routeManifest.ts` — register `/admin/settings`
- `src/components/layout/AdminSidebar.tsx` — add nav link

Not touched (explicitly out of scope this phase):
- `supabase/functions/_shared/matching-core.ts`
- `supabase/functions/_shared/match-config.ts`
- `matches` table, scoring logic, match UI

## 6. Verification

- Build passes; types regenerated after migration include `app_settings`.
- Manual: try submitting wizard with `asking_price = 0`, `noi = -1`, `occupancy = 150`, `loan_balance = -5` → blocked client-side with clear messages.
- Manual: bypass client by calling `create-exchange` directly with bad values → 400 with error details.
- Manual: visit `/admin/settings` as admin → can read + save; visit as non-admin → blocked.
- Confirm seeded row exists with `7.0` / `25`.

Awaiting your approval before I start.
