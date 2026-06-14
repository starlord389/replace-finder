## Goal

Make `/agent/dashboard` a useful "cockpit": action-first, sharper KPIs, and pipeline at a glance — laid out as two columns on desktop. Keep all current sections; refresh and reorganize them.

## New layout

```text
[ Header + quick actions ]
[ Alert banners (suspended / launchpad) — unchanged ]

Desktop (lg+): two columns
┌─────────────────────────────┬──────────────────┐
│ Today (action-first hero)   │ KPIs (2x2)       │
│ Needs your attention        │ Pipeline funnel  │
│ Top matches                 │ Deadlines · 30d  │
│ Listings                    │                  │
└─────────────────────────────┴──────────────────┘

Mobile: single column, same order top-to-bottom.
```

## New "Today" hero

Replaces nothing — sits above "Needs your attention". Picks up to 3 highest-priority items from data already loaded by `useAgentAttentionQuery`:
1. Most urgent deadline (lowest `daysRemaining`).
2. Highest-score unreviewed match.
3. Oldest pending incoming connection.

Renders as a single bordered card with a left accent bar, headline "What to do first", and up to 3 row items. Each row: priority dot (red/amber/blue), one-line summary, primary action button linking to the same target as today's "Needs attention" list. If nothing qualifies, show a compact "You're caught up" state and skip rendering. No new data fetching.

## Sharper KPIs

Replace `StatCard` content (right column on desktop, 2x2 grid):
- **Active clients** — value = `clientCount`. Sublabel: "X with active listing" (count of distinct `client_id`s across `exchanges` with `status === 'active'`).
- **Listings** — value = active listings count. Sublabel: "Y drafts" (status not active). Drafts = `exchanges.length - active`.
- **Open matches** — value = `openMatchCount`. Sublabel: "Z new this week" (relationships where `stage === 'new'` and `createdAt` within 7 days, using `lastActivityAt` as proxy if no createdAt).
- **Deadlines · 30d** — value = total. Sublabel: "A ID · B closing" split.

All derivations from data already on the page — no new queries.

## Pipeline-at-a-glance

New card under KPIs in the right rail: horizontal mini funnel.

Stages and groupings (using existing `RelationshipStage`):
- New → `new` + `incoming`
- Conversing → `connected` + `conversing` + `pending_in` + `pending_out`
- LOI → (none yet in data; show 0)
- Under contract → (none yet; show 0)
- Closed → `closed_won`

```text
[12]   [4]    [0]    [0]    [3]
 New  Conv.  LOI    UC    Closed
```

Each segment is clickable and links to `/agent/pipeline` (no query param needed for v1). Counts use the already-loaded `relationships`. Card title: "Pipeline" with a "View pipeline →" link.

## Files

`src/pages/agent/AgentDashboard.tsx`
- Add `TodayPanel` component (defined in-file) that takes `attention` and returns up to 3 priority items.
- Add `PipelineFunnel` component (in-file) computing counts from `relationships`.
- Add KPI sublabel computations (active listings, drafts, new-this-week, ID vs closing).
- Wrap main content in a `lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6` layout. Left column: Today, Needs attention, Top matches, Listings. Right rail: KPIs (2x2), Pipeline funnel, Deadlines mini-list (next 5 from existing `attention.urgentDeadlines` + upcoming from exchanges within 30d, capped at 5).
- Keep "Top matches", "Listings", and empty-onboarding sections as-is (light style polish only).
- Remove the standalone full-width stat row in favor of the right-rail version.
- Keep `SeedMockDataPanel` at the very bottom in dev.

No other files, no new hooks, no schema changes, no design token changes (uses existing semantic tokens).

## Out of scope

- No new queries or DB fields.
- No new routes or filters in `/agent/pipeline`.
- No mobile-specific redesign beyond the existing single-column stack.
- LOI / Under-contract counts remain 0 until those stages exist in data.