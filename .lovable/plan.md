

# Admin Panel CRM Overhaul: Sidebar Layout + Dashboard

## Overview
Replace the admin top-tab navigation with a CRM-style sidebar layout matching the client side, and add an admin dashboard home page with KPIs and recent activity.

## Files to Create

### 1. `src/components/layout/AdminSidebar.tsx`
Modeled after ClientSidebar.tsx. Same SidebarProvider/collapsible pattern.
- Logo: "1031ExchangeUp" + small red "Admin" badge
- "Operations" group: Dashboard (/admin, exact), Requests (/admin/requests), Inventory (/admin/inventory), Matches (/admin/matches)
- "Management" group: Clients (/admin/clients), Support (/admin/support)
- Footer: admin email, "Switch to Client View" link → /dashboard, Sign Out button
- Same active/hover styles as ClientSidebar

### 2. `src/components/layout/AdminHeader.tsx`
Modeled after ClientHeader.tsx. SidebarTrigger left, avatar right, sticky h-14 with backdrop blur.

### 3. `src/pages/admin/AdminDashboard.tsx`
The /admin home page with:

**KPI Cards** (6 cards in responsive grid):
- Active Requests (count where status='active', blue tint)
- Pending Review (count where status in submitted/under_review, blue tint)
- Properties in Inventory (count where status='active', green tint)
- Matches Pending Review (match_results where status='pending', amber tint)
- Client Responses (match_results approved + client_response not null, amber tint)
- Awaiting Response (match_results approved + client_response null, amber tint)

All fetched in parallel on mount.

**Quick Actions Row**: "Add Property" → /admin/inventory/new, "View Requests" → /admin/requests (outline buttons with icons)

**Pipeline Summary**: Horizontal row showing count per request status (draft/submitted/under_review/active/closed), each clickable → /admin/requests?status=X

**Recent Activity**: Simplified approach — fetch 10 most recent exchange_request_status_history entries joined with exchange_requests for context. Show as vertical timeline with icons, text, relative timestamps, and links to request detail.

### 4. `src/pages/admin/ClientList.tsx`
Placeholder page: heading "Clients", subheading "Client management coming soon.", empty state card.

## Files to Modify

### 5. `src/components/layout/AdminLayout.tsx`
Full rewrite. Replace top-tab nav with SidebarProvider + AdminSidebar + AdminHeader + Outlet pattern (matching ClientLayout structure). Keep existing auth/role guard logic unchanged.

### 6. `src/App.tsx`
Add two new admin routes (above existing ones inside the AdminLayout route):
- `<Route path="/admin" element={<AdminDashboard />} />` (index/home)
- `<Route path="/admin/clients" element={<ClientList />} />`

## Technical Details
- KPI queries use `supabase.from().select("id", { count: "exact", head: true })` for efficient counting
- Pipeline counts come from the same requests fetch, grouped client-side
- Activity feed uses status history joined with request data for context
- Relative time formatting via a small helper (no library needed)
- No database changes required

