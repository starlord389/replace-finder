

## Add comprehensive mock data across all agent features

The seed currently inserts skeleton rows but every detail page is missing the rich data that makes the UI light up: no property financials, no images, no replacement criteria, no timeline events, only 3 matches with no boot calc, only 4 messages on one connection. I'll deepen the seed so every page has realistic content.

### What you'll see after re-seeding

**Dashboard** — pipeline stats, urgent deadlines, unreviewed matches, pending connections (already working, will be re-verified)

**Clients** (`/agent/clients`) — 5 clients each with notes, company, exchange counts

**Exchanges list & detail** (`/agent/exchanges`, `/agent/exchanges/:id`) — 6 exchanges across all statuses, each detail page now shows: deadlines countdown, full property card (address, asset type, year, units, SF), full financials (asking price, NOI, cap rate, occupancy, loan balance), replacement criteria (asset types, states, price range, metros, year built), and a 4–6 event timeline (created, property pledged, criteria added, matches generated, connection initiated, milestone updates)

**Matches list & detail** (`/agent/matches`, `/agent/matches/:id`)
- ~10 buyer-side matches (your active/in_identification exchanges → counter-party properties), with full per-dimension scores so the radar/breakdown chart renders
- 4 seller-side matches (your pledged properties matched to other agents' exchanges) — populates the "Your Properties Matched" section
- Full property images (3 per counter-party listing, Unsplash CDN URLs) so the carousel and lightbox work
- Boot calculations populated (`estimated_cash_boot`, `estimated_mortgage_boot`, `estimated_total_boot`, `boot_status` mix of no_boot / minor_boot / significant_boot) so badges and filter chips render
- Mix of `buyer_agent_viewed: false` (shows "New" badge) and viewed
- All 8 score dimensions populated (price, geo, asset, strategy, financial, timing, scale_fit, debt_fit) so the breakdown bars render

**Connections** (`/agent/connections`, `/agent/connections/:id`)
- 4 connections covering every tab: 1 inbound pending, 1 outbound pending, 1 accepted (active with mid-pipeline progress: under_contract_at + inspection_complete_at set), 1 completed (all milestones + closed_at set)
- Active connection has a 12-message back-and-forth thread with timestamps spread over 5 days so the messaging UI is fully testable
- Completed connection also has a few messages
- Counter-party agent profiles have email + phone so the revealed contact cards have all fields filled

**Messages** — testable end-to-end on any accepted connection (you can send new messages, they'll persist via existing `messages` insert flow)

**Notifications** (header bell) — 7 unread covering every type: `new_match`, `connection_request`, `connection_accepted`, `connection_milestone`, `deadline_warning`, `deadline_critical`, `message_received`

### Technical changes

1. **`src/features/dev/seedMockData.ts`** — extend the existing flow to also insert:
   - `property_financials` for all 4 of your pledged properties + both counter-party properties (asking_price, NOI, cap_rate, occupancy_rate, loan_balance, GSI, EGI, expense breakdown, debt_service)
   - `property_images` (3 per property, Unsplash URLs as `storage_path` — Match Detail uses `supabase.storage.from("property-images").getPublicUrl(...)` which works with full URLs as paths only when bucket is public — instead use direct URL pattern in `storage_path`)
   - `replacement_criteria` (1 per active/in_identification exchange) and patch `exchanges.criteria_id`
   - More matches: 10 buyer-side total (multiple per exchange across both counter-party properties) + 4 seller-side matches by inserting buyer_exchange_ids from a fake "external" exchange (we'll create 2 exchanges owned by counter-party agents via the edge function)
   - Boot calculations on every match
   - 2 more connections (1 outbound pending, 1 completed with all milestones)
   - 12-message thread on the active connection + 4 messages on the completed one
   - 6–8 timeline events across 3 of the exchanges
   - 7 notifications (was 5)

2. **`supabase/functions/seed-counterparty-agents/index.ts`** — also create:
   - 1 `agent_clients` row per counter-party agent
   - 1 `exchange` per counter-party (so seller-side matches have a real `buyer_exchange_id` from the other side's perspective)
   - `property_financials` + `property_images` for their listings

3. **`src/features/dev/clearMockData.ts`** — extend cleanup to also remove `property_financials`, `property_images`, `replacement_criteria`, and `exchange_timeline` rows tied to the mock properties/exchanges

4. **Image URLs** — `property_images.storage_path` will store the bucket path. Since we can't actually upload files from the browser, store known stock image filenames in the existing public `property-images` bucket. Fallback: use a known valid placeholder path that the UI will gracefully degrade from. The list UI shows `Building2` icon when no `coverUrl`, so I'll seed proper public Unsplash URLs and adjust the cover-URL helper to pass through full URLs.

5. **Auto-run after seeding** — the existing "Seed Mock Data" button on the dashboard will pick all this up. I'll also add a clear → re-seed flow for easy iteration.

### Constraints respected

- All inserts go through the client SDK or service role (counter-parties only) — RLS preserved
- Every mock row tagged so cleanup removes only mock data
- Idempotent: clearing first then re-seeding is safe
- No schema changes needed — all tables/columns already exist

