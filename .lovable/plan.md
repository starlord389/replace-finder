

# Client Dashboard UX Redesign — Sidebar Navigation with Separate Pages

## Overview
Replace the current single-page client dashboard with a GoHighLevel-style sidebar layout. Each feature gets its own dedicated page accessible from a persistent left sidebar. Notifications live in a bell icon popover in the top header bar — not a separate page.

## Layout

```text
 ┌──────────────────┬──────────────────────────────────┐
 │  Logo            │  [SidebarTrigger]    🔔  Avatar  │
 │                  │──────────────────────────────────│
 │  ◉ Launchpad     │                                  │
 │  ◎ Overview      │       Page Content               │
 │  ◎ My Exchanges  │                                  │
 │  ◎ Matches       │                                  │
 │                  │                                  │
 │  ─────────────── │                                  │
 │  ◎ Settings      │                                  │
 │  ◎ Help          │                                  │
 │  ─────────────── │                                  │
 │  User · Sign Out │                                  │
 └──────────────────┴──────────────────────────────────┘
```

## Sidebar Pages

1. **Launchpad** (`/dashboard`) — Welcome hub with quick-action cards (Start New Exchange, Review Matches, Edit Profile) and key stats (active exchanges, pending matches, upcoming deadlines).

2. **Overview** (`/dashboard/overview`) — Summary of all exchange requests with status badges and timelines. Read-only status tracking.

3. **My Exchanges** (`/dashboard/exchanges`) — List of all exchange requests with edit/delete/draft actions. "New Request" button at top. Detail sub-page at `/dashboard/exchanges/:id`. New request wizard at `/dashboard/exchanges/new`.

4. **Matches** (`/dashboard/matches`) — All matched properties across requests. Filter/group by request. Match status badges. Click through to `/dashboard/matches/:id`.

5. **Settings** (`/dashboard/settings`) — Current Profile page moved here (profile editing + password change).

6. **Help** (`/dashboard/help`) — Static placeholder: FAQ, contact info, link to How It Works.

## Notifications — Bell Icon in Header
- Bell icon (`Bell` from lucide) in the top-right header bar, next to user avatar
- Popover on click showing recent notifications (or "No notifications yet" placeholder for now)
- Badge dot on bell when unread notifications exist (future)
- No dedicated page — notifications are an overlay

## Technical Changes

### 1. Create `src/components/layout/ClientSidebar.tsx`
- shadcn Sidebar with `collapsible="icon"`
- Nav items: Launchpad, Overview, My Exchanges, Matches (top group) and Settings, Help (bottom group)
- Icons: LayoutDashboard, BarChart3, ArrowLeftRight, Handshake, Settings, HelpCircle
- Active route highlighting via NavLink
- User name + sign out at bottom

### 2. Create `src/components/layout/ClientHeader.tsx`
- Horizontal header bar with SidebarTrigger on left
- Right side: Bell icon popover + user avatar/name
- Bell uses Popover component with placeholder notification list

### 3. Rewrite `src/components/layout/ClientLayout.tsx`
- Wrap with SidebarProvider
- Replace Navbar with ClientSidebar + ClientHeader
- Content area renders Outlet

### 4. Create new page files
- `src/pages/client/Launchpad.tsx`
- `src/pages/client/ExchangeList.tsx`
- `src/pages/client/ExchangeDetail.tsx`
- `src/pages/client/MatchList.tsx`
- `src/pages/client/Help.tsx`

### 5. Refactor existing files
- `src/pages/client/Dashboard.tsx` → becomes Overview
- `src/pages/client/Profile.tsx` → route moves to `/dashboard/settings`
- `src/pages/client/MatchDetail.tsx` → route moves to `/dashboard/matches/:id`

### 6. Update `src/App.tsx` routes
```
/dashboard              → Launchpad
/dashboard/overview     → Overview (refactored Dashboard)
/dashboard/exchanges    → ExchangeList
/dashboard/exchanges/new → NewRequest
/dashboard/exchanges/:id → ExchangeDetail
/dashboard/matches      → MatchList
/dashboard/matches/:id  → MatchDetail
/dashboard/settings     → Profile/Settings
/dashboard/help         → Help
```

### 7. Update `src/components/layout/Navbar.tsx`
- Remove client-specific links (Dashboard, Profile) — sidebar handles those now
- Keep public nav items and admin link

## What stays the same
- All admin pages untouched
- NewRequest form wizard content untouched (just re-routed)
- MatchDetail page content untouched (just re-routed)
- Profile/Settings page content untouched (just re-routed)
- No database changes, no RLS changes

