## Full app audit + rebuild plan

You bought a house your brother framed but didn't finish — the bones are there, but half the rooms are sealed off, two kitchens were built, and some load-bearing walls aren't where the floor plan says. Here's what's actually going on and how I'd straighten it out.

---

## Part 1 — What I found (the audit)

### 1. There are two products fighting inside this codebase

The DB has **two parallel schemas** for the same domain:

| Legacy (client-facing) | Current (agent-facing) |
|---|---|
| `exchange_requests` | `exchanges` |
| `exchange_request_preferences` | (lives on `exchanges.criteria_id`) |
| `inventory_properties` | `pledged_properties` |
| `inventory_financials` | `property_financials` |
| `inventory_images` | `property_images` |
| `match_runs` + `match_results` | `matches` |
| `matched_property_access` | (direct via agent FK) |

The whole `src/pages/client/*` folder (10 files, ~3,000 lines) still queries the legacy tables — but `App.tsx` redirects every `/dashboard/*` route to `/unavailable`. So the code runs nothing, the tables hold nothing, but they're still in your bundle, types, and migrations. The product memory even says "private 1031 matching platform — NOT a public marketplace" and "no AI matching" — but the legacy schema was built for a self-serve client portal that no longer exists.

### 2. Most admin pages are orphaned

`src/pages/admin/` has 9 files. `App.tsx` only wires 2 of them (`AdminDashboard`, `SupportTickets`). `ClientList`, `InventoryList`, `InventoryDetail`, `MatchReview`, `MatchRunDetail`, `RequestQueue`, `RequestDetail` — all written, none reachable. Admin sidebar only lists "Support". You have no real admin tooling even though the code partially exists.

### 3. Dead tables

- `dst_properties` — table exists with RLS, zero UI references
- `exchange_request_status_history` — orphaned with the legacy schema
- `admin_notes` — orphaned

### 4. Auth & roles are duplicated

`profiles.role` AND `user_roles.role` both exist. The project memory explicitly says **"Roles MUST be stored in a separate table"** for security, but `useAuth.tsx` reads from `profiles.role` and that's what every route guard uses. The `user_roles` table is set up correctly but bypassed. This is the privilege-escalation pattern the memory warns against.

### 5. Bloated files

- `src/pages/Index.tsx` — **4,854 lines** (the marketing landing)
- `AgentMatchDetail.tsx` — 1,206 lines
- `client/MatchDetail.tsx` — 1,045 lines (dead code)
- `admin/RequestDetail.tsx` — 610 lines (dead code)

The landing page alone is 15% of the entire codebase. It's almost certainly one giant component instead of composed sections.

### 6. Workflow gaps in the live agent app

Walking the agent journey, the things that don't fully connect:

- **Match → Connection**: "Request connection" exists, but the kanban (pending → accepted → under contract → financing → closed) isn't surfaced; stage timestamps exist in the table but no UI moves them
- **Connection → Messages**: connections have message threads but the link between "I just accepted this" and "open the thread" is weak
- **Exchange → Identification list**: `identification_list` table exists, no UI to manage it
- **Exchange → Timeline**: `exchange_timeline` table exists with events, no page renders it
- **Notifications**: in-app bell exists, `link_to` field exists, but many notification rows have no link or land on the wrong route
- **Sidebar badges vs page counts**: driven by different queries — they drift
- **Empty states**: most list pages show blank cards instead of "Add your first X" CTAs
- **Mobile**: header, sidebar, wizards, tables — none audited for phone width

### 7. Edge functions

Five functions deployed: `automation-worker`, `create-exchange`, `update-exchange`, `run-matching`, `run-auto-matching`, `seed-counterparty-agents`. No central observability — failures only surface as a missing match list with no error toast.

### 8. Migrations are a graveyard

54 migrations, including one literally named `agent_self_cert_signup` (the concept you just asked me to remove from the UI). The DB still carries fields and defaults from abandoned product directions.

### 9. Design is inconsistent

- Hardcoded hex (`#F4F2EE`, `#FADC6A`, `#2563EB`) sprinkled across layout files instead of semantic tokens
- Memory says "Apple/Linear inspired, premium minimal" — reality is closer to standard shadcn defaults with a few one-off colors
- No consistent loading skeleton, error state, or empty state pattern
- Two different sidebars (agent vs admin) with different conventions

---

## Part 2 — The rebuild plan

Six rounds. Each round is one approval + one execution loop. You can stop, reorder, or skip any round.

### Round 1 — Demolition (delete the dead product)

No new features. Just remove what isn't used so we can see what we have:

- Delete `src/pages/client/*` (10 files) and the `/dashboard/*` redirect
- Delete orphaned admin pages we won't revive (`MatchReview`, `MatchRunDetail`, `RequestQueue`, `RequestDetail`, `InventoryList`, `InventoryDetail`, `ClientList` — or mark which to keep)
- Migration to drop unused tables: `exchange_requests`, `exchange_request_preferences`, `exchange_request_status_history`, `inventory_properties`, `inventory_financials`, `inventory_images`, `inventory_source_metadata`, `match_results`, `match_runs`, `matched_property_access`, `dst_properties`, `admin_notes`
- Strip dead types from `supabase/types.ts` (auto-regenerates)
- Outcome: codebase shrinks ~30%, mental model becomes "one product, one schema"

### Round 2 — Security & auth correctness

- Migrate `useAuth.tsx` and every route guard to read role from `user_roles` (via the existing `has_role` security-definer function) instead of `profiles.role`
- Drop `profiles.role` column after migration
- Run the Supabase linter and fix every flagged RLS policy
- Audit every table's RLS for the "agent can only see their own rows" invariant
- Add a `verification_status` enum check and one canonical helper

### Round 3 — Workflow completion (the agent journey)

Make the spine bulletproof. In order:

1. Launchpad → dashboard hand-off (no loops, no stuck states)
2. Clients (CRUD + detail page that shows the client's exchanges, matches, connections)
3. Exchanges (wizard + edit + detail with timeline + identification list)
4. Pledged properties (CRUD + status transitions)
5. Matches (list with filters/sort, detail with the comparison visuals we already built)
6. Connections (kanban with real stage transitions, accept/decline that actually fires)
7. Messages (threads link from connections, realtime, unread counts shared with sidebar)
8. Notifications (every row has a working link)

Each step ends with me clicking through it in the preview.

### Round 4 — Admin tooling (one real backend, not seven half-built pages)

- One `/admin` dashboard with: agent directory, exchange overview, connection oversight, match-run health, support tickets
- Built from scratch as one cohesive area, not the orphaned pages
- Role-protected via `user_roles` (after Round 2)

### Round 5 — Design pass (polish, not redesign)

Keep launchpad. Keep Inter + blue-600 + light theme. Fix:

- Move every hardcoded hex into semantic tokens in `index.css` + `tailwind.config.ts`
- One canonical: button, badge, card, empty-state, loading-skeleton, error-state, page-header, section-header
- Mobile sweep across every agent page
- Split `Index.tsx` (4,854 lines) into composed sections under `src/components/landing/`
- Split `AgentMatchDetail.tsx` (1,206 lines) into subcomponents
- Consolidate formatters (currency, date, percent) into one helper

### Round 6 — Observability & code health

- Centralized error boundary + toast on every mutation failure
- Edge-function log review + retry surfaces for failed match runs
- React Query keys + invalidation map documented in one file
- Replace dev-seeded mock data with a proper "demo mode" toggle
- Remove `seedMockData` from production builds

---

## How we start

Say "approve Round 1" and I'll delete the dead product. Nothing else changes until you see that diff and like it. Each subsequent round needs its own approval.

If you want to reshuffle — e.g. do design first, or keep some of the client pages because you might revive a client portal later — tell me before Round 1 and I'll revise.

### Open question I need answered before Round 1

**The client portal**: `src/pages/client/*` was built for clients to log in and self-serve. Right now it's redirected to `/unavailable`. Do you want to:

(a) Delete it permanently — clients only ever interact via their agent
(b) Keep the files dormant — you might revive a client portal in v2
(c) Revive it as part of this work — clients get accounts again

My recommendation is (a), matching your "private matching platform, not a marketplace" positioning.
