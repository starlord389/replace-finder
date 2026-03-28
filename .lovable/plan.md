

# Fix: Admin Routes Returning 404

## Changes

### 1. Database — Assign admin role to first user
Insert the `admin` role for the first user in `profiles` (uses `ON CONFLICT DO NOTHING` for safety).

### 2. `src/components/layout/AdminLayout.tsx` — Improve redirect behavior
Current line 24-26 redirects to `/` when user lacks admin role. Change to:
- Redirect to `/dashboard` instead of `/`
- Show a toast: "You don't have admin access."
- The loading check on line 16 already handles waiting for auth state — this is correct

Only change: line 24-26, redirect target from `"/"` to `"/dashboard"` and add toast effect.

Implementation: Use `useEffect` + `useNavigate` pattern instead of `<Navigate>` so we can fire the toast before redirecting. Or simpler: keep `<Navigate to="/dashboard">` and add a `useEffect` that fires the toast when `!loading && (!user || !hasRole("admin"))`.

