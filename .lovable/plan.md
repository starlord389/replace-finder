# Wire up database trigger functions

## Findings (verified against current schema)

### 1. `handle_new_user` — needs fixing before binding

**What it does today:** On insert into `auth.users`, inserts `(id, email, full_name, phone)` into `public.profiles` and `(user_id, role)` into `public.user_roles`, defaulting role to `'agent'`. Reads from `NEW.raw_user_meta_data`.

**Schema check:** All target columns exist. `app_role` enum contains `agent`, `client`, `broker`, `admin`. Safe to call.

**State check:** No client code inserts into `profiles` or `user_roles` directly — `Signup.tsx` and `AcceptInvite.tsx` only call `auth.signUp` with metadata. Current row counts (`auth.users=6`, `profiles=6`, `user_roles=7`) indicate the trigger was bound previously, then dropped. **New signups today silently leave `profiles` empty → broken auth flow downstream.** Highest priority.

**Gaps with current signup form** (`src/pages/auth/Signup.tsx` sends extra metadata that the function ignores):
- `mls_number`, `license_state`, `brokerage_name` — exist as columns on `profiles`, sent by signup, but **not copied** by `handle_new_user`. New agents would land with blank verification fields.
- No `ON CONFLICT` guard — if a profile or role row already exists (re-run, backfill, manual seed), the trigger throws and the entire signup fails.

**Recommendation: fix the function before binding.** Specifically:
- Add `mls_number`, `license_state`, `brokerage_name` to the profiles insert.
- Add `ON CONFLICT (id) DO NOTHING` on profiles and `ON CONFLICT (user_id, role) DO NOTHING` on user_roles.

Then bind: `AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`

---

### 2. `auto_calculate_deadlines` — safe to bind as-is

**Logic:** When `sale_close_date` is set or changes, sets `identification_deadline = sale_close_date + 45 days` and `closing_deadline = sale_close_date + 180 days`.

**Schema check:** `exchanges` has `sale_close_date` (date), `identification_deadline` (date), `closing_deadline` (date). Logic is correct per IRS §1031 (45/180-day rules).

**Bind:** `BEFORE INSERT OR UPDATE ON public.exchanges FOR EACH ROW`. Trigger name should sort **before** `auto_exchange_status` so deadlines are set first if both fire on the same row.

---

### 3. `auto_exchange_status` — safe, but with one known gap

**Logic transitions on `exchanges`:**
- `draft` → `active` when both `relinquished_property_id` and `criteria_id` are set
- `active` → `in_identification` when `sale_close_date` is first set
- `in_closing` → `completed` when `actual_close_date` is first set

**Schema check:** All referenced columns exist. Function handles `OLD IS NULL` correctly so it works on INSERT too.

**Gap (not a blocker):** Nothing in the function ever transitions to `in_closing` (e.g., on identification completion). Status would only reach `completed` if some other code first sets `in_closing`. Worth noting but doesn't make binding unsafe — it just leaves a hole the app must fill elsewhere.

**Bind:** `BEFORE INSERT OR UPDATE ON public.exchanges FOR EACH ROW`, named to sort after `auto_calculate_deadlines`.

---

### 4. `update_updated_at_column` — safe, bind broadly

**Logic:** Sets `NEW.updated_at = now()`. Standard.

**Tables in `public` with `updated_at`:** `agent_clients`, `client_invites`, `exchange_connections`, `exchanges`, `matches`, `pledged_properties`, `profiles`, `property_financials`, `replacement_criteria`, `support_tickets`, `user_notification_preferences`.

**Bind:** `BEFORE UPDATE` on each of the 11 tables above.

---

## Proposed binding plan (single migration)

1. **Replace `handle_new_user`** with a version that:
   - Inserts all relevant metadata fields (`full_name`, `phone`, `mls_number`, `license_state`, `brokerage_name`) into `profiles`.
   - Uses `ON CONFLICT DO NOTHING` on both inserts.
   - Keeps `SECURITY DEFINER` and `search_path = public`.
2. **Create trigger** `on_auth_user_created` `AFTER INSERT ON auth.users` → `handle_new_user()`.
3. **Create trigger** `trg_exchanges_auto_deadlines` `BEFORE INSERT OR UPDATE ON public.exchanges` → `auto_calculate_deadlines()`.
4. **Create trigger** `trg_exchanges_auto_status` `BEFORE INSERT OR UPDATE ON public.exchanges` → `auto_exchange_status()` (name sorts after the deadline trigger).
5. **Create `BEFORE UPDATE` triggers** on the 11 tables listed above, each calling `update_updated_at_column()`. Named consistently (e.g. `trg_<table>_set_updated_at`).

All triggers use `CREATE TRIGGER IF NOT EXISTS` is not supported in Postgres, so use `DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER ...` pattern to make the migration idempotent.

## Risks / things you should know

- **Backfill not included.** Existing exchanges with a `sale_close_date` but no deadlines will not be retroactively updated; the new triggers only fire on future writes. Tell me if you want a one-time UPDATE to backfill.
- **Existing `auth.users` without a profile row** (none today, but worth noting) won't get one — the trigger only fires on new inserts. Current data is consistent so no action needed.
- **No trigger to push `in_closing`.** The status state machine has a hole; consider a future trigger or app-level logic when identification completes.

Nothing else needs changing. Ready to migrate on your approval.
