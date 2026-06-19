# Wire the footer newsletter form

## What's left

I swept all public pages, landing components, and footers. After wiring the pricing waitlists, there's **one** remaining unwired input:

**`src/components/layout/LandingFooter.tsx`** — the "Sign up for our newsletter" form (lines 14–30). Its `onSubmit` is just `event.preventDefault()` — the email goes nowhere. Anyone subscribing from the homepage footer is silently dropped.

Everything else checks out:
- `BookDemo` → `demo_requests` ✅
- `ForLandlords` referral form → `referrals` ✅
- Pricing Team/Brokerage waitlists → `team_waitlist_signups` / `brokerage_waitlist_signups` ✅ (just shipped)
- Footer "Contact Us" / large `support@…` link → `mailto:` (intentional, no DB needed)
- Auth forms → Lovable Cloud auth ✅
- Agent help/support → `support_tickets` ✅

## Plan

### 1. Create `newsletter_subscribers` table (migration)

Columns:
- `email` (text, required, **unique**) — prevents duplicate signups
- `source` (text, default `'landing_footer'`) — lets future entry points (e.g. blog, dashboard upsell) share the table without losing attribution
- standard `id`, `created_at`, `updated_at`

Access rules (plain English):
- Anyone, including signed-out visitors, can subscribe.
- Only admins can view, edit, or delete subscribers — uses the existing `has_role(auth.uid(), 'admin')` function.
- Service role keeps full access for admin/export tooling.

Duplicate handling: insert uses an `ON CONFLICT (email) DO NOTHING` pattern (via an upsert with `ignoreDuplicates: true`) so resubscribing the same email shows the same success state instead of an error toast.

### 2. Wire `LandingFooter.tsx`

- Convert the footer to a client component with `useState` for the email value and a `submitting` flag.
- On submit:
  - Trim the email, validate the same regex used elsewhere (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), cap length at 255.
  - Insert into `newsletter_subscribers` via the existing supabase client (`@/integrations/supabase/client`).
  - On success: clear the input and swap the button label to a brief "Subscribed ✓" confirmation for ~2.5s, then reset. Uses the existing `toast` helper for the success/error message — matches the pattern used by `BookDemo` and `ForLandlords`.
  - On error: destructive toast, keep the input value so the user can retry.
- The button is disabled while submitting; label flips to "Subscribing…".

### Technical notes

- Same RLS pattern as the waitlist tables: `INSERT` open to `anon`/`authenticated`, `SELECT/UPDATE/DELETE` admin-only, `service_role` full access.
- `email` column gets a unique index so duplicates are silently ignored without exposing whether an address is already in the list.
- No visual or layout changes to the footer — same pill-shaped input, same Subscribe button, same dimensions.
