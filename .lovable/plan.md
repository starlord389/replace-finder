

# Phase 3: Connections + Exchange Tracking

## Overview
Replace the "Start Exchange" toast in AgentMatchDetail with a real connection flow. Build the connections list page and connection detail page with messaging, progress tracking, and agent identity reveal on acceptance.

## Files to Create

### 1. `src/pages/agent/AgentConnectionDetail.tsx` (~500 lines)

Route: `/agent/connections/:id`

**Data loading:** Fetch connection by ID, verify current user is buyer or seller agent. Fetch match, both properties + financials, both agent profiles, client name, and messages.

**Sections:**
- **Header:** Connection status badge, match score, boot status
- **Agent contact cards** (only if status = accepted/completed): name, brokerage, email, phone for both agents
- **Two-property summary:** Side-by-side cards (buyer relinquished vs seller property) with key metrics
- **Progress tracker:** 6-step horizontal stepper (Requested → Accepted → Under Contract → Inspection → Financing → Closed). Each step checks the corresponding `_at` timestamp.
- **"Update Progress" button:** Opens dialog with date picker for the next unset milestone. Updates connection row + inserts notification + timeline entry for both exchanges.
- **Special actions:** "Mark as Closed" (sets `closed_at`, `status=completed`, `facilitation_fee_status=invoiced`), "Mark as Failed" (sets `failed_at`, `failure_reason`, `status=cancelled`), "Cancel Connection" (for pending/accepted).
- **Messaging section:** Fetches `messages` where `connection_id = this ID`, sorted ascending. Textarea + Send button inserts new message. Show sender name + timestamp. Basic refresh — no realtime for now.

### 2. Rewrite `src/pages/agent/AgentConnections.tsx` (~400 lines)

**Three tabs:** Pending, Active, Closed

**Data loading:** Fetch all `exchange_connections` where `buyer_agent_id = user OR seller_agent_id = user`. For each, batch-fetch match, seller property, buyer exchange + client name, and both agent profiles (profiles revealed only for accepted/completed).

**Pending tab:**
- Incoming requests (user is seller_agent, status=pending): Show property summary + "Accept"/"Decline" buttons
- Outgoing requests (user is buyer_agent, status=pending): Show "Awaiting Response"
- Accept: update status=accepted, accepted_at=now, insert notification for buyer agent, insert timeline entries
- Decline: small dialog with optional reason textarea, update status=declined, declined_at=now, insert notification

**Active tab:** Cards with both agent names (revealed), both properties, match score, progress status, "View" → `/agent/connections/:id`

**Closed tab:** Completed/declined/cancelled with dates and reasons

### 3. Modify `src/pages/agent/AgentMatchDetail.tsx`

Replace the "Start Exchange" toast button with connection-aware logic:

**On mount**, check `exchange_connections` where `match_id = this match AND (buyer_agent_id = user OR seller_agent_id = user)`:
- No connection → show "Start Exchange" button → opens modal
- Pending → show "Request Sent — Awaiting Response" (disabled)
- Accepted → show "Connected — View Connection" → navigate to `/agent/connections/:connectionId`
- Declined → show "Request Declined" + "Request Again" option

**Start Exchange modal (Dialog):**
- Summary text with property name, city/state
- Match score + boot status badges
- Required checkbox: facilitation fee acknowledgment
- Optional textarea: message to other agent
- "Send Request" button (disabled until checkbox checked)

**On submit:**
1. Fetch seller property's `agent_id` and `exchange_id` from `pledged_properties`
2. Insert `exchange_connections` row (match_id, buyer/seller exchange/agent IDs, status=pending, facilitation_fee_agreed=true, initiated_by='buyer_agent')
3. Insert notification for seller agent (type=connection_request)
4. Insert exchange_timeline entry for buyer's exchange
5. Toast success, update button state

### 4. Modify `src/App.tsx`

Add route:
```tsx
import AgentConnectionDetail from "@/pages/agent/AgentConnectionDetail";
<Route path="/agent/connections/:id" element={<AgentConnectionDetail />} />
```

### 5. Modify `src/pages/agent/AgentDashboard.tsx`

Make "Pending Connections" KPI card clickable → navigates to `/agent/connections`.

## No Database Changes
All tables exist: `exchange_connections`, `messages`, `notifications`, `exchange_timeline`. RLS policies already allow agents to create/read/update connections, send messages, and insert notifications/timeline.

## Technical Notes
- Connection state in AgentMatchDetail is fetched once on mount and stored in local state; button updates optimistically after submit
- Messages section uses basic fetch + insert, no Supabase realtime subscription
- Agent profiles fetched via `profiles` table using buyer_agent_id / seller_agent_id
- Progress tracker milestone updates: each sets the `_at` field and notifies the other agent
- "Mark as Closed" also updates both exchanges to `status = 'completed'` via two separate update calls (RLS allows agents to update own exchanges)

## What NOT to Change
- Matching engine
- Admin pages
- Client pages
- Database schema

