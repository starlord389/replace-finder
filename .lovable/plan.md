

## Build out the Messages tab as a real inbox

The `Messages` page in the sidebar is currently a hardcoded empty-state placeholder — it never queries the database. Your conversations exist (and work) inside each connection's detail page, but there's no unified inbox aggregating them. I'll convert it into a proper two-pane messaging inbox.

### What you'll see after the fix

A Slack/iMessage-style **two-pane inbox** at `/agent/messages`:

**Left pane — Conversation list**
- One row per `exchange_connection` you're part of (buyer or seller side) where messaging is allowed (status `accepted` or `completed`)
- Each row shows: counter-party agent's name + avatar initial, property name (replacement property), last message preview (truncated), relative timestamp ("2h ago"), and an unread dot/count if the latest message wasn't sent by you and you haven't opened the thread
- Sorted by most recent message first
- Search box at top to filter by agent name or property
- Active conversation highlighted

**Right pane — Active thread**
- Header: counter-party name, property name, "View connection →" link to the full connection detail page
- Scrollable message history (same bubble UI as in `AgentConnectionDetail` — own messages right-aligned in primary color, theirs left-aligned in muted)
- Composer at bottom: textarea + send button, Enter-to-send / Shift+Enter for newline (matches existing pattern)
- Auto-scrolls to newest message
- Empty state when no conversation selected: "Select a conversation to start messaging"

**Mobile** — single-pane: list view, tap a row to open the thread, back button returns to list.

### How it works

1. **Data fetch**: One query loads all `exchange_connections` where `buyer_agent_id = me OR seller_agent_id = me` AND `status IN ('accepted','completed')`. For each, fetch the latest message + counter-party profile + replacement property name in parallel.
2. **Thread loading**: When a conversation is selected, fetch all `messages` where `connection_id = selected.id` ordered by `created_at`.
3. **Sending**: Insert into `messages` with `sender_id = auth.uid()`, `connection_id`, `content` (matches existing flow that already works in `AgentConnectionDetail`).
4. **Realtime** (nice-to-have, included): Subscribe to `postgres_changes` on `messages` filtered by `connection_id IN (my connections)` so new messages appear without refresh. Requires adding `messages` to the `supabase_realtime` publication.
5. **Unread tracking**: A message counts as unread for me if `sender_id != me` AND `read_at IS NULL`. When I open a thread, mark all incoming messages in it as read by updating `read_at = now()` where `connection_id = X AND sender_id != me AND read_at IS NULL`.

### Technical changes

| File | Change |
|---|---|
| `src/pages/agent/AgentMessages.tsx` | Full rewrite — two-pane inbox component |
| `src/features/messages/hooks/useConversations.ts` (new) | React Query hook fetching connection list + last message + counter-party profile + property |
| `src/features/messages/hooks/useMessageThread.ts` (new) | React Query hook fetching messages for a connection + realtime subscription + send mutation |
| `src/features/messages/hooks/useMarkRead.ts` (new) | Mutation to mark thread messages as read |
| Migration | `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;` and add UPDATE policy on `messages` so recipients can mark `read_at` (currently messages have no UPDATE policy at all — this is also why no read receipts work) |
| `src/components/layout/AgentHeader.tsx` (small) | Show unread message count badge on the bell or sidebar Messages link (optional, nice polish) |

### RLS / security notes

- Reads already work — `Connection members can read messages` policy covers it
- Sends already work — `Connection members can send messages` policy covers it
- Need a new UPDATE policy on `messages`: allow recipient (connection member who is NOT the sender) to set `read_at` only

### Out of scope

- Message attachments / images
- Typing indicators
- Message editing or deletion
- Group threads (every connection is strictly 2-party)

