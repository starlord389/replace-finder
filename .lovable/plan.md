

# Redesign Overview as CRM-Style Dashboard

## What
Transform the plain list-of-requests Overview into a proper CRM dashboard with summary stat cards at the top, deadline alerts, and a cleaner request table — giving users an at-a-glance view of their exchange portfolio.

## Layout

```text
┌──────────────────────────────────────────────────────────┐
│  Overview                                                │
│  Your exchange portfolio at a glance.                    │
│                                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐│
│  │ Active     │ │ Total      │ │ Matches    │ │ Next   ││
│  │ Exchanges  │ │ Proceeds   │ │ Received   │ │Deadline││
│  │    2       │ │  $1.2M     │ │    5       │ │ 12 days││
│  └────────────┘ └────────────┘ └────────────┘ └────────┘│
│                                                          │
│  ┌─ Upcoming Deadlines ─────────────────────────────────┐│
│  │ ⚠ Austin, TX — ID Deadline in 8 days (Apr 7)        ││
│  │ 🕐 Denver, CO — Close Deadline in 34 days (Apr 30)  ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ My Exchanges ───────────────────────────────────────┐│
│  │ Property    │ Status  │ Value    │ Proceeds │ Date   ││
│  │ Austin, TX  │ Active  │ $800K   │ $750K    │ 03/15  ││
│  │ Denver, CO  │ Review  │ $450K   │ $420K    │ 03/10  ││
│  │                          [View →]                    ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─ Recent Activity ────────────────────────────────────┐│
│  │ • Austin, TX moved to Active — Mar 20               ││
│  │ • Denver, CO submitted — Mar 10                      ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

## Sections

1. **KPI Cards** (top row, 4 cards) — Active exchanges count, total exchange proceeds sum, matches received count (from `matched_property_access`), days until nearest deadline
2. **Upcoming Deadlines** — Alert-style cards for any ID or close deadlines within next 60 days, sorted soonest first. Color-coded: red if ≤14 days, yellow if ≤30, neutral otherwise
3. **My Exchanges Table** — Clean table with columns: Property (city/state), Status badge, Asset Type, Est. Value, Proceeds, Date. Each row links to `/dashboard/exchanges/:id`
4. **Recent Activity** — Last 10 status history entries across all requests, shown as a simple timeline list

## Technical Changes

### 1. Rewrite `src/pages/client/Overview.tsx`
- Fetch `exchange_requests`, `exchange_request_status_history`, and `matched_property_access` count
- Compute KPI values from fetched data
- Render 4 sections using Card components
- Use Table component for exchanges list
- Link rows to exchange detail page
- Uses existing shadcn Card, Table, Badge, and Progress components — no new dependencies

### No other files change
- No database changes, no new components, no routing changes

