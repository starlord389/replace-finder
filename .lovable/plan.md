# Wire pricing waitlists — separate Team and Brokerage tables

## What's currently broken

The `WaitlistModal` in `src/pages/Home.tsx` (lines 1496–1564) is used by **both** the Team plan and the Brokerage plan in the pricing section. When a visitor submits, it just flips to a success state — there's a `// TODO: persist the lead` comment and nothing is sent to the backend. Both audiences' leads are being dropped.

Every other public form on the site is already wired (BookDemo → `demo_requests`, ForLandlords → `referrals`, auth → Lovable Cloud, help → `support_tickets`). This is the only gap.

## Plan

### 1. Create two separate tables (one migration)

**`team_waitlist_signups`** — leads from the Team plan CTA
**`brokerage_waitlist_signups`** — leads from the Brokerage plan CTA

Both tables have the same shape:
- `name` (required)
- `email` (required)
- `phone` (optional)
- `company` (optional)
- standard `id`, `created_at`, `updated_at`

Keeping them as two distinct tables (instead of one shared table with a `plan` column) makes it obvious at a glance who's interested in which product, makes exports/admin views per-audience trivial, and lets the schemas drift independently later (e.g. Brokerage may later need team-size or seat-count fields that don't apply to Team).

**Access rules (in plain English), identical for both tables:**
- Anyone, including signed-out visitors, can submit a waitlist signup (the pricing section is public).
- Only admins can view, edit, or delete waitlist entries — uses the existing `has_role(auth.uid(), 'admin')` function.
- Service role retains full access for future admin/export tooling.

### 2. Wire the modal to the correct table

In `src/pages/Home.tsx`:

- Pass a `planKey: "team" | "brokerage"` prop into `WaitlistModal` alongside the existing display `plan` name. The display name keeps the modal title/copy unchanged ("Join the Team waitlist", "Join the Brokerage waitlist"); the key decides which table to write to.
- Derive `planKey` from the selected pricing plan in `PricingSection` (line 1566+) — the existing `PLANS` array already differentiates them by index/name, we just add a stable key.
- Convert `submit` to async. On valid input:
  - `planKey === "team"` → insert into `team_waitlist_signups`
  - `planKey === "brokerage"` → insert into `brokerage_waitlist_signups`
- Add a `submitting` state to disable the button (label flips to "Joining…") so visitors can't double-submit.
- On error: show a destructive toast (`useToast`) and keep the form open for retry.
- On success: keep the existing "You're on the list!" confirmation exactly as it is.
- Remove the TODO comment.

If the pricing section ever grows a third plan with a waitlist (e.g. Enterprise), the pattern is to add another table and another `planKey` branch — no shared bucket to untangle later.

### Technical notes

- Public insert policy uses `WITH CHECK (true)` on both tables — same pattern already used by `demo_requests` and `referrals`. Reads stay locked to admins so lead lists aren't exposed via the Data API.
- Grants per table: `INSERT` to `anon` and `authenticated`; `SELECT/UPDATE/DELETE` gated by admin policy; `ALL` to `service_role`. No `SELECT` grant to `anon`.
- Each table gets the standard `updated_at` trigger using the existing `public.update_updated_at_column()` function.
- No visual changes to the modal, the pricing cards, or any copy.
