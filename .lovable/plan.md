# Agent App: Cleanup + New Features

Eight items, grouped by area. I'll do the cleanup first (low risk), then quick wins, then the bigger feature builds.

---

## Part 1 — Cleanup & merges

### R1. Remove duplicate chat from Connection Detail
- Strip the inline messaging panel (state, fetch, send handler, composer) out of `AgentConnectionDetail.tsx`.
- Replace with a single "Open conversation →" button that links to `/agent/messages?connection={id}`.
- Update `AgentMessages.tsx` to read the `connection` query param and auto-select that thread on load.
- Connection Detail keeps milestones, property info, counterpart contacts, and (later, M7) documents.

### R2. Make Connections list navigate-only
- Remove `handleAccept` / `handleDecline` (and their Supabase mutations + notification writes) from `AgentConnections.tsx`.
- List cards become click-to-navigate only.
- Accept/decline lives exclusively on `AgentConnectionDetail.tsx` where the agent has full context.

### R3. Make seller-side match cards clickable
- On `AgentMatches.tsx`, wrap each seller card in a `Link` to a read-only match detail view.
- Reuse `AgentMatchDetail.tsx` with a "seller perspective" mode: same layout, but hide buyer-only initiate-connection actions and instead show counterpart status (e.g. "Buyer agent has initiated", "No active interest yet").

---

## Part 2 — Quick wins

### M3. Pre-fill client when creating a new exchange from Client Detail
- Change the "New Exchange for This Client" link on `AgentClientDetail.tsx` from `/agent/exchanges/new` to `/agent/exchanges/new?client={id}`.
- In `StepSelectClient` (under the New Exchange wizard), read `?client=` from the URL on mount, pre-select that client, and lock the picker (with a "Change client" link that clears the param).

### M5. Real client invite flow
- Replace the "coming soon" toast on `AgentClientDetail.tsx` with a working invite:
  1. Agent clicks Invite → confirm dialog with the client's email.
  2. Create a `client_invites` row (token, client_id, agent_id, email, expires_at, status).
  3. Send an email via an edge function (Resend or built-in mail) with a signup link `/auth/accept-invite?token={token}`.
  4. On signup, the accept-invite page validates the token, completes signup, and populates `client_user_id` on the `clients` row.
- Show invite status on the client card ("Invited 2 days ago — resend").

---

## Part 3 — New features

### M2. Notifications center
- **Bell in `AgentHeader`:** unread count badge, dropdown showing the latest ~10 notifications with link + read/unread state. Clicking a notification marks it read and navigates.
- **`/agent/notifications` page:** full paginated feed, filter by type (connection / match / message / milestone), mark all read.
- **Hook:** `useNotifications` for unread count + recent list, with Supabase realtime subscription on the `notifications` table so the bell updates live.

### M4. Agent profile page + counterpart view
- **`/agent/profile`:** editable page with avatar upload (Supabase storage), bio, brokerage, license number, years of experience, optional public stats (completed exchanges count).
- Profile fields are added as columns on the `profiles` table (or a new `agent_profiles` table if cleaner).
- **Counterpart read view:** on `AgentConnectionDetail.tsx`, replace the basic contact block with a richer profile card pulling these new fields. RLS policy: agents can read another agent's public profile fields only when they share an accepted connection.
- Avatar appears in the sidebar/header for the logged-in agent.

### M6. Post-initiation confirmation dialog
- After "Initiate Connection" succeeds on `AgentMatchDetail.tsx`, open a confirmation dialog instead of silently navigating.
- Dialog recaps: counterpart agent has been notified, facilitator fee acknowledged, agent identities will be revealed on acceptance, expected response window.
- Primary action: "Go to Connections" → `/agent/connections`. Secondary: "Stay here".

---

## Technical notes

**New/changed DB objects**
- `notifications` table: add `read_at timestamptz`, index on `(user_id, read_at)`. Enable realtime.
- `profiles` table: add `avatar_url`, `bio`, `license_number`, `years_experience`, `public_stats_opt_in`. New RLS policy for counterpart reads via `connections` join.
- `client_invites` table: `id`, `client_id`, `agent_id`, `email`, `token`, `status`, `expires_at`, `created_at`. RLS scoped to agent_id.
- Storage bucket `agent-avatars` (public read).

**Edge functions**
- `send-client-invite` — generates token row + sends email.
- (Reuse existing email infra if present; otherwise add Resend.)

**Routing additions**
- `/agent/notifications`
- `/agent/profile`
- `/auth/accept-invite`
- `/agent/messages?connection={id}` (param handling, not a new route)
- `/agent/exchanges/new?client={id}` (param handling)

**Ordering of work**
1. R2, R3, M3 (small, isolated edits)
2. R1 + M6 (Connection Detail + Match Detail refactors)
3. M2 (notifications — needs schema + realtime + header changes)
4. M4 (profile — schema + storage + counterpart view)
5. M5 (invite flow — schema + edge function + accept page)

---

## Out of scope (kept for later)
R4, R5, M1 (deadline calendar), M7 (documents), M8 (global search), M9 (analytics).
