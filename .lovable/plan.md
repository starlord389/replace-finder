# Unify Matches + Connections + Messages

## The insight

Today's three tabs are actually three **stages of one relationship**:

```
Match found → Connection requested → Conversation underway → Deal closed
   (lead)         (handshake)            (active dialogue)        (won/lost)
```

Splitting them forces agents to mentally re-stitch the same counterparty across three pages. A buyer's agent who matched on a property, sent a connection, and is now negotiating in chat has to open three tabs to see one story. We collapse it into a single **Matches** hub where each row is the counterparty relationship and the stage is just metadata.

## New IA

Sidebar loses "Connections" and "Messages". One entry remains:

- **Matches**  ·  badge = pending connections + unread messages combined

Old routes redirect:
- `/agent/connections` → `/agent/matches?stage=connected`
- `/agent/connections/:id` → `/agent/matches/:id` (same detail view, opens Conversation tab by default if connected)
- `/agent/messages` → `/agent/matches?stage=conversing`
- `/agent/messages/:threadId` → `/agent/matches/:id` (opens Conversation tab)

## The page: `/agent/matches`

A **master–detail (two-pane) layout**, inbox-style. This is the key UX shift — no more navigating away to "see the next match".

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  Matches                                              [+ New Exchange]  │
├──────────────────────────────────────┬──────────────────────────────────┤
│ Stage:  All · New · Connected ·      │                                  │
│         Conversing · Closed          │   ── DETAIL PANE ──              │
│ Side:   Buy · Sell    Sort: Recent ▾ │                                  │
│ 🔍 Search counterparty, property…    │   Counterparty header            │
├──────────────────────────────────────┤   ┌──────────────────────────┐   │
│ ● Jane Doe · Acme Realty       2m   │   │ Overview │ Conversation │   │
│   123 Main St · $4.2M · 92%         │   │ Property │ Timeline     │   │
│   [Conversing] · 3 unread     ●●●   │   └──────────────────────────┘   │
├──────────────────────────────────────┤                                  │
│ ○ Mark Singh · Coast Group    1h    │   (contents of selected tab)     │
│   456 Oak Ave · $2.8M · 87%         │                                  │
│   [Connected] · awaiting reply       │                                  │
├──────────────────────────────────────┤                                  │
│ ○ Lin Park · Apex CRE         3d    │                                  │
│   New match · 81%                    │                                  │
│   [New] · [Connect]                  │                                  │
└──────────────────────────────────────┴──────────────────────────────────┘
```

### Left list (one row per relationship)

Each row shows:
- Counterparty name + brokerage, avatar
- Subject property + price + match score
- **Stage chip**: `New` · `Connected` · `Conversing` · `Closed-Won` · `Closed-Lost`
- Right-side signal: unread count, "awaiting your reply", "their turn", or the primary CTA (`Connect`, `Accept`, `Reopen`)
- Last activity timestamp

Stage filter pills across the top double as the old tabs. Default view = "All, sorted by last activity" so the agent's day starts at the top of the list.

### Right detail pane — four tabs

Tab opens contextually based on stage (New → Overview, Connected → Conversation, etc.):

1. **Overview** — match score breakdown, counterparty agent profile card, mutual exchange context, primary action button (Connect / Decline / Mark Closed).
2. **Conversation** — the message thread (the old `AgentMessages` thread view, embedded). Disabled until stage ≥ Connected with a "Connect first to message" empty state.
3. **Property** — the subject property card pulled from the old match detail page.
4. **Timeline** — chronological feed: matched → connection sent → accepted → first message → … → closed. Single source of truth for "what happened with this deal".

## Why this works

- **One row = one relationship.** Stage is just a filter, not a separate page.
- **Inbox pattern is familiar** (Linear, Front, Superhuman, HubSpot). Agents spend their day here, so it should behave like an inbox, not three CRM tabs.
- **Keyboard-friendly**: `j/k` to move through list, `Enter` to open Conversation, `c` to Connect, `e` to archive. Future-friendly for the ⌘K work already on the backlog.
- **Badge consolidation** removes the "which red dot do I click first?" decision.
- **Mobile** collapses to single-pane: list view → tap → detail view → back.

## Implementation

### New
- `src/pages/agent/AgentMatchesHub.tsx` — owns layout, list state, URL sync (`?stage=`, `?id=`, `?tab=`).
- `src/features/matches/components/MatchListItem.tsx` — unified row.
- `src/features/matches/components/MatchDetailPane.tsx` — tab shell.
- `src/features/matches/components/tabs/{OverviewTab,ConversationTab,PropertyTab,TimelineTab}.tsx` — extracted from existing pages.
- `src/features/matches/hooks/useUnifiedMatches.ts` — one query joining `matches`, `connections`, and `message_threads`, returning a `relationship[]` with a derived `stage` field.

### Reused (no logic change)
- Match scoring, connection mutations, message-send mutation, realtime channel — all lift-and-shifted into the tab components.

### Removed from sidebar / routes
- `AgentConnections.tsx`, `AgentMessages.tsx` deleted after redirects are in place.
- `AgentMatches.tsx`, `AgentMatchDetail.tsx`, `AgentConnectionDetail.tsx` retired in favor of the hub (their JSX is recycled inside the tab components).

### Sidebar
- `AgentSidebar.tsx`: drop the Connections and Messages items; Matches badge = `pendingConnections + unreadMessages`.

### Backwards compat
- All old URLs redirect via `<Navigate>` in `App.tsx` so existing notifications and email deep-links still resolve.

## Out of scope (for this round)
- Bulk actions on the list (multi-select archive, etc.).
- Saved views / custom filters.
- The ⌘K global search (already on the backlog as M8) will plug into this hub later.

## Open question

Do you want **Closed** deals visible by default in "All", or hidden behind a toggle (like Gmail's archived)? Recommendation: hidden by default, surfaced via the stage filter — keeps the working list focused on live deals.
