# Fix: "Request a referral agent" form fails to submit

## Root cause (verified)

The `public.referrals` table has RLS policies that *allow* the insert:

- `Anon can create referral` — INSERT, role `anon`, `WITH CHECK (true)`
- `Anyone can create referral` — INSERT, role `authenticated`, `WITH CHECK (true)`
- `Admins can manage referrals` — ALL, admin only
- `Agents can read assigned referrals` — SELECT for the assigned agent

…but the table has **zero table-level GRANTs** (`information_schema.role_table_grants` returns no rows for it). Supabase's Data API (PostgREST) does not grant default privileges on the `public` schema, so the request is rejected at the privilege layer before RLS is ever consulted. Every submit — from `/signup` → "I'm a landlord looking for an agent" and from the `/for-landlords` referral form — fails with a permission error, which the UI surfaces as "Something went wrong" / "We couldn't submit your details."

Both submit call sites (`src/pages/auth/Signup.tsx` and `src/pages/ForLandlords.tsx`) post the correct columns; nothing in the client code needs to change.

## What to change

One small SQL migration that adds the missing grants. No app code, no policy changes.

```sql
-- Public landing pages must be able to create referral leads.
GRANT INSERT ON public.referrals TO anon;
GRANT INSERT ON public.referrals TO authenticated;

-- Admin + assigned-agent read/manage policies need table-level SELECT/UPDATE
-- to actually work through the Data API.
GRANT SELECT, UPDATE ON public.referrals TO authenticated;

-- Server-side / edge-function access.
GRANT ALL ON public.referrals TO service_role;
```

Scoped exactly to what the existing RLS policies already allow — RLS still gates every row; the grants just unblock PostgREST.

## Verification

1. Signed out, open `/for-landlords`, fill the "Get connected" form, submit → success screen, and a new row appears in `public.referrals`.
2. Signed out, open `/signup` → "I'm a landlord looking for an agent" → submit → success screen, new row appears.
3. As an admin, confirm the row is visible in the admin intake view.
4. Re-run the Supabase linter to confirm no new warnings.
