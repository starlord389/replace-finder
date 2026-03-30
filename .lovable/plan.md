

# Fix Perpetual Loading on Dashboard

## Root Cause
The `onAuthStateChange` callback in `useAuth.tsx` uses `async/await` to fetch roles. Supabase documentation explicitly warns against awaiting inside this callback — it can deadlock because `getSession()` internally fires `onAuthStateChange` with an `INITIAL_SESSION` event, and the awaited role query blocks the callback from returning, preventing `getSession` from resolving.

## Changes

### 1. `src/hooks/useAuth.tsx` — Remove `await` from `onAuthStateChange`
- Change the `onAuthStateChange` callback from `async` to a regular function
- Replace the `await supabase.from("user_roles")...` with a `.then()` chain (same pattern already used in the `getSession` block below it)
- This unblocks the Supabase auth initialization flow

### 2. `src/pages/client/Launchpad.tsx` — Handle edge case where data fetch doesn't run
- No structural change needed — once auth resolves properly, `user` will be available and the `useEffect` will execute and set `loading = false`
- The fix in useAuth is sufficient

## What stays the same
- No database changes
- No RLS changes
- No routing changes
- All other pages untouched

