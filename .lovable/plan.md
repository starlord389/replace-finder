

# Fix: useAuth Race Condition + Remove Debug Page

## Problem
`useAuth` sets `loading = false` after session resolves, but roles are fetched asynchronously after that — creating a window where `AdminLayout` sees `loading=false` + empty `roles` and redirects.

## Changes

### 1. `src/hooks/useAuth.tsx` — Split loading into `authLoading` + `rolesLoading`
- Add `authLoading` (default `true`) and `rolesLoading` (default `true`) states
- Remove the single `loading` state, replace with `const loading = authLoading || rolesLoading`
- In `onAuthStateChange`: set `authLoading = false` after setting session/user. If no user, also set `rolesLoading = false`. If user exists, fetch roles then set `rolesLoading = false`.
- In `getSession().then(...)`: same pattern — set `authLoading = false`, and `rolesLoading = false` after roles query completes (or immediately if no user).
- Remove the `setTimeout` wrapper around the role fetch in `onAuthStateChange` — fetch directly and set `rolesLoading = false` in the `.then()`.

### 2. Delete `src/pages/DebugRole.tsx`

### 3. `src/App.tsx` — Remove debug route
- Remove the `import DebugRole` line
- Remove `<Route path="/debug-role" element={<DebugRole />} />`

