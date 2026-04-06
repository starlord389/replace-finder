

# Phase 1C: Agent Signup Flow + Updated Auth + Owner Referral Path

## Overview
Rewrite the signup page with a two-path flow (agent vs property owner), update login routing by role, extend the auth context with profile data, update the `handle_new_user` trigger, and add anon insert policy on referrals.

## Database Migration (1 migration file)

1. Add `'agent'` to `app_role` enum: `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent'`
2. Replace `handle_new_user()` function to read `role` from `raw_user_meta_data` and set both `profiles.role` and `user_roles.role` accordingly
3. Add anon INSERT policy on `referrals`: `CREATE POLICY "Anon can create referral" ON public.referrals FOR INSERT TO anon WITH CHECK (true)`

## Files to Modify

### 1. `src/pages/auth/Signup.tsx` — Full rewrite (~350 lines)

Three-state component controlled by a `step` state: `'choose'`, `'agent'`, `'referral'`.

**Step: choose** — Two Card options centered on page. "I'm a Real Estate Agent" and "I'm a Property Owner". Clicking sets step.

**Step: agent** — Single-page form with three sections (Account, Professional Info, Specializations). Back button to return to choose. On submit:
- `supabase.auth.signUp` with `data: { full_name, phone, role: 'agent' }`
- After signup, update profile with agent fields and upsert `user_roles` with `'agent'`
- Toast success, navigate to `/login`
- Inline validation: required fields, password match, min 8 chars

**Step: referral** — Simple form (name, email, phone, location, type, value, notes). No auth required. On submit:
- Insert into `referrals` table using anon client
- Replace form with success message + "Back to Home" link
- No navigation away

### 2. `src/pages/auth/Login.tsx` — Minor update (~5 lines changed)

After successful `signInWithPassword`, fetch `profiles.role` for the user, then navigate:
- `'admin'` → `/admin`
- `'agent'` → `/dashboard`
- `'client'` or default → `/dashboard`

### 3. `src/hooks/useAuth.tsx` — Extend context

Add to state: `profileRole`, `profileName`, `agentVerificationStatus` (all string | null), plus computed `isAgent` and `isVerifiedAgent` booleans.

After fetching `user_roles`, also fetch `profiles` row (`role, full_name, verification_status`). Expose all new fields in context. Existing `hasRole()` continues to work unchanged.

### 4. `src/components/layout/Navbar.tsx` — Use profileRole

When authenticated, use `profileRole` from `useAuth` to determine dashboard link label/target:
- `'admin'` → "Admin" link to `/admin`
- `'agent'` → "Dashboard" link to `/dashboard`
- `'client'` → "My Exchange" link to `/dashboard`

Minor change — swap the hardcoded `/dashboard` link for role-conditional rendering.

## No other files changed. No new routes needed — `/signup` already exists in PublicLayout.

## Technical Notes
- The `handle_new_user` trigger update means new agent signups get `profiles.role = 'agent'` and `user_roles.role = 'agent'` automatically. The post-signup profile update in the signup form is a belt-and-suspenders approach for the transition period.
- The referral form works without auth via the anon INSERT policy.
- US_STATES and ASSET_TYPE_LABELS already exist in `constants.ts` — reuse them.

