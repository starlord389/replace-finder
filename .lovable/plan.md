

# Fix 5 Runtime Bugs

## Analysis

**Fix 1 (Navbar routing): Already fixed.** Lines 11-12 of Navbar.tsx already have the correct agent routing from the previous bug fix round.

**Fix 2 (ClientLayout agent redirect): Needed.** ClientLayout.tsx currently only checks `!user` — agents can still access the old client area.

**Fixes 3-4 (DB constraints): Already migrated** in the last round (migration `20260406195540`), but the user reports they're still failing. This likely means the migration didn't apply cleanly or needs to be re-run. A new migration with the same `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT` pattern will safely handle this.

**Fix 5 (property-images bucket): Needed.** No `property-images` bucket exists in the storage buckets list.

## Changes

### 1. `src/components/layout/ClientLayout.tsx`
- Destructure `profileRole` from `useAuth()`
- After the `!user` redirect, add: `if (profileRole === "agent") return <Navigate to="/agent" replace />`

### 2. Database migration (single migration, 3 statements)
- Re-apply notification type constraint with all 13 values (idempotent via `DROP IF EXISTS`)
- Re-apply timeline event type constraint with all 14 values (idempotent via `DROP IF EXISTS`)
- Create `property-images` storage bucket with public access + RLS policies for upload/view/delete

### No other changes
- Navbar.tsx is already correct — skip Fix 1
- No new files, no new routes, no refactoring

