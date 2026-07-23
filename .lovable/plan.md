
## Goal
Notify you (eamon.t.mckenna123@gmail.com) and Steve (steve@multifamilyproperties.com) automatically whenever:
1. A new **agent** signs up
2. A new **landlord** requests an agent (referral submission)
3. An agent **activates a new listing**

## Approach
Use the existing Lovable Emails transactional pipeline (`send-transactional-email` + `notify.1031exchangeup.com`) — no new infrastructure needed.

### 1. New email template
Create one flexible internal template `internal-admin-notification` in `supabase/functions/_shared/transactional-email-templates/` with props: `eventType`, `title`, `summary`, `detailsList` (label/value pairs), and optional `link`. Register it in `registry.ts`. Styled minimally in brand colors — this is an internal ops email, not customer-facing.

### 2. Shared recipient constant
Add `ADMIN_NOTIFY_EMAILS = ["eamon.t.mckenna123@gmail.com", "steve@multifamilyproperties.com"]` inside the trigger sites (edge functions). Send one invocation per recipient so each gets their own idempotency key and unsubscribe token.

### 3. Trigger wiring
- **Agent signup**: hook into `handle_new_user` path. Since that's a DB trigger, the cleanest place is a lightweight edge function `notify-admin-signup` invoked from the client right after successful signup in `src/pages/auth/Signup.tsx` (role=agent). Fire-and-forget; failures logged, never block signup.
- **Landlord referral**: in the referral submission flow (the same code path that inserts into `public.referrals`), after successful insert, invoke `send-transactional-email` with the referral details. Locate the exact submission handler during build.
- **New listing activation**: in `supabase/functions/create-exchange/index.ts` (on `activate: true`) and in `supabase/functions/update-exchange/index.ts` (on `intent: "publish"` / `save_active` where status transitions to active), after the exchange is created/published, send admin notifications with property address, agent name, asking price, and a link to the admin exchange detail page.

### 4. Idempotency
Each send uses a key like `admin-signup-{userId}-{recipientEmail}`, `admin-referral-{referralId}-{recipientEmail}`, `admin-listing-{exchangeId}-{recipientEmail}` so retries never double-send.

### 5. Deploy
Deploy `send-transactional-email`, `create-exchange`, `update-exchange`, and the new `notify-admin-signup` function.

## Out of scope
- No admin UI setting to change recipients — hardcoded per your request. Can move to `app_settings` later if you want to manage from the admin panel.
- No email on drafts, only on activation/publish.
- No email on agent-invited client signups (only self-serve agent signups and landlord referrals).
