
# Redesign Matched Property Detail (Zillow-style listing view)

## Goal

Transform `PropertyReviewPanel` — the right-side detail view on `/agent/matches` and inside a client's match view — from an agent-workflow control panel into a clean **marketing listing page** that mirrors the UX of the multifamilyproperties.com / Zillow reference screenshots.

Branding stays exactly as-is (Inter, blue-600 accent, white surfaces, current tokens). Only **layout, hierarchy, and density** change.

## What the new listing view looks like

```text
┌───────────────────────────────────────────────────────────────────┐
│  CLIENT STRIP  (kept — "For: Sarah Chen · Trading out of …")      │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│              LARGE HERO IMAGE (h-[420px], full bleed)             │
│   [Off-Market] [Investment Property]              [View all 40 ▸] │
│   Property Name                                                   │
│   City, State                                                     │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│  ▢ ▢ ▢ ▢ ▢ ▢ ▢ +32   ← photo thumbnail strip                     │
├───────────────────────────────────────────────────────────────────┤
│  📐 Building  📍 Lot  📅 Built  🏢 Units  🏠 Resi  🏬 Commercial  │
│  ← horizontal facts bar, light grey, single row                   │
├───────────────────────────────────────────────────────────────────┤
│  [ Overview ] [ Financials ] [ Location ] [ Match ] [ Docs ]      │
│  ← sticky tab bar                                                 │
├──────────────────────────────────────────┬────────────────────────┤
│                                          │  ┌──────────────────┐  │
│   Tab content (Overview shown):          │  │  Asking Price    │  │
│                                          │  │  $2,790,000      │  │
│   "Executive Summary" eyebrow pill       │  │  ──────────────  │  │
│   # Property Overview                    │  │  6.80% │ $191K   │  │
│   Long-form description paragraph…       │  │  Cap   │ NOI     │  │
│                                          │  │  10    │ 100%    │  │
│   ── Property Details ──   ── Recent ──  │  │  Units │ Occ.    │  │
│   grid of fact cards       capital impr. │  │  ──────────────  │  │
│                                          │  │  Score 87 ●●●●○  │  │
│   ── Unit Mix ──                         │  │  Why matched ▸   │  │
│   chips: 7 Residential / 3 Commercial    │  │  ──────────────  │  │
│                                          │  │  Listed by       │  │
│                                          │  │  [agent avatar]  │  │
│                                          │  │  Name · Firm     │  │
│                                          │  │  ✉ Email │ ☎ Call│  │
│                                          │  └──────────────────┘  │
│                                          │  (sticky, top-24)      │
└──────────────────────────────────────────┴────────────────────────┘
```

### Tabs

- **Overview** — executive summary paragraph, property details fact grid (Building Size / Lot / Year Built / Total Units), Unit Mix chips, Recent Capital Improvements checklist, Highlights / Why-this-matched narrative.
- **Financials** — Gross Income / Expenses / NOI / Cap Rate hero cards (4-up), Operating Expenses table, Commercial Units rent roll table, full financial grid (all metrics from `financialMetrics`).
- **Location** — "Prime Downtown Location" heading + subhead, large map placeholder with address card, nearby amenities placeholder.
- **Match** — Match score callout, "Why this matched" bullets, weighted breakdown chart (`MatchBreakdownChart`), rank explanation. This is the **only** place match-specific data lives in the listing view.
- **Docs** — Property documents list (OM PDF, OM Word, T-12, Rent Roll) styled like the reference: icon tile + title + format badge + gated badge + Download button.

### Sticky right rail (sidebar card)

- Asking Price (large), cap-rate sub-line
- 2x2 KPI grid: Cap Rate / NOI / Units / Occupancy
- Match score chip + "Why matched →" link that switches to the Match tab
- Listed-by block: counterparty agent avatar, name, firm, Email / Call buttons (uses `AgentCommsCard` data, but compact)
- "Schedule Showing" and "Request Offering Memo" buttons → these route to the workflow drawer (see below), not inline

## Where the agent workflow goes

All agent-only controls currently jammed into `PropertyReviewPanel` move **off the listing card** entirely:

- Action Center (primary CTA + secondary chips + destructive)
- Lifecycle tracker
- Share-with-client controls (Send / Copy link / Download one-pager / Internal note)
- Agent ↔ counterparty conversation
- Activity timeline

These move into a **slide-out workflow drawer** anchored to the listing, opened by a single floating control:

```text
┌─────────────────── Listing view ───────────────────┐  ┌─ Drawer ─┐
│                                                    │  │ Workflow │
│   …marketing content…                              │  │ for this │
│                                                    │  │ match    │
│                                                    │  │          │
│                                                    │  │ Status   │
│                                                    │  │ Action   │
│                              ┌──────────────────┐  │  │ Center   │
│                              │ Manage match  ⇆  │  │  │ Lifecycle│
│                              └──────────────────┘  │  │ Share    │
│                                                    │  │ Notes    │
│                                                    │  │ Convo    │
│                                                    │  │ Activity │
└────────────────────────────────────────────────────┘  └──────────┘
```

- Single floating "Manage match" button bottom-right of the listing scroll area (shadcn `Sheet`, side="right", width ~480px).
- Drawer contents are the existing components extracted as-is: `ActionCenter`, `LifecycleTracker`, share section, `AgentCommsCard`, activity timeline.
- Drawer is also reachable from the inbox list (small "Manage" affordance on the selected match) so power users skip the listing scroll.

This keeps the marketing card clean while preserving every existing capability — nothing is removed, only relocated.

## Files to touch

| File | Change |
|---|---|
| `src/features/matches/components/inbox/PropertyReviewPanel.tsx` | Rewrite as marketing layout (hero, thumbnails, facts bar, tabs, sticky sidebar). Remove inline ActionCenter / Lifecycle / Share / Convo / Activity sections. Mount the workflow drawer trigger. |
| `src/features/matches/components/inbox/ListingHero.tsx` *(new)* | Hero image, badges, title, photo thumbnail strip, "View all N photos" button. |
| `src/features/matches/components/inbox/ListingFactsBar.tsx` *(new)* | Single-row horizontal icon facts strip. |
| `src/features/matches/components/inbox/ListingSidebar.tsx` *(new)* | Sticky right-rail price/KPI/listed-by card. |
| `src/features/matches/components/inbox/tabs/OverviewTab.tsx` *(new)* | Executive summary, Property Details, Unit Mix, Capital Improvements. |
| `src/features/matches/components/inbox/tabs/FinancialsTab.tsx` *(new)* | 4-up KPI hero, expenses table, rent roll, full metric grid. |
| `src/features/matches/components/inbox/tabs/LocationTab.tsx` *(new)* | Heading + map placeholder + address card. |
| `src/features/matches/components/inbox/tabs/MatchTab.tsx` *(new)* | Score callout, Why matched, breakdown chart, rank explanation. |
| `src/features/matches/components/inbox/tabs/DocsTab.tsx` *(new)* | Document list styled like reference. |
| `src/features/matches/components/inbox/MatchWorkflowDrawer.tsx` *(new)* | `Sheet`-based drawer wrapping ActionCenter + Lifecycle + Share + AgentCommsCard + Activity. |
| `src/features/matches/components/inbox/propertyImage.ts` | Add a `propertyImages(rel, count)` helper to deterministically generate the thumbnail strip from the single hero image (until real galleries exist). |

`InboxList`, `AgentMatches`, `AgentWorkspace` consumers of `PropertyReviewPanel` need **no API changes** — same props (`rel`, `rank`, `totalInScope`).

## Technical notes

- Use existing semantic tokens only (`bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `bg-primary`). No new colors.
- Tabs: shadcn `Tabs` component, default to `overview`. Tab bar sticky under the facts bar (`sticky top-0 z-10 bg-card/95 backdrop-blur`).
- Sidebar: `sticky top-6 self-start` inside a `lg:grid lg:grid-cols-[1fr_360px] lg:gap-8` layout. Collapses below the content on `<lg`.
- Thumbnails are deterministic placeholders driven by `propertyImage(...)` with seed variants; clicking a thumb swaps the hero (local state).
- "View all N photos" opens a shadcn `Dialog` with a simple grid (placeholder for now; data hookup later).
- Drawer state lives in `PropertyReviewPanel`; opened via floating button + via an optional `?manage=1` query param so deep links keep working.
- Existing helpers (`financialMetrics`, `matchBreakdown`, `rankExplanation`, `UI_STATUS_*`, `useMatchActions`, `useMatchLocalState`) are reused untouched.
- All current functionality (send to client, copy link, download one-pager, internal note, status transitions, agent comms) is preserved — only its location changes.

## Out of scope

- Real photo galleries / MLS-style media (placeholder thumbnails for now).
- Real map tiles (static map placeholder card).
- Changes to inbox list, sorting, filters, or any other page.
- Branding/colors/typography changes.
