# Verify & Harden the Matching Engine

Goal: guarantee that every new listing (buyer exchange or seller property) runs the matching algorithm immediately, produces correct scored matches, and notifies both sides by email — reliably, in production.

## 1. Audit current behavior (no code changes yet)

Trace each entry point and confirm what actually runs today:

- `create-exchange` / `update-exchange` → calls `run-auto-matching` for the buyer exchange? Verify `sendNewMatchEmails` fires.
- `create-property` / `update-property` (seller side pledged_properties) → does it trigger matching against all active buyer exchanges? This is the most likely gap.
- `run-auto-matching` core in `matching-core.ts` — confirm the 6-dimension scoring (price 25 / geo 20 / asset 20 / strategy 15 / financial 10 / timing 10) matches the spec, filters demo rows, applies "upgrades only" rule, and dedupes existing matches.
- Email pipeline: `new-match-notification` template, `send-transactional-email`, queue processor, `email_send_log` results for recent test runs.

Deliverable: short findings note listing any gap (missing seller-side trigger, missing email, mis-scored dimension, etc.).

## 2. Fix the gaps found

Likely fixes (confirmed after audit):

- **Seller-side trigger**: when a `pledged_properties` row is created/activated, run matching for that property against all active buyer exchanges and insert new `matches` rows.
- **Bilateral notifications**: send `new-match-notification` to BOTH the buyer-side agent and seller-side agent for each genuinely new, non-demo match (today only buyer-side may fire).
- **Idempotency**: use a stable idempotency key like `match-notify-<matchId>-<recipientRole>` so re-runs don't double-send.
- **Deep links**: verify `/agent/matches?listing=…&match=…` opens the correct match for each recipient (buyer vs seller perspective).
- **Filters**: enforce `is_demo = false`, active status, and upgrades-only in one shared helper so both entry points behave identically.

## 3. Admin QA surface (small, admin-only)

Add a lightweight "Matching QA" panel under the admin area:

- Show last N matching runs (trigger source, listing id, candidates evaluated, new matches created, emails queued).
- "Re-run matching" button for a specific exchange or property (admin only).
- Link into `email_send_log` filtered to `new-match-notification`.

## 4. Automated verification

- Deno tests for `matching-core.ts`: score math per dimension, upgrades-only rule, demo exclusion, dedupe.
- End-to-end check via Playwright against the running preview:
  1. Create a buyer exchange as one seeded agent → assert matches row + email log row.
  2. Create a seller property as another agent that fits → assert new match + emails to both sides.
  3. Re-run same creation → assert no duplicate match, no duplicate email.

## 5. Deploy & monitor

Redeploy affected functions (`create-exchange`, `update-exchange`, `create-property`/`update-property` equivalents, `run-auto-matching`, `send-transactional-email`). Watch `email_send_log` and edge function logs for the first real runs.

## Technical notes

- Files likely touched: `supabase/functions/_shared/matching-core.ts`, `create-exchange/index.ts`, `update-exchange/index.ts`, the property create/update function(s), `run-auto-matching/index.ts`, `send-transactional-email` template registry, new admin page under `src/pages/admin/`.
- No schema change expected unless the audit uncovers a missing column (e.g. a `last_matched_at` on `pledged_properties`).
- All new writes must respect existing RLS; admin QA panel gated by `has_role(auth.uid(), 'admin')`.

## Question before I start

Do you want me to (a) just audit + fix real gaps I find, or (b) also build the admin "Matching QA" panel in step 3? It's useful long-term but adds ~1 extra round of work.