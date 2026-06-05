# Top-Nav + Cross-Client Dashboard Plan

Recomposition + nav container swap. No scoring, matching, or schema changes. Routes for `AgentMatchesHub` and `AgentExchanges` stay mounted in `App.tsx` (reachable by URL, deep links from cards) — just unlinked from primary nav.

---

## 1. Top nav replaces left sidebar

### New file: `src/components/layout/AgentTopNav.tsx`
Single horizontal bar, sticky, uses the existing `1031ExchangeUp` wordmark + amber "Agent" badge from `AgentSidebar`.

Structure (desktop, left → right):
- **Brand block**: wordmark + "Agent" chip → links to `/agent/dashboard`.
- **Primary nav** (react-router `NavLink`, active = underline + foreground):
  - Dashboard → `/agent/dashboard` (end)
  - My Clients → `/agent/clients`
  - *(Listings + Matches removed.)*
- **Right cluster**:
  - `Add Client` button (primary, `Plus` icon) → `/agent/clients/new`
  - Notifications bell (lift the entire `Popover` block already in `AgentHeader.tsx` verbatim — same `useNotifications`, unread badge, list).
  - **Profile dropdown** (new): shadcn `DropdownMenu`. Trigger = the existing 8×8 primary-tinted avatar circle with user initial. Items: Settings → `/agent/settings`, Help → `/agent/help`, separator, Sign Out (calls `signOut`).
    - If the agent's `launchpad_completed_at` is null, prepend a "Launchpad" item (replaces the current sidebar Launchpad entry — `useAgentLaunchpadProgress` already available).

### Mobile (`<md`)
- Brand on left, hamburger (`Menu` icon) on right replaces nav + right cluster.
- Tap → `Sheet` (shadcn) slides from the right containing: nav items, Add Client CTA, notifications link/list, Settings, Help, Sign Out. Closes on route change (`useLocation` effect, same pattern as `Navbar.tsx`).
- Notifications bell remains visible outside the sheet on mobile so unread state is glanceable; profile collapses into the sheet.

### Layout wiring: `src/components/layout/AgentLayout.tsx`
- Remove `SidebarProvider`, `AgentSidebar`, and `AgentHeader` imports/usage.
- Render `<AgentTopNav />` above `<main>`.
- `main` keeps `bg-[#F4F2EE]`, `overflow-y-auto`, and existing padding.
- `AgentSidebar.tsx` and `AgentHeader.tsx` files stay on disk (deleted from layout only) so we can resurrect or reference later; can remove in a follow-up if confirmed dead.

### Visual language
- Reuse existing tokens: `border-[#e4dcd0]`, `bg-white/80 backdrop-blur-md` (matches current `AgentHeader`), `text-muted-foreground` → `text-foreground` for active nav, `bg-primary/10 text-primary` for avatar, amber chip identical to sidebar's `bg-[#FADC6A]/25`.
- Sidebar badges (`useSidebarBadges`) no longer needed in primary nav since Matches is gone; an unread/pending count can surface on the bell via `useNotifications().unreadCount` (already does).

---

## 2. Dashboard as cross-client pulse

Edit `src/pages/agent/AgentDashboard.tsx`. Keep the file's existing header (welcome + suspended chip), the launchpad banner, `Needs your attention` card (unchanged), and the empty-onboarding CTA. Replace the Pipeline grid and quick-action buttons with the new sections below.

### 2a. Stat row (4 KPI cards at top)
New small component `DashboardStatCard` (local to the page or `src/features/agent/components/DashboardStatCard.tsx`). 4-col grid on `lg`, 2-col on mobile. Each card: label, big number, optional sublabel.

Computation — all from data already fetched, no new queries needed beyond what exists:
| Stat | Source | Calculation |
|---|---|---|
| Active clients | new lightweight query `agent_clients` count where `agent_id = userId` (single supabase call, add to a new `useAgentDashboardStats` hook OR derive from `useUnifiedRelationships` distinct clientIds + a clients count). Cleanest: a tiny `useAgentClientsCount` hook. | `count(*)` |
| Listings | `useAgentExchangesQuery` already returns the agent's exchanges | `exchanges.length` (or filter to non-closed) |
| Open matches | `useUnifiedRelationships` | rels where `stage` in `new`, `incoming`, `pending_in`, `pending_out`, `connected`, `conversing` |
| Deadlines ≤ 30 days | reuse `useAgentAttentionQuery` extended OR derive from `useAgentExchangesQuery` exchange rows (id, identification_deadline, closing_deadline) | count of exchanges whose nearest deadline is within 30 days |

Preference: extend existing hooks (`useAgentExchangesQuery` already pulls exchanges; deadlines can be derived client-side) + one new `useAgentClientsCount`. No new query plumbing for the others.

### 2b. Top matches across all clients
Section card "Top matches". Source: `useUnifiedRelationships()` (already cross-client for the agent). Sort: `score desc, lastActivityAt desc`. Take top 6.

Render: a list using the same look as `Needs your attention → Unreviewed matches` rows (already client-accented). Each row:
- Left: accent dot + `ClientLeadLine` (client name + relinquishedLabel) — reuses `src/features/matches/components/shared/ClientLeadLine.tsx` and `getClientAccent`.
- Middle: property name + city/state.
- Right: score pill + "Open" button → `/agent/clients/{clientId}?tab=matches&match={matchId}` (deep link into workspace Matches tab; see §3).

If we want a richer visual we can drop `PropertyMatchCard` directly (it already renders accent border, score, ClientLeadLine). Simpler row is recommended for dashboard density; reuse `PropertyMatchCard` only if user prefers card grid.

### 2c. Listings summary
Section card "Listings". Source: `useAgentExchangesQuery` (already used on `AgentExchanges` page). Show:
- Header row with total count and "View all" link → `/agent/exchanges` (still reachable, just not in nav).
- Compact list of up to 6 listings: thumbnail (use existing `propertyImage` helper / `resolvePropertyImageUrl`), client lead line w/ accent, city + asset type + asking price, link → `/agent/clients/{clientId}?tab=listings` (or `/agent/exchanges/{id}` for the listing detail — see §3 audit).

Reuses the listing row visual already established in `AgentExchanges.tsx` (extract to `src/features/exchanges/components/ListingRow.tsx` if reused in both, or keep inline copy for now).

### 2d. Keep
- `Needs your attention` Card — unchanged. Internal link "View all matches →" repointed to `/agent/clients` (since Matches nav is gone) OR keep deep `/agent/matches` (route still exists). Plan: repoint to `/agent/clients` and per-row "Review" link goes to `/agent/clients/{clientId}?tab=matches&match={matchId}`.
- Quick actions: Add Client + New Listing buttons kept in the dashboard header (Add Client also lives in the top nav; that's intentional — it's the primary CTA).

### 2e. Remove
- Pipeline 4-stage grid (information is implicit in the stat row + listings count).
- "View Matches" header button (Matches consolidated to client workspace).

---

## 3. Link audit & repointing

Goal: nothing dead-ends, every cross-client action funnels through the client workspace. Routes for `/agent/matches`, `/agent/matches/:id`, `/agent/exchanges`, `/agent/exchanges/:id` stay mounted.

| File | Current link | Change |
|---|---|---|
| `AgentDashboard.tsx` "View Matches" header button | `/agent/matches` | remove |
| `AgentDashboard.tsx` "View all matches →" in attention | `/agent/matches` | `/agent/clients` |
| `AgentDashboard.tsx` attention row "Review" | `/agent/matches/:matchId` | `/agent/clients/{clientId}?tab=matches&match={matchId}` (clientId available on row) |
| `AgentDashboard.tsx` "View all exchanges →" | `/agent/exchanges` | keep (route still exists; users land on full listings page) |
| `AgentSidebar.tsx` | entire file | unused after layout swap; leave on disk for now |
| `AgentHeader.tsx` | entire file | unused after layout swap; leave on disk for now |
| `agentLaunchpad.ts` content links | `/agent/matches`, `/agent/exchanges` | keep — both routes still resolve |
| `ClientWorkspaceHeader.tsx`, `ClientDealTab.tsx`, `ClientListingsTab.tsx` | already point inside workspace | no change |
| `PropertyReviewPanel.tsx` "View exchange" links | `/agent/exchanges/:id` | keep |
| `AgentMatchesHub`, `AgentMatchDetail`, `AgentExchanges`, `AgentExchangeDetail` | self-links | keep (pages still work for deep-link entry) |

`AgentClientWorkspace` should accept `?tab=matches&match={id}` and `?tab=listings` query params to support the dashboard deep links — small addition: on mount, set the Tabs `defaultValue` from `searchParams.get('tab')`, and pass the optional `match` id down to `ClientMatchesTab` to preselect the row in `InboxList`. Confirmed feasible (Tabs already shadcn-controllable).

---

## 4. Files touched

**New:**
- `src/components/layout/AgentTopNav.tsx`

**Edited:**
- `src/components/layout/AgentLayout.tsx` — swap sidebar for top nav.
- `src/pages/agent/AgentDashboard.tsx` — recompose sections; add stat row + top matches + listings summary; repoint links.
- `src/pages/agent/AgentClientWorkspace.tsx` — honor `?tab=` and optional `?match=` query params.

**Possibly new tiny hook:**
- `src/features/agent/hooks/useAgentClientsCount.ts` (single `count` query). Skippable if we derive from existing client list query.

**Unchanged but referenced:** `useUnifiedRelationships`, `useAgentExchangesQuery`, `useAgentAttentionQuery`, `useNotifications`, `useAgentLaunchpadProgress`, `getClientAccent`, `ClientLeadLine`, `PropertyMatchCard`, `Sheet`, `DropdownMenu`, `Popover`.

**Untouched / dead-but-kept:** `AgentSidebar.tsx`, `AgentHeader.tsx`, `useSidebarBadges` (still used by sidebar; can be removed if sidebar is later deleted).

---

## 5. Review checkpoints

1. **Top matches row style**: dense list rows (recommended, matches "Needs attention" pattern) vs. full `PropertyMatchCard` grid. Pick one.
2. **Active clients stat**: add `useAgentClientsCount` hook vs. derive from a clients list query already in use. Either is fine.
3. **Deep linking into workspace**: confirm OK to add `?tab=` and `?match=` query params to `/agent/clients/:clientId` so dashboard rows land inside the workspace context rather than the standalone `/agent/matches/:id` page.
4. **`AgentSidebar.tsx` / `AgentHeader.tsx` retention**: leave on disk (safe) or delete in this pass.
