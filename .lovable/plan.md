

# Dead Code Cleanup — Remove Old Routes and Imports

## Changes

### 1. `src/App.tsx`
- Remove 17 unused imports (ClientLayout, Launchpad, Overview, ExchangeList, ExchangeDetail, NewRequest, MatchList, MatchDetail, Profile, Help, RequestQueue, RequestDetail, InventoryList, InventoryDetail, MatchReview, MatchRunDetail, ClientList)
- Add `Navigate` import from react-router-dom
- Remove entire ClientLayout route group (lines 92-104)
- Add `<Route path="/dashboard/*" element={<Navigate to="/agent" replace />} />` as catch-all redirect
- Remove 7 admin routes (requests, inventory, matches, clients) from AdminLayout group (lines 109-116), keeping only Dashboard and Support

### 2. `src/pages/auth/Login.tsx`
- Change `let target = "/dashboard"` to `let target = "/agent"`

### 3. `src/components/layout/AdminSidebar.tsx`
- Remove Requests, Inventory, Matches from `operationsItems` — keep only Dashboard
- Remove Clients from `managementItems` — keep only Support
- Remove unused icon imports (`FileText`, `Building2`, `Handshake`, `Users`)
- Update "Switch to Client View" link from `/dashboard` to `/agent` (or remove it entirely since there's no client view)

### No database changes, no files deleted.

