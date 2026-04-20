

## Add Mock Data to Agent Dashboard

Seed the logged-in agent's account with realistic data so every dashboard widget, list, and detail page renders with content you can interact with.

### What you'll see after seeding

- **Pipeline stats** populated: active exchanges, in-identification, in-closing, and closed in last 30 days (with $ proceeds totals)
- **Attention panel** populated: urgent deadlines (≤14 days out), unreviewed matches, pending connection requests
- **Clients list** with 5 clients (mix of individuals and entities)
- **Exchanges list** with 6 exchanges across all statuses (draft → active → in_identification → in_closing → completed)
- **Pledged properties** (your listings) with photos, financials, addresses
- **Matches** between your buyer exchanges and other agents' pledged properties — some unreviewed, some viewed, with full scoring breakdown
- **Connections** in pending / accepted states, with messages
- **Notifications** unread in header bell
- **Launchpad** progress bar reflecting completed steps

### How it will work

A one-click **"Seed Mock Data"** button on the Agent Dashboard (dev-only, gated behind a confirmation dialog). Clicking it inserts data scoped to your `auth.uid()` so RLS policies allow it, and a sibling "Clear Mock Data" button removes only the rows tagged with a `mock_data` marker so your real data is untouched.

### Data plan

| Table | Rows | Notes |
|---|---|---|
| `agent_clients` | 5 | Mix: Sarah Chen, Marcus Rodriguez LLC, Patel Family Trust, James Wilson, Aurora Holdings |
| `pledged_properties` | 4 | Your listings — multifamily, retail, industrial, office across TX/FL/AZ/NC |
| `property_financials` | 4 | NOI, cap rate, occupancy, debt for each pledged property |
| `property_images` | 8 | 2 stock images per pledged property (Unsplash CDN URLs stored as `storage_path`) |
| `exchanges` | 6 | Statuses: 1 draft, 2 active, 1 in_identification (deadline in 9 days), 1 in_closing (deadline in 12 days), 1 completed (closed 8 days ago) |
| **Counter-party agent data** | — | Create 2 fake "other agent" profiles + their pledged properties so matches have real targets |
| `matches` | ~12 | Mix of buyer-side and seller-side; some `buyer_agent_viewed = false` for the attention panel |
| `exchange_connections` | 3 | 1 pending (initiated by other agent → shows in attention), 1 accepted, 1 in negotiation |
| `messages` | 6 | Conversation thread on the accepted connection |
| `notifications` | 5 | Unread mix: new match, connection request, deadline reminder, message |

### Technical implementation

1. **New file `src/features/dev/SeedMockDataPanel.tsx`** — Card component with two buttons (Seed / Clear) and a confirmation `AlertDialog`. Renders only in non-production builds (gated by `import.meta.env.DEV`).
2. **New file `src/features/dev/seedMockData.ts`** — Pure function `seedAgentMockData(userId)` that performs all inserts in order (clients → properties → financials → images → exchanges → matches → connections → messages → notifications). Each row tagged with `notes` or `metadata` containing `"__mock__"` so cleanup can find them.
3. **New file `src/features/dev/clearMockData.ts`** — Deletes mock rows in reverse FK order, scoped to `agent_id = userId` AND mock-tag match.
4. **Counter-party agents**: Created via an Edge Function `seed-counterparty-agents` that uses the service role to insert two fake `auth.users` + `profiles` rows (needed because client SDK can't create auth users). Idempotent — checks for existing mock counter-parties first.
5. **Mount the panel** in `src/pages/agent/AgentDashboard.tsx` at the bottom (replacing where the old `SeedDemoDataButton` used to live).
6. **Refetch queries** after seed/clear via `queryClient.invalidateQueries({ queryKey: ["agent-..."] })` so the dashboard updates instantly.

### Constraints respected

- All inserts go through the existing client SDK → RLS policies enforce `agent_id = auth.uid()`
- Counter-party auth user creation uses Edge Function with service role (only safe place for that)
- Mock data is clearly marked and reversible
- Dev-only UI — won't ship to production users

### Out of scope

- Match results from the matching engine (`run-matching` function) — we insert pre-scored `matches` rows directly so you don't have to wait for a job
- DST properties, admin tables, automation worker data — agent dashboard doesn't surface these

