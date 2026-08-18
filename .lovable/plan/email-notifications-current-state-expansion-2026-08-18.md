# Email notifications: current state + expansion

## What exists today

**Templates in place (5):**
| Template | Sent when | Recipient |
|---|---|---|
| new-match-notification | Matching engine creates a new match | Agent/investor on the match |
| representation-invite | Agent invites an investor to be represented | Investor |
| referral-acknowledgement | Landlord requests a referral agent | Requester |
| admin-direct-message | Admin sends a message from the command center | Chosen user |
| internal-admin-notification | Every intake form (signup, listing, demo, event, ticket, inquiry) | You + Steve |

**Preferences:** a `user_notification_preferences` table already exists with 4 flags (new match, connection request, connection accepted, new message). It is only surfaced in Agent Settings, and **nothing enforces it** — the match email sends regardless of the toggle. Investors have no preferences UI at all.

## What to add

### 1. New user-facing email workflows
- **Welcome email** — on first signup, role-aware (agent vs investor), links to next step (Launchpad / create exchange).
- **New message digest** — someone messaged you in a conversation and you haven't read it (batched, max 1 per conversation per hour).
- **Connection request received** — agent expresses interest / representation request pending your action.
- **Connection accepted** — your representation or connection request was accepted, with a link to the conversation.
- **Listing inquiry received** — an investor inquired on your listing.
- **Exchange activated confirmation** — after activating an exchange, confirming monitoring is live.
- **Weekly match digest** — opt-in weekly summary of new matches and pipeline activity (skipped when there's nothing new).
- **Stale exchange nudge** — exchange active 30 days with no accepted match, prompting criteria review.

### 2. Notification Center for users
A single **Notifications** page shared by agents and investors (`/agent/notifications`, `/investor/notifications`), with grouped toggles:

- **Matches** — new match email, weekly digest
- **Connections** — request received, request accepted
- **Messages** — new message email
- **Listings** — inquiry received
- **Account & product** — activation confirmations, occasional product updates

Each toggle writes to `user_notification_preferences`. Critical account/security and legally required emails are shown as always-on and not toggleable.

### 3. Enforcement (the important part)
Preferences must be checked **server-side** before every send, so a toggle actually works.

## Technical notes

- Extend `user_notification_preferences` with the new boolean columns (all default `true` except the weekly digest, default `true`, and product updates, default `true`); keep RLS owner-scoped and add the required GRANTs.
- Add a `public.email_pref_allows(_user_id uuid, _key text)` SECURITY DEFINER function returning `true` when no row exists (default-on).
- Add a shared `sendUserEmail()` helper in `supabase/functions/_shared/` that resolves the recipient's user id, calls `email_pref_allows`, checks suppression, and only then calls `send-transactional-email`. Migrate the existing match email in `matching-core.ts` onto it.
- Add the new templates as React Email `.tsx` files in `_shared/transactional-email-templates/` and register them in `registry.ts`, matching the existing brand styling.
- New triggers: a `notify-user-event` edge function invoked from message insert, connection request/accept, inquiry, and exchange activation paths; a pg_cron-scheduled `send-weekly-digest` function for the digest and stale-exchange nudge.
- Frontend: a shared `NotificationPreferences` component plus routes in both workspaces, driven by an extended `useNotificationPrefs` hook.
- Deploy all touched edge functions after the changes.

## Suggested order
1. Preferences schema + enforcement helper + Notification Center UI (makes everything else safe to ship).
2. Welcome, connection request/accepted, new message, listing inquiry emails.
3. Exchange activation confirmation, weekly digest, stale nudge.
