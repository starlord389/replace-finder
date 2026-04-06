

# Phase 2A: Agent Sidebar, Dashboard, and Client Management

## Overview
Create the agent layout (sidebar + header), dashboard home with KPIs, client list/detail pages, placeholder pages for future routes, and update login routing.

## Files to Create (14 files)

### Layout (3 files)

**`src/components/layout/AgentLayout.tsx`**
Same pattern as AdminLayout. Auth guard: redirect to `/login` if not authenticated, redirect to `/dashboard` if `profileRole !== 'agent'`. SidebarProvider + AgentSidebar + AgentHeader + Outlet.

**`src/components/layout/AgentSidebar.tsx`**
Same pattern as AdminSidebar. Three nav groups:
- "Exchange Network": Dashboard (/agent, exact), My Clients (/agent/clients), Exchanges (/agent/exchanges), Matches (/agent/matches), Connections (/agent/connections)
- "Tools": Identification Lists (/agent/identifications), Messages (/agent/messages)
- "Account": Settings (/agent/settings), Help (/agent/help)

Logo: "1031ExchangeUp" + blue "Agent" badge. Footer: profileName, brokerage (from profile query), verification badge (green verified / amber pending), Sign Out.

**`src/components/layout/AgentHeader.tsx`**
Copy of ClientHeader — SidebarTrigger left, bell placeholder + avatar right.

### Core Pages (3 files)

**`src/pages/agent/AgentDashboard.tsx`** (~250 lines)
- Welcome header with profileName + brokerage + verification banner if pending
- 4 KPI cards: Active Clients (agent_clients count), Active Exchanges (exchanges count), Total Matches (matches count via exchanges), Pending Connections (exchange_connections count) — all using `select("id", { count: "exact", head: true })`
- Deadline alerts: query exchanges with identification/closing deadlines, color-coded by urgency
- Quick actions: Add Client, New Exchange, View Matches
- Getting started card if 0 clients

**`src/pages/agent/AgentClients.tsx`** (~200 lines)
- Header with count + "Add Client" button
- Search input filtering by name/email/company
- Client cards showing name, email, phone, company, exchange count, status badge, platform referral badge
- Empty state if no clients
- Click → /agent/clients/:id

**`src/pages/agent/AgentClientDetail.tsx`** (~300 lines)
- New mode (/agent/clients/new): form with name, email, phone, company, notes → insert into agent_clients
- Edit mode (/agent/clients/:id): load + pre-populate form → update agent_clients
- Edit mode extras: exchanges list for this client, "Invite to Platform" placeholder button, "Deactivate Client" with confirmation dialog

### Placeholder Pages (7 files)

Simple pages in `src/pages/agent/` with heading + description + "coming soon":
- `AgentExchanges.tsx`, `AgentMatches.tsx`, `AgentConnections.tsx`, `AgentIdentifications.tsx`, `AgentMessages.tsx`
- `AgentSettings.tsx` — minimal settings page: load profile, edit name/email/phone/brokerage fields, save
- `AgentHelp.tsx` — basic help/FAQ page

## Files to Modify (2 files)

**`src/App.tsx`**
Add AgentLayout route group with all 10 agent routes (/agent, /agent/clients, /agent/clients/new, /agent/clients/:id, /agent/exchanges, /agent/matches, /agent/connections, /agent/identifications, /agent/messages, /agent/settings, /agent/help).

**`src/pages/auth/Login.tsx`**
Line 34: add `if (profile?.role === "agent") target = "/agent";` before the admin check.

## Technical Notes
- KPI queries use `{ count: "exact", head: true }` for efficient counting
- Agent brokerage name for sidebar/dashboard fetched via profile query in AgentDashboard (useAuth already has profileName)
- Deadline calculations done client-side: `differenceInDays(deadline, today)`
- No database changes needed — all tables exist from Phase 1A/1B
- AgentSettings is a standalone minimal page (not reusing Profile component to avoid layout coupling)

