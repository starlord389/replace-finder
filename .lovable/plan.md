

# Add Debug Role Page

Two file changes:

1. **Create `src/pages/DebugRole.tsx`** — the debug component from the user's spec, showing auth user ID, email, `hasRole("admin")`, roles from `useAuth()`, direct DB query of `user_roles`, and profile data.

2. **`src/App.tsx`** — import `DebugRole` and add `<Route path="/debug-role" element={<DebugRole />} />` as a standalone route outside any layout wrapper (before the catch-all `*` route).

No other changes. No layout, no auth guard, no RLS modifications.

