

# Platform deep-dive: feature audit & proposed changes

I walked through the agent dashboard, sidebar, and every primary page (Dashboard, Clients, Exchanges, Matches, Connections, Messages, Settings, Help, Launchpad), plus the shared header and the underlying tables. Here's what's working, what's broken, and what I recommend we add, remove, or combine.

## What's working well

- **Dashboard "Needs your attention"** — strong, real, deadline-driven hub
- **Exchange wizard + edit flow** (just built) — full lifecycle support
- **Matches** — 6-dimension scoring, boot calculation, filters
- **Connections** — pending → accepted → progress steps, identity reveal on accept
- **Messages inbox** — two-pane, mark-read, real-time-friendly
- **Help Center** — tabs, FAQs, docs, ticket submission
- **Launchpad** — new-agent onboarding gate

## Issues I found (worth fixing)

| # | Problem | Where | Severity |
|---|---|---|---|
| 1 | **Notification bell is fake** — hardcoded "No notifications" even though we write to the `notifications` table on connection accept/decline, new matches, etc. | `AgentHeader.tsx` | High — silently breaks UX feedback loop |
| 2 | **No unread badge** on sidebar Messages or Connections items | `AgentSidebar.tsx` | Medium — users miss new activity |
| 3 | **No global search** — can't jump to a client/exchange/property from anywhere | Header | Medium |
| 4 | **Dev seed panel ships in dashboard** for everyone | `AgentDashboard.tsx` line 417 | Low (cleanup) |
| 5 | **Seller-side matches are second-class** — text-only cards, no photo, no link to the buyer's exchange details, no way to mark interest | `AgentMatches.tsx` | Medium |
| 6 | **My Clients page** has no filters (active/inactive), no sort, no "exchanges in progress" status pill | `AgentClients.tsx` | Low |
| 7 | **Settings page is shallow** — only profile fields. No notification preferences, no password change, no email/security, no danger zone (delete account), no data export | `AgentSettings.tsx` | Medium |
| 8 | **Pledged Properties have no dedicated page** — they exist only as an attribute of an exchange, so an agent can't browse "all my listings", mark off-market, or reuse a property | None (gap) | Medium |
| 9 | **No analytics/insights view** — agent can't see win rate, avg days to close, top markets, response times | None (gap) | Low–Medium |
| 10 | **Closed connections don't roll up into client history** — when a deal closes, there's no aggregated "deal history" on the client page | `AgentClientDetail.tsx` | Low |

## Proposed changes

### A. Fix (must-do)

1. **Live notification bell** — read from `notifications` table in `AgentHeader`, show unread count, mark-as-read on click, group by type (match / connection / message / system). Realtime subscribe to inserts.
2. **Sidebar unread badges** — small count pills on Messages (unread message count) and Connections (pending incoming requests count). Reuse existing queries.
3. **Hide dev seed panel** behind `import.meta.env.DEV` so it doesn't render in production.

### B. Add (nice-to-have, high value)

4. **Global ⌘K command palette in the header** — search clients, exchanges, pledged properties, matches; jump to settings/help; quick "New exchange / Add client" actions.
5. **Pledged Properties section** — new sidebar item under Exchange Network. Lists every property the agent has pledged across exchanges, status (draft / active / under contract / off-market / withdrawn), photo, price, with quick actions (edit, mark off-market, withdraw, view matches). This consolidates a real concept that's currently buried.
6. **Settings expansion** — add tabs: Profile · Notifications (email/in-app toggles per event type) · Security (change password, sign out other sessions) · Account (export my data, delete account). Notification prefs persist to a new `user_notification_preferences` table.
7. **Insights tab on Dashboard** — small KPI strip: avg match score, response time, deals closed YTD, total facilitation fees earned, top 3 markets. Pulled from existing tables, no new schema.
8. **Closed deals on client detail** — pull `exchange_connections` where `status='completed'` for that client, show a "Deal history" card with sale price, close date, counterparty agent.

### C. Combine / restructure

9. **Merge "Connections" pending tab content into Messages inbox** as a "Requests" filter — keeps the Connections page for active/closed pipeline tracking but surfaces incoming requests in the place users already check daily (Messages). Pending count moves into the unread badge.
10. **Move Launchpad** out of the main sidebar once completed — currently it stays forever even after finishing. Auto-hide when `launchpad_completed_at` is set, or show as a compact "Setup ✓" footer link.

### D. Remove / simplify

11. **Drop the dev seed panel from `AgentDashboard`** in production (also fix #3).
12. **Strip "Tools" sidebar group** — it only contains Messages. Move Messages into the Exchange Network group above Connections to reduce visual noise.

## Suggested build order (if approved)

| Phase | Work | Effort |
|---|---|---|
| 1. Critical fixes | Live notifications bell + sidebar unread badges + hide dev panel + sidebar regrouping | Small |
| 2. Pledged Properties section | New page + sidebar item + actions | Medium |
| 3. Settings expansion | Notification prefs table + tabs + password change + export/delete | Medium |
| 4. Global ⌘K search | Header palette wired across 4 entity types | Medium |
| 5. Insights & client deal history | KPI strip on dashboard + deals card on client detail | Small |
| 6. Connections ↔ Messages merge | "Requests" filter in inbox, hide pending tab on Connections | Small |

## Out of scope (intentionally)

- Threaded ticket replies (already noted in Help Center plan)
- Email notifications (would need outbox + edge function)
- Mobile-native push
- Calendar integration for deadlines
- Document collaboration / e-sign

## Questions for you before I build

- Do you want to tackle **all 6 phases**, or pick a subset? (Phase 1 is the highest-leverage and I'd recommend doing it regardless.)
- For **notification preferences** (Phase 3), do you want **email + in-app**, or **in-app only** for now?
- For **Pledged Properties** (Phase 2): should it allow creating a property *without* attaching it to an exchange yet (a true inventory listing), or stay tied to exchanges?

